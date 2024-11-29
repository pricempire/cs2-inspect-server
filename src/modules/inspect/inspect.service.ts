import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common'
import * as fs from 'fs'
import { ParseService } from './parse.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Asset } from 'src/entities/asset.entity'
import { History } from 'src/entities/history.entity'
import { Repository } from 'typeorm'
import { FormatService } from './format.service'
import { HistoryType } from 'src/entities/history.entity'
import { PricempireService } from '../pricempire/pricempire.service'
import { HttpService } from '@nestjs/axios'
import { Cron } from '@nestjs/schedule'
import { InspectDto } from './inspect.dto'
import { Bot } from './bot.class'
import { createHash } from 'crypto'

@Injectable()
export class InspectService implements OnModuleInit {
    private readonly logger = new Logger(InspectService.name)
    private startTime: number = Date.now()
    private readonly QUEUE_TIMEOUT = 5000 // 5 seconds timeout
    private readonly MAX_RETRIES = 3
    private readonly MAX_QUEUE_SIZE = 100
    private throttledAccounts: Map<string, number> = new Map()
    private readonly THROTTLE_COOLDOWN = 30 * 60 * 1000 // 30 minutes in milliseconds

    private bots: Map<string, Bot> = new Map()
    private accounts: string[] = []
    private inspects: Map<string, {
        ms: string
        d: string
        resolve: (value: any) => void
        reject: (reason?: any) => void
        timeoutId: NodeJS.Timeout
        startTime?: number
        retryCount?: number
    }> = new Map()

    private nextBot = 0
    private currentRequests = 0
    private requests: number[] = []
    private success = 0
    private cached = 0
    private failed = 0

    constructor(
        private parseService: ParseService,
        private formatService: FormatService,
        @InjectRepository(Asset)
        private assetRepository: Repository<Asset>,
        @InjectRepository(History)
        private historyRepository: Repository<History>,
        private readonly pricempireService: PricempireService,
        private readonly httpService: HttpService,
    ) { }

    async onModuleInit() {
        this.logger.debug('Starting Inspect Module...')
        this.accounts = await this.loadAccounts()
        this.initializeAllBots()
    }

    private async loadAccounts(): Promise<string[]> {
        let accounts: string[] = []
        const accountsFile = process.env.ACCOUNTS_FILE || 'accounts.txt'

        try {
            if (fs.existsSync(accountsFile)) {
                accounts = fs.readFileSync(accountsFile, 'utf8').split('\n')
            } else {
                const fallbackLocations = [
                    'accounts.txt',
                    '../accounts.txt',
                    '/app/accounts.txt'
                ]

                for (const location of fallbackLocations) {
                    if (fs.existsSync(location)) {
                        accounts = fs.readFileSync(location, 'utf8').split('\n')
                        this.logger.debug(`Found accounts file at: ${location}`)
                        break
                    }
                }

                if (accounts.length === 0) {
                    throw new Error(`No accounts file found at ${accountsFile} or fallback locations`)
                }
            }

            accounts = accounts
                .map(account => account.trim())
                .filter(account => account.length > 0)

            if (accounts.length === 0) {
                throw new Error('No valid accounts found in accounts file')
            }

            // Randomize the accounts array
            accounts = accounts.sort(() => Math.random() - 0.5)

            this.logger.debug(`Loaded ${accounts.length} accounts`)
            return accounts

        } catch (error) {
            this.logger.error(`Failed to load accounts: ${error.message}`)
            throw error
        }
    }

    private async initializeAllBots() {
        const BATCH_SIZE = 100;
        const MAX_RETRIES = 3;

        for (let i = 0; i < this.accounts.length; i += BATCH_SIZE) {
            const batch = this.accounts.slice(i, i + BATCH_SIZE);
            const initPromises = batch.map(async (account) => {
                const [username, password] = account.split(':');

                // Check if account is throttled
                const throttleExpiry = this.throttledAccounts.get(username);
                if (throttleExpiry && Date.now() < throttleExpiry) {
                    this.logger.warn(`Account ${username} is throttled. Skipping initialization.`);
                    return;
                }

                let retryCount = 0;
                let initialized = false;

                while (retryCount < MAX_RETRIES && !initialized) {
                    try {
                        const bot = new Bot({
                            username,
                            password,
                            proxyUrl: process.env.PROXY_URL,
                            debug: true
                        });

                        bot.on('inspectResult', (response) => this.handleInspectResult(username, response));
                        bot.on('error', (error) => {
                            this.logger.error(`Bot ${username} error: ${error}`);
                        });

                        await bot.initialize();
                        this.bots.set(username, bot);
                        this.logger.debug(`Bot ${username} initialized successfully`);
                        initialized = true;
                        // Clear throttle status if successful
                        this.throttledAccounts.delete(username);

                    } catch (error) {
                        if (error.message === 'ACCOUNT_DISABLED') {
                            this.logger.error(`Account ${username} is disabled. Blacklisting...`);
                            this.accounts = this.accounts.filter(acc => !acc.startsWith(username));
                            break;
                        } else if (error.message === 'LOGIN_THROTTLED') {
                            this.logger.warn(`Account ${username} is throttled. Adding to cooldown.`);
                            this.throttledAccounts.set(username, Date.now() + this.THROTTLE_COOLDOWN);
                            break;
                        } else if (error.message === 'INITIALIZATION_ERROR') {
                            this.logger.warn(`Initialization timeout for bot ${username}. Retrying...`);
                            if (retryCount >= MAX_RETRIES) {
                                this.logger.error(`Max retries reached for bot ${username}. Initialization failed.`);
                            }
                        } else {
                            this.logger.error(`Failed to initialize bot ${username}: ${error.message}`);
                        }
                        retryCount++;
                    }
                }
            });

            await Promise.allSettled(initPromises);
            this.logger.debug(`Initialized batch of ${batch.length} bots (${i + batch.length}/${this.accounts.length} total)`);
        }

        this.logger.debug(`Finished initializing ${this.bots.size} bots`);
    }

    public stats() {
        const readyBots = Array.from(this.bots.values()).filter(bot => bot.isAvailable()).length
        const busyBots = Array.from(this.bots.values()).filter(bot => !bot.isAvailable()).length
        const totalBots = this.bots.size
        const queueUtilization = (this.inspects.size / this.MAX_QUEUE_SIZE) * 100

        // Calculate uptime
        const uptime = Date.now() - this.startTime
        const days = Math.floor(uptime / (24 * 60 * 60 * 1000))
        const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
        const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000))
        const seconds = Math.floor((uptime % (60 * 1000)) / 1000)

        // Calculate average processing time
        const activeInspects = Array.from(this.inspects.values())
        const processingTimes = activeInspects
            .filter(inspect => inspect.startTime)
            .map(inspect => Date.now() - inspect.startTime)
        const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
            : 0

        // Get queue details
        const queueItems = Array.from(this.inspects.entries()).map(([assetId, inspect]) => ({
            assetId,
            elapsedTime: inspect.startTime ? Date.now() - inspect.startTime : 0,
            retryCount: inspect.retryCount || 0
        }));

        return {
            status: this.bots.size > 0 ? 'ready' : 'initializing',
            uptime: {
                days,
                hours,
                minutes,
                seconds,
                formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
            },
            bots: {
                ready: readyBots,
                busy: busyBots,
                total: totalBots,
                utilization: (totalBots > 0 ? (busyBots / totalBots) * 100 : 0).toFixed(2) + '%'
            },
            queue: {
                current: this.inspects.size,
                max: this.MAX_QUEUE_SIZE,
                utilization: queueUtilization.toFixed(2) + '%',
                avgProcessingTime: Math.round(avgProcessingTime) + 'ms',
                items: queueItems
            },
            metrics: {
                success: {
                    rate: ((this.success / (this.success + this.failed + this.cached)) * 100).toFixed(2) + '%',
                    count: this.success,
                },
                cached: {
                    rate: ((this.cached / (this.success + this.failed + this.cached)) * 100).toFixed(2) + '%',
                    count: this.cached,
                },
                failed: {
                    rate: ((this.failed / (this.success + this.failed + this.cached)) * 100).toFixed(2) + '%',
                    count: this.failed,
                },
                total: this.success + this.failed + this.cached
            },
            requests: {
                history: this.requests,
                current: this.currentRequests,
                average: this.requests.length > 0
                    ? (this.requests.reduce((a, b) => a + b, 0) / this.requests.length).toFixed(2)
                    : 0
            }
        }
    }

    public async inspectItem(query: InspectDto) {
        if (this.bots.size === 0) {
            throw new HttpException(
                'Service is still initializing, please try again later',
                HttpStatus.SERVICE_UNAVAILABLE
            )
        }

        if (this.inspects.size >= this.MAX_QUEUE_SIZE) {
            throw new HttpException(
                `Queue is full (${this.inspects.size}/${this.MAX_QUEUE_SIZE}), please try again later`,
                HttpStatus.TOO_MANY_REQUESTS
            )
        }

        this.currentRequests++

        const { s, a, d, m } = this.parseService.parse(query)

        // Handle Pricempire ping
        if (process.env.PING_PRICEMPIRE === 'true') {
            this.pricempireService.ping({ s, a, d, m })
        }

        // Check cache if refresh not requested
        if (!query.refresh) {
            const cachedAsset = await this.checkCache(a, d)
            if (cachedAsset) {
                this.cached++
                return cachedAsset
            }
        } else if (process.env.ALLOW_REFRESH === 'false') {
            throw new HttpException('Refresh is not allowed', HttpStatus.FORBIDDEN)
        }

        const resultPromise = new Promise((resolve, reject) => {
            const attemptInspection = async (retryCount = 0) => {
                const bot = await this.getAvailableBot()
                if (!bot) {
                    const cachedAsset = await this.checkCache(a, d)
                    if (cachedAsset) {
                        this.cached++
                        return resolve(cachedAsset)
                    }
                    return reject(new HttpException('No bots are ready', HttpStatus.FAILED_DEPENDENCY))
                }

                const timeoutId = setTimeout(async () => {
                    if (retryCount < this.MAX_RETRIES) {
                        clearTimeout(timeoutId)
                        this.inspects.delete(a)
                        await attemptInspection(retryCount + 1)
                    } else {
                        this.inspects.delete(a)
                        this.failed++
                        reject(new HttpException('Inspection request timed out after retries', HttpStatus.GATEWAY_TIMEOUT))
                    }
                }, this.QUEUE_TIMEOUT)

                this.inspects.set(a, {
                    ms: m !== '0' ? m : s,
                    d,
                    resolve: (value: any) => {
                        clearTimeout(timeoutId)
                        resolve(value)
                    },
                    reject: (reason?: any) => {
                        clearTimeout(timeoutId)
                        reject(reason)
                    },
                    timeoutId,
                    startTime: Date.now(),
                    retryCount,
                })

                try {
                    await bot.inspectItem(s !== '0' ? s : m, a, d)
                } catch (error) {
                    if (retryCount < this.MAX_RETRIES) {
                        clearTimeout(timeoutId)
                        this.inspects.delete(a)
                        await attemptInspection(retryCount + 1)
                    } else {
                        const inspect = this.inspects.get(a)
                        if (inspect?.timeoutId) {
                            clearTimeout(inspect.timeoutId)
                        }
                        this.failed++
                        this.inspects.delete(a)
                        reject(new HttpException(error.message, HttpStatus.GATEWAY_TIMEOUT))
                    }
                }
            }

            attemptInspection()
        })

        return resultPromise
    }

    private async getAvailableBot(): Promise<Bot | null> {
        const readyBots = Array.from(this.bots.entries())
            .filter(([_, bot]) => bot.isAvailable())

        if (readyBots.length === 0) {
            return null
        }

        // Round-robin selection
        const [_, bot] = readyBots[this.nextBot % readyBots.length]
        this.nextBot = (this.nextBot + 1) % readyBots.length

        return bot
    }

    @Cron('* * * * * *')
    private handleRequestMetrics() {
        this.requests.push(this.currentRequests)
        this.currentRequests = 0
        if (this.requests.length > 60) {
            this.requests.shift()
        }
    }

    private async checkCache(assetId: string, d: string): Promise<any> {
        const asset = await this.assetRepository.findOne({
            where: {
                assetId: parseInt(assetId),
                d,
            },
        })

        if (asset) {
            return this.formatService.formatResponse(asset)
        }
        return null
    }

    private async handleInspectResult(username: string, response: any) {
        const inspectData = this.inspects.get(response.itemid)
        if (!inspectData) {
            this.logger.error(`No inspect data found for item ${response.itemid}`)
            return
        }

        try {
            const uniqueId = this.generateUniqueId({
                paintSeed: response.paintseed,
                paintIndex: response.paintindex,
                paintWear: response.paintwear,
                defIndex: response.defindex,
                origin: response.origin,
                rarity: response.rarity,
                questId: response.questid,
                quality: response.quality,
                dropReason: response.dropreason
            })

            const history = await this.findHistory(response)
            await this.saveHistory(response, history, inspectData, uniqueId)
            const asset = await this.saveAsset(response, inspectData, uniqueId)

            const formattedResponse = await this.formatService.formatResponse(asset)
            this.success++

            inspectData.resolve(formattedResponse)
            return formattedResponse
        } catch (error) {
            this.logger.error(`Failed to handle inspect result: ${error.message}`)
            this.failed++
            inspectData.reject(new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR))
        } finally {
            if (inspectData.timeoutId) {
                clearTimeout(inspectData.timeoutId)
            }
            this.inspects.delete(response.itemid)
        }
    }

    private async findHistory(response: any) {
        return await this.assetRepository.findOne({
            where: {
                paintWear: response.paintwear,
                paintIndex: response.paintindex,
                defIndex: response.defindex,
                paintSeed: response.paintseed,
                origin: response.origin,
                questId: response.questid,
                rarity: response.rarity,
            },
            order: {
                createdAt: 'DESC',
            },
        })
    }

    private async saveHistory(response: any, history: any, inspectData: any, uniqueId: string) {
        const existing = await this.historyRepository.findOne({
            where: {
                assetId: parseInt(response.itemid),
            },
        })

        if (!existing) {
            await this.historyRepository.save({
                uniqueId,
                assetId: parseInt(response.itemid),
                prevAssetId: history?.assetId,
                owner: inspectData.ms,
                prevOwner: history?.ms,
                d: inspectData.d,
                stickers: response.stickers,
                keychains: response.keychains,
                prevStickers: history?.stickers,
                prevKeychains: history?.keychains,
                type: this.getHistoryType(response, history, inspectData),
            })
        }
    }

    private async saveAsset(response: any, inspectData: any, uniqueId: string) {
        await this.assetRepository.upsert({
            uniqueId,
            ms: inspectData.ms,
            d: inspectData.d,
            assetId: response.itemid,
            paintSeed: response.paintseed,
            paintIndex: response.paintindex,
            paintWear: response.paintwear,
            customName: response.customname,
            defIndex: response.defindex,
            origin: response.origin,
            rarity: response.rarity,
            questId: response.questid,
            stickers: response.stickers,
            quality: response.quality,
            keychains: response.keychains,
            killeaterScoreType: response.killeaterscoretype,
            killeaterValue: response.killeatervalue,
            inventory: response.inventory,
            petIndex: response.petindex,
            musicIndex: response.musicindex,
            entIndex: response.entindex,
            dropReason: response.dropreason,
        }, ['assetId'])

        return await this.assetRepository.findOne({
            where: {
                assetId: parseInt(response.itemid),
            },
        })
    }

    private getHistoryType(response: any, history: any, inspectData: any): HistoryType {
        if (!history) {
            if (response.origin === 8) return HistoryType.TRADED_UP
            if (response.origin === 4) return HistoryType.DROPPED
            if (response.origin === 1) return HistoryType.PURCHASED_INGAME
            if (response.origin === 2) return HistoryType.UNBOXED
            if (response.origin === 3) return HistoryType.CRAFTED
            return HistoryType.UNKNOWN
        }

        if (history?.owner !== inspectData?.ms) {
            if (history?.owner?.startsWith('7656')) {
                return HistoryType.TRADE
            }
            if (history?.owner && !history?.owner?.startsWith('7656')) {
                return HistoryType.MARKET_BUY
            }
        }

        if (history?.owner && history.owner.startsWith('7656') && !inspectData?.ms?.startsWith('7656')) {
            return HistoryType.MARKET_LISTING
        }

        if (history.owner === inspectData.ms) {
            const stickerChanges = this.detectStickerChanges(response.stickers, history.stickers)
            if (stickerChanges) return stickerChanges

            const keychainChanges = this.detectKeychainChanges(response.keychains, history.keychains)
            if (keychainChanges) return keychainChanges
        }

        if (response.customname !== history.customName) {
            return response.customname ? HistoryType.NAMETAG_ADDED : HistoryType.NAMETAG_REMOVED
        }

        return HistoryType.UNKNOWN
    }

    private detectStickerChanges(currentStickers: any[], previousStickers: any[]): HistoryType | null {
        if (!currentStickers || !previousStickers) return null

        for (const slot of [0, 1, 2, 3, 4]) {
            const current = currentStickers.find(s => s.slot === slot)
            const previous = previousStickers.find(s => s.slot === slot)

            if (!current && previous) return HistoryType.STICKER_REMOVE
            if (current && !previous) return HistoryType.STICKER_APPLY
            if (current && previous && current.stickerId !== previous.stickerId) {
                if (current.stickerId === previous.stickerId && current.wear > previous.wear) {
                    return HistoryType.STICKER_SCRAPE
                }
                return HistoryType.STICKER_CHANGE
            }
        }
        return null
    }

    private detectKeychainChanges(currentKeychains: any[], previousKeychains: any[]): HistoryType | null {
        if (!currentKeychains || !previousKeychains) return null

        if (currentKeychains.length === 0 && previousKeychains.length > 0) {
            return HistoryType.KEYCHAIN_REMOVED
        }
        if (currentKeychains.length > 0 && previousKeychains.length === 0) {
            return HistoryType.KEYCHAIN_ADDED
        }
        if (JSON.stringify(currentKeychains) !== JSON.stringify(previousKeychains)) {
            return HistoryType.KEYCHAIN_CHANGED
        }
        return null
    }

    private generateUniqueId(item: {
        paintSeed?: number,
        paintIndex?: number,
        paintWear?: number,
        defIndex?: number,
        origin?: number,
        rarity?: number,
        questId?: number,
        quality?: number,
        dropReason?: number
    }): string {
        const values = [
            item.paintSeed || 0,
            item.paintIndex || 0,
            item.paintWear || 0,
            item.defIndex || 0,
            item.origin || 0,
            item.rarity || 0,
            item.questId || 0,
            item.quality || 0,
            item.dropReason || 0
        ]
        const stringToHash = values.join('-')
        return createHash('sha1').update(stringToHash).digest('hex').substring(0, 8)
    }

    @Cron('*/30 * * * * *')
    private async cleanupStaleRequests() {
        const now = Date.now()
        const staleTimeout = this.QUEUE_TIMEOUT * 2

        for (const [assetId, inspect] of this.inspects.entries()) {
            if (now - inspect.startTime > staleTimeout) {
                if (inspect.timeoutId) {
                    clearTimeout(inspect.timeoutId)
                }
                this.inspects.delete(assetId)
                this.failed++
                this.logger.warn(`Cleaned up stale request for asset ${assetId}`)
            }
        }
    }

    @Cron('*/5 * * * *') // Run every 5 minutes
    private cleanupThrottledAccounts() {
        const now = Date.now();
        for (const [username, expiry] of this.throttledAccounts.entries()) {
            if (now >= expiry) {
                this.throttledAccounts.delete(username);
                this.logger.debug(`Removed ${username} from throttle list`);
            }
        }
    }
}
