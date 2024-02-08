import { HttpService } from '@nestjs/axios'
import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { Asset } from 'src/entities/asset.entity'

@Injectable()
export class FormatService implements OnModuleInit {
    private readonly logger = new Logger(FormatService.name)

    private schema: any

    private qualities = {
        0: 'Normal',
        1: 'Genuine',
        2: 'Vintage',
        3: '★',
        4: 'Unique',
        5: 'Community',
        6: 'Valve',
        7: 'Prototype',
        8: 'Customized',
        9: 'StatTrak™',
        10: 'Completed',
        11: 'haunted',
        12: 'Souvenir',
    }

    private rarities = {
        1: 'Consumer Grade',
        2: 'Industrial Grade',
        3: 'Mil-Spec Grade',
        4: 'Restricted',
        5: 'Classified',
        6: 'Covert',
        7: 'Contraband',
    }

    private origins = {
        0: 'Timed Drop',
        1: 'Achievement',
        2: 'Purchased',
        3: 'Traded',
        4: 'Crafted',
        5: 'Store Promotion',
        6: 'Gifted',
        7: 'Support Granted',
        8: 'Found in Crate',
        9: 'Earned',
        10: 'Third-Party Promotion',
        11: 'Wrapped Gift',
        12: 'Halloween Drop',
        13: 'Steam Purchase',
        14: 'Foreign Item',
        15: 'CD Key',
        16: 'Collection Reward',
        17: 'Preview Item',
        18: 'Steam Workshop Contribution',
        19: 'Periodic Score Reward',
        20: 'Recycling',
        21: 'Tournament Drop',
        22: 'Stock Item',
        23: 'Quest Reward',
        24: 'Level Up Reward',
    }
    constructor(private httpService: HttpService) {}

    async onModuleInit() {
        this.logger.debug('Loading schema...')

        try {
            this.schema = (
                await firstValueFrom(
                    this.httpService.get('https://csfloat.com/api/v1/schema'),
                )
            )?.data
        } catch (e) {
            this.logger.error('Failed to load schema')
            throw new Error('Failed to load schema')
        }

        this.logger.debug('Schema loaded')
    }

    public formatResponse(asset: Asset) {
        const weapon = this.schema.weapons[asset.defIndex]

        if (!weapon) {
            if (asset.defIndex === 1209) {
                // Sticker

                return {
                    iteminfo: {
                        origin: asset.origin,
                        quality: asset.quality,
                        rarity: asset.rarity,
                        a: asset.assetId,
                        d: asset.d,
                        paintseed: asset.paintSeed,
                        defindex: asset.defIndex,
                        paintindex: asset.paintIndex,
                        stickers: [],
                        itemid: asset.assetId,
                        floatid: asset.assetId,
                        floatvalue: asset.paintWear,
                        s: asset.ms.startsWith('7656') ? asset.ms : '0',
                        m: asset.ms.startsWith('7656') ? '0' : asset.ms,
                        imageurl: '',
                        min: 0,
                        max: 0,
                        weapon_type: 'Sticker',
                        item_name: 'Sticker',
                        rarity_name: this.rarities[asset.rarity],
                        quality_name: this.qualities[asset.quality],
                        origin_name: this.origins[asset.origin],
                        wear_name: '',
                        full_item_name:
                            this.schema.stickers[asset.stickers[0].sticker_id]
                                .market_hash_name,
                    },
                }
            } else if (this.schema.agents[asset.defIndex]) {
                // Agents

                const agent = this.schema.agents[asset.defIndex]

                return {
                    iteminfo: {
                        origin: asset.origin,
                        quality: asset.quality,
                        rarity: asset.rarity,
                        a: asset.assetId,
                        d: asset.d,
                        paintseed: asset.paintSeed,
                        defindex: asset.defIndex,
                        paintindex: asset.paintIndex,
                        stickers: asset.stickers.map((sticker) => ({
                            stickerId: sticker.sticker_id,
                            slot: sticker.slot,
                            rotation: sticker.rotation,
                            wear: sticker.wear,
                            offsetX: sticker.offset_x,
                            offsetY: sticker.offset_y,
                            scale: sticker.scale,
                            name: this.schema.stickers[
                                sticker.sticker_id
                            ].market_hash_name.replace('Patch | ', ''),
                        })),
                        itemid: asset.assetId,
                        floatid: asset.assetId,
                        floatvalue: asset.paintWear,
                        s: asset.ms.startsWith('7656') ? asset.ms : '0',
                        m: asset.ms.startsWith('7656') ? '0' : asset.ms,
                        imageurl: agent.image,
                        min: 0,
                        max: 0,
                        weapon_type: 'Agent',
                        item_name: agent.market_hash_name.split(' | ')[0],
                        rarity_name: this.rarities[asset.rarity],
                        quality_name: this.qualities[asset.quality],
                        origin_name: this.origins[asset.origin],
                        wear_name: '',
                        full_item_name: agent.market_hash_name,
                    },
                }
            } else if (asset.defIndex === 1349) {
                return {
                    iteminfo: {
                        origin: asset.origin,
                        quality: asset.quality,
                        rarity: asset.rarity,
                        a: asset.assetId,
                        d: asset.d,
                        paintseed: asset.paintSeed,
                        defindex: asset.defIndex,
                        paintindex: asset.paintIndex,
                        stickers: asset.stickers.map((sticker) => ({
                            stickerId: sticker.sticker_id,
                            slot: sticker.slot,
                            rotation: sticker.rotation,
                            wear: sticker.wear,
                            offsetX: sticker.offset_x,
                            offsetY: sticker.offset_y,
                            scale: sticker.scale,
                            name: sticker.sticker_id,
                        })),
                        itemid: asset.assetId,
                        floatid: asset.assetId,
                        floatvalue: asset.paintWear,
                        s: asset.ms.startsWith('7656') ? asset.ms : '0',
                        m: asset.ms.startsWith('7656') ? '0' : asset.ms,
                        imageurl: '',
                        min: 0,
                        max: 0,
                        weapon_type: 'Graffiti',
                        item_name: 'Graffiti',
                        rarity_name: this.rarities[asset.rarity],
                        quality_name: this.qualities[asset.quality],
                        origin_name: this.origins[asset.origin],
                        wear_name: '',
                        full_item_name: 'Graffiti',
                    },
                }
            } else {
                throw new HttpException('Item not found', HttpStatus.NOT_FOUND)
            }
        }
        const paint = weapon.paints[asset.paintIndex]
        const wear = this.getWear(asset.paintWear)

        const item_name = `${weapon.name} | ${paint.name}`

        let full_item_name = item_name

        if (wear) {
            full_item_name = `${full_item_name} (${wear})`
        }
        return {
            iteminfo: {
                origin: asset.origin,
                quality: asset.quality,
                rarity: asset.rarity,
                a: asset.assetId,
                d: asset.d,
                paintseed: asset.paintSeed,
                defindex: asset.defIndex,
                paintindex: asset.paintIndex,
                stickers: asset.stickers.map((sticker) => ({
                    stickerId: sticker.sticker_id,
                    slot: sticker.slot,
                    rotation: sticker.rotation,
                    wear: sticker.wear,
                    offsetX: sticker.offset_x,
                    offsetY: sticker.offset_y,
                    scale: sticker.scale,
                    name: this.schema.stickers[
                        sticker.sticker_id
                    ].market_hash_name.replace('Sticker | ', ''),
                })),
                itemid: asset.assetId,
                floatid: asset.assetId,
                floatvalue: asset.paintWear,
                s: asset.ms.startsWith('7656') ? asset.ms : '0',
                m: asset.ms.startsWith('7656') ? '0' : asset.ms,
                imageurl: paint.image,
                min: paint.min,
                max: paint.max,
                weapon_type: weapon.name,
                item_name: paint.name,
                rarity_name: this.rarities[asset.rarity],
                quality_name: this.qualities[asset.quality],
                origin_name: this.origins[asset.origin],
                wear_name: wear,
                full_item_name,
            },
        }

        /*
        {
            "iteminfo": {
                "stickers": [
                    {
                        "slot": 0,
                        "stickerId": 5935,
                        "codename": "csgo10_blue_gem_glitter",
                        "material": "csgo10/blue_gem_glitter",
                        "name": "Blue Gem (Glitter)"
                    }
                ],
                "itemid": "35675800220",
                "defindex": 1209,
                "paintindex": 0,
                "rarity": 4,
                "quality": 4,
                "paintseed": 0,
                "inventory": 261,
                "origin": 8,
                "s": "76561198023809011",
                "a": "35675800220",
                "d": "12026419764860007457",
                "m": "0",
                "floatvalue": 0,
                "min": 0.06,
                "max": 0.8,
                "weapon_type": "Sticker",
                "item_name": "-",
                "rarity_name": "Remarkable",
                "quality_name": "Unique",
                "origin_name": "Found in Crate",
                "full_item_name": "Sticker | Blue Gem (Glitter)"
            }
        }
        */
    }

    private getWear(wear: number) {
        if (wear < 0.07) return 'Factory New'
        if (wear < 0.15) return 'Minimal Wear'
        if (wear < 0.38) return 'Field-Tested'
        if (wear < 0.45) return 'Well-Worn'
        return 'Battle-Scarred'
    }
}
