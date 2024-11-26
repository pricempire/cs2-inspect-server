import { Controller, Get, Query, Res } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { InspectService } from './inspect.service'
import { InspectDto } from './inspect.dto'

@Controller()
export class InspectController {
    constructor(private readonly inspectService: InspectService) { }

    @Get([
        '',
        'inspect',
        'float',
    ])
    async inspect(
        @Query() query: InspectDto,
        @Res() res: FastifyReply
    ) {
        if (!query || Object.keys(query).length === 0) {
            res.type('text/html').send(this.getApiDocumentation())
            return
        }
        const data = await this.inspectService.inspectItem(query)
        return res.send(data)
    }

    @Get('stats')
    async stats() {
        return this.inspectService.stats()
    }

    private getApiDocumentation() {
        return `
            <html>
            <head>
                <title>CS2 Inspect API Documentation</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; background: #0f172a; color: #e2e8f0; }
                    pre { background: #1e293b; padding: 15px; border-radius: 5px; overflow-x: auto; color: #e2e8f0; }
                    .endpoint { margin-bottom: 30px; }
                    .example { margin: 20px 0; }
                    code { background: #1e293b; padding: 2px 6px; border-radius: 4px; }
                    a { color: #38bdf8; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .github-link { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #1e293b; border-radius: 8px; margin-top: 16px; }
                    .github-link svg { width: 20px; height: 20px; }
                    .logo { width: 200px; height: 50px; }
                </style>
            </head>
            <body>
                <a href="https://pricempire.com/">
                    <svg
                        class="logo"
                        xmlns="http://www.w3.org/2000/svg"
                        width="5038"
                        height="836"
                        viewBox="0 0 5038 836"
                        version="1.1"
                    >
                        <path
                            d="M 194 317.059 C 194 364.033, 194.256 375.967, 195.250 375.380 C 195.938 374.973, 210.624 363.852, 227.886 350.665 C 255.633 329.470, 259.494 326.828, 261.182 327.882 C 262.233 328.538, 275.789 339.745, 291.309 352.787 C 306.828 365.829, 320.307 377.118, 321.263 377.872 C 322.908 379.172, 323 376.047, 323 318.622 L 323 258 258.500 258 L 194 258 194 317.059 M -0 444.083 C -0 496.778, 0.340 524.053, 0.995 523.833 C 1.543 523.650, 30.316 501.900, 64.935 475.500 L 127.880 427.500 127.940 395.750 L 128 364 64 364 L 0 364 -0 444.083 M 226.108 418.587 L 193.993 443.136 194.246 574.318 L 194.500 705.500 258.500 705.500 L 322.500 705.500 322.754 576.995 L 323.008 448.490 293.879 423.995 C 277.858 410.523, 263.282 398.271, 261.487 396.770 L 258.224 394.039 226.108 418.587 M 63.759 542.762 L 0.018 591.500 0.009 648.750 L 0 706 64 706 L 128 706 128 600 C 128 541.700, 127.888 494.005, 127.750 494.012 C 127.612 494.019, 98.817 515.956, 63.759 542.762"
                            stroke="none"
                            fill="#00ff03"
                            fill-rule="evenodd"
                        ></path>
                        <path
                            d="M 639.329 0.750 C 682.134 0.894, 751.884 0.894, 794.329 0.750 C 836.773 0.606, 801.750 0.487, 716.500 0.488 C 631.250 0.488, 596.523 0.606, 639.329 0.750 M 519.472 239 C 519.472 275.575, 519.597 290.538, 519.750 272.250 C 519.902 253.962, 519.902 224.037, 519.750 205.750 C 519.597 187.462, 519.472 202.425, 519.472 239 M 967.451 270 C 967.451 289.525, 967.585 297.513, 967.748 287.750 C 967.912 277.988, 967.912 262.013, 967.748 252.250 C 967.585 242.488, 967.451 250.475, 967.451 270 M 226.822 257.750 C 244.600 257.903, 273.400 257.903, 290.822 257.749 C 308.245 257.596, 293.700 257.471, 258.500 257.471 C 223.300 257.471, 209.045 257.597, 226.822 257.750 M 128.446 395.500 C 128.447 413.100, 128.583 420.159, 128.749 411.187 C 128.914 402.215, 128.914 387.815, 128.748 379.187 C 128.581 370.559, 128.446 377.900, 128.446 395.500 M 454.279 411.318 L 391.057 453.500 391.029 579.750 L 391 706 455.500 706 L 520 706 520 537.500 C 520 403.330, 519.745 369.014, 518.750 369.068 C 518.063 369.105, 489.050 388.118, 454.279 411.318 M 642.250 404.750 C 682.262 404.895, 747.737 404.895, 787.750 404.750 C 827.762 404.605, 795.025 404.487, 715 404.487 C 634.975 404.487, 602.237 404.605, 642.250 404.750 M 128.482 599.500 C 128.482 657.800, 128.602 681.797, 128.750 652.827 C 128.897 623.856, 128.897 576.156, 128.750 546.827 C 128.603 517.497, 128.482 541.200, 128.482 599.500 M 644.750 532.750 C 686.137 532.894, 753.862 532.894, 795.250 532.750 C 836.637 532.605, 802.775 532.487, 720 532.487 C 637.225 532.487, 603.362 532.605, 644.750 532.750"
                            stroke="none"
                            fill="#ff1919"
                            fill-rule="evenodd"
                        ></path>
                        <path
                        d="M 545.119 2.629 C 483.790 12.176, 438.053 43.263, 410.688 94 C 402.084 109.952, 396.787 126.424, 393.323 148 C 391.830 157.303, 391.595 171.690, 391.269 274.250 C 391.066 337.912, 391.256 390, 391.692 390 C 392.127 390, 420.950 371.027, 455.742 347.839 L 519 305.677 519.035 240.089 C 519.073 167.853, 519.345 163.835, 524.970 152.409 C 528.506 145.228, 536.371 137.456, 543.491 134.109 C 554.980 128.709, 546.722 128.936, 720.605 129.245 L 881.500 129.531 890.967 132.304 C 925.657 142.466, 949.041 165.977, 960.521 202.237 C 966.781 222.009, 967.328 226.669, 967.768 264 C 968.219 302.202, 967.360 315.028, 963.429 328.746 C 952.263 367.713, 923.768 392.060, 877.443 402.215 C 867.515 404.391, 867.272 404.395, 718.750 404.726 L 570 405.057 570 468.528 L 570 532 722.780 532 C 886.141 532, 885.059 532.029, 909.459 527.008 C 972.801 513.975, 1027.864 477.557, 1060.497 427.111 C 1066.666 417.575, 1077.845 394.164, 1082.278 381.500 C 1093.583 349.203, 1096.537 321.869, 1095.715 257.172 C 1095.178 214.910, 1094.375 205.518, 1089.371 183 C 1078.101 132.288, 1047.601 81.316, 1010.275 50.817 C 980.813 26.742, 943.411 10.492, 901 3.339 C 891.276 1.699, 878.078 1.553, 722.500 1.368 C 579.433 1.198, 553.108 1.385, 545.119 2.629 M 1559 163 L 1559 208 1609 208 L 1659 208 1659 163 L 1659 118 1609 118 L 1559 118 1559 163 M 3972 163 L 3972 208 4022 208 L 4072 208 4072 163 L 4072 118 4022 118 L 3972 118 3972 163 M 1253.675 293.056 C 1234.523 295.282, 1219.154 299.848, 1201.500 308.558 C 1163.738 327.188, 1140.587 357.066, 1130.799 399.801 L 1128.577 409.500 1128.260 557.750 L 1127.943 706 1177.949 706 L 1227.954 706 1228.227 563.250 L 1228.500 420.500 1230.748 414.947 C 1234.724 405.127, 1240.755 398.999, 1250.140 395.245 C 1254.176 393.630, 1263.343 393.463, 1373.500 393 L 1492.500 392.500 1492.759 342.250 L 1493.018 292 1376.759 292.131 C 1312.817 292.204, 1257.429 292.620, 1253.675 293.056 M 1559 499 L 1559 706 1609 706 L 1659 706 1659 499 L 1659 292 1609 292 L 1559 292 1559 499 M 1867.572 293.128 C 1807.007 298.949, 1762.794 339.976, 1748.739 403.396 C 1746.514 413.435, 1746.500 414.059, 1746.500 501 C 1746.500 596.958, 1746.358 594.351, 1752.674 614.374 C 1762.661 646.034, 1789.770 676.913, 1820.241 691.337 C 1830.039 695.974, 1840.312 699.497, 1853.500 702.741 L 1864.500 705.447 2009.750 705.746 L 2155 706.045 2155 656.040 L 2155 606.034 2014.250 605.767 L 1873.500 605.500 1867.531 603.096 C 1859.564 599.888, 1852.112 592.436, 1848.904 584.469 L 1846.500 578.500 1846.500 500 C 1846.500 428.511, 1846.654 421.003, 1848.224 415.936 C 1850.472 408.679, 1854.940 402.628, 1860.791 398.917 C 1870.638 392.671, 1862.052 393, 2015.182 393 L 2155 393 2155 342.500 L 2155 292 2015.750 292.135 C 1939.162 292.209, 1872.482 292.656, 1867.572 293.128 M 2345.252 293.048 C 2313.870 296.166, 2288.609 307.715, 2266.601 329.006 C 2246.512 348.440, 2234.326 371.263, 2227.828 401.622 L 2225.500 412.500 2225.500 501.500 C 2225.500 583.499, 2225.643 591.208, 2227.315 599.500 C 2235.503 640.109, 2261.265 673.406, 2298.500 691.504 C 2308.967 696.592, 2316.455 699.198, 2331 702.815 L 2341.500 705.427 2441.750 705.745 L 2542 706.064 2542 658.566 L 2542 611.067 2447.250 610.784 L 2352.500 610.500 2346.762 608.183 C 2334.515 603.236, 2326.208 595.219, 2322.365 584.634 C 2320.616 579.820, 2320.483 574.744, 2320.220 503.138 C 2320.040 454.142, 2320.306 424.794, 2320.963 421.244 C 2323.064 409.877, 2328.964 400.346, 2337.500 394.529 C 2347.570 387.666, 2342.657 387.933, 2453.571 388.231 L 2553.500 388.500 2560.180 391.665 C 2569.114 395.897, 2575.268 401.767, 2579.250 409.856 C 2582.392 416.239, 2582.500 416.874, 2582.500 428.979 C 2582.500 440.979, 2582.367 441.780, 2579.315 448.223 C 2573.024 461.502, 2563.045 468.846, 2548.419 470.960 C 2544.222 471.567, 2506.198 471.968, 2451.750 471.980 L 2362 472 2362 519.545 L 2362 567.089 2462.250 566.716 C 2550.678 566.387, 2563.462 566.147, 2570.655 564.685 C 2617.655 555.131, 2654.238 523.409, 2669.932 478.602 C 2673.822 467.496, 2677.655 448.475, 2678.518 436 C 2679.943 415.393, 2675.071 387.483, 2667.067 370.401 C 2656.986 348.890, 2640.241 329.188, 2621.444 316.721 C 2604.751 305.650, 2590.257 299.775, 2567.298 294.774 C 2557.690 292.681, 2555.518 292.635, 2455.500 292.434 C 2399.400 292.321, 2349.788 292.598, 2345.252 293.048 M 2787 293.017 C 2771.346 295.739, 2757.500 305.876, 2750.557 319.700 C 2744.753 331.255, 2745.031 321.126, 2745.015 521.750 L 2745 706 2795 706 L 2845 706 2845 549.468 L 2845 392.937 2916.750 393.227 C 2983.522 393.498, 2988.829 393.645, 2993.244 395.351 C 2999.112 397.618, 3007.425 404.953, 3010.124 410.243 C 3015.020 419.840, 3014.964 418.033, 3014.983 566.750 L 3015 706 3065.028 706 L 3115.057 706 3114.737 558.250 C 3114.425 414.113, 3114.368 410.285, 3112.394 401.708 L 3110.372 392.916 3161.959 393.208 L 3213.546 393.500 3220.217 396.785 C 3226.598 399.927, 3230.884 404.022, 3234 409.954 C 3237.992 417.554, 3237.976 416.935, 3237.988 564.250 L 3238 706 3288.538 706 L 3339.075 706 3338.758 559.750 C 3338.463 423.808, 3338.314 412.830, 3336.638 404 C 3332.713 383.313, 3323.173 360.988, 3311.821 345.923 C 3293.290 321.331, 3262.273 302.508, 3228.930 295.621 C 3213.397 292.412, 3202.973 292.016, 3133.776 292.008 L 3064.052 292 3063.776 306.930 L 3063.500 321.859 3056 316.914 C 3036.685 304.179, 3012.558 295.739, 2987.789 293.053 C 2976.443 291.823, 2794.059 291.790, 2787 293.017 M 3552.675 293.032 C 3533.282 295.354, 3518.117 299.866, 3500.500 308.558 C 3462.741 327.187, 3439.630 357.008, 3429.790 399.801 L 3427.560 409.500 3427.260 622.750 L 3426.960 836 3476.964 836 L 3526.968 836 3527.234 628.250 L 3527.500 420.500 3529.748 414.947 C 3532.694 407.670, 3535.920 403.417, 3541.503 399.448 C 3551.040 392.667, 3547.305 392.865, 3659.500 393.199 L 3760.500 393.500 3766.086 396.120 C 3777.737 401.584, 3783.327 410.447, 3784.972 426.066 C 3786.226 437.976, 3786.283 560.468, 3785.040 572.283 C 3783.226 589.523, 3776.291 598.988, 3761.528 604.371 C 3759.436 605.134, 3728.842 605.634, 3662.500 605.988 L 3566.500 606.500 3566.241 656.282 L 3565.981 706.064 3666.741 705.745 L 3767.500 705.427 3778 702.803 C 3807.019 695.551, 3829.501 683.513, 3847.600 665.538 C 3866.240 647.024, 3878.786 622.145, 3883.676 594 C 3885.343 584.404, 3885.500 576.313, 3885.500 500 C 3885.500 417.081, 3885.484 416.422, 3883.224 405.272 C 3874.077 360.145, 3848.673 324.965, 3812.281 307.024 C 3800.751 301.340, 3786.616 296.674, 3773.752 294.306 C 3765.473 292.782, 3753.725 292.582, 3662 292.409 C 3605.625 292.302, 3556.429 292.583, 3552.675 293.032 M 3972 499 L 3972 706 4022 706 L 4072 706 4072 499 L 4072 292 4022 292 L 3972 292 3972 499 M 4289.675 293.056 C 4270.523 295.282, 4255.154 299.848, 4237.500 308.558 C 4199.738 327.188, 4176.587 357.066, 4166.799 399.801 L 4164.577 409.500 4164.260 557.750 L 4163.943 706 4213.949 706 L 4263.954 706 4264.227 563.250 L 4264.500 420.500 4266.748 414.947 C 4270.724 405.127, 4276.755 398.999, 4286.140 395.245 C 4290.176 393.630, 4299.343 393.463, 4409.500 393 L 4528.500 392.500 4528.759 342.250 L 4529.018 292 4412.759 292.131 C 4348.817 292.204, 4293.429 292.620, 4289.675 293.056 M 4704.252 293.048 C 4672.870 296.166, 4647.609 307.715, 4625.601 329.006 C 4605.512 348.440, 4593.326 371.263, 4586.828 401.622 L 4584.500 412.500 4584.500 501.500 C 4584.500 583.499, 4584.643 591.208, 4586.315 599.500 C 4594.503 640.109, 4620.265 673.406, 4657.500 691.504 C 4667.967 696.592, 4675.455 699.198, 4690 702.815 L 4700.500 705.427 4800.750 705.745 L 4901 706.064 4901 658.566 L 4901 611.067 4806.250 610.784 L 4711.500 610.500 4705.762 608.183 C 4693.515 603.236, 4685.208 595.219, 4681.365 584.634 C 4679.616 579.820, 4679.483 574.744, 4679.220 503.138 C 4679.040 454.142, 4679.306 424.794, 4679.963 421.244 C 4682.064 409.877, 4687.964 400.346, 4696.500 394.529 C 4706.570 387.666, 4701.657 387.933, 4812.571 388.231 L 4912.500 388.500 4919.180 391.665 C 4928.114 395.897, 4934.268 401.767, 4938.250 409.856 C 4941.392 416.239, 4941.500 416.874, 4941.500 428.979 C 4941.500 440.979, 4941.367 441.780, 4938.315 448.223 C 4932.024 461.502, 4922.045 468.846, 4907.419 470.960 C 4903.222 471.567, 4865.198 471.968, 4810.750 471.980 L 4721 472 4721 519.545 L 4721 567.089 4821.250 566.716 C 4909.678 566.387, 4922.462 566.147, 4929.655 564.685 C 4976.655 555.131, 5013.238 523.409, 5028.932 478.602 C 5032.822 467.496, 5036.655 448.475, 5037.518 436 C 5038.943 415.393, 5034.071 387.483, 5026.067 370.401 C 5015.986 348.890, 4999.241 329.188, 4980.444 316.721 C 4963.751 305.650, 4949.257 299.775, 4926.298 294.774 C 4916.690 292.681, 4914.518 292.635, 4814.500 292.434 C 4758.400 292.321, 4708.788 292.598, 4704.252 293.048"
                        stroke="none"
                        fill="#ffffff"
                        fill-rule="evenodd"
                    ></path>
                </svg>
                </a>
                <h1>CS2 Inspect API</h1>
                <p>Welcome to the CS2 Inspect API service. This API provides real-time inspection data for CS2 items including float values, pattern indexes, and sticker information.</p>
                
                <a href="https://github.com/pricempire/cs2-inspect-service" class="github-link" target="_blank">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                    View on GitHub
                </a>

                <div class="endpoint">
                    <h2>Endpoints</h2>
                    
                    <h3>GET /inspect</h3> 
                    <p>Inspect a CS2 item using various input methods.</p>

                    <h4>Query Parameters:</h4>
                    <ul>
                        <li><code>link</code> - Steam inspect link</li>
                        <li><code>s</code> - param S from inspect link</li>
                        <li><code>a</code> - param A from inspect link</li>
                        <li><code>d</code> - param D from inspect link</li>
                        <li><code>m</code> - param M from inspect link</li>
                        <li><code>refresh</code> - (optional) Set to true to refresh sticker data (if enabled)</li>
                    </ul>

                    <div class="example">
                        <h4>Example Requests:</h4>
                        <pre>GET /inspect?url=steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198023809011A40368145941D14586214085613790969</pre>
                        <pre>GET /inspect?s=76561198023809011&a=40368145941&d=14586214085613790969</pre>
                    </div>

                    <div class="example">
                        <h4>Example Response:</h4>
                        <pre>
{
    "iteminfo": {
        "defindex": 16,
        "paintindex": 309,
        "rarity": 7,
        "quality": 4,
        "origin": 8,
        "floatvalue": 0.1572919487953186,
        "paintseed": 826,
        "wear_name": "Field-Tested",
        "market_hash_name": "M4A4 | Howl (Field-Tested)",
        "stickers": [
            {
                "slot": 3,
                "wear": 0.11459143459796906,
                "scale": null,
                "pattern": null,
                "tint_id": null,
                "offset_x": null,
                "offset_y": null,
                "offset_z": null,
                "rotation": null,
                "sticker_id": 202,
                "market_hash_name": "Sticker | Cloud9 (Holo) | DreamHack 2014"
            }
        ],
        "keychains": [
            {
                "slot": 0,
                "wear": null,
                "scale": null,
                "pattern": 22820,
                "tint_id": null,
                "offset_x": 10.525607109069824,
                "offset_y": 0.578781008720398,
                "offset_z": 12.312423706054688,
                "rotation": null,
                "sticker_id": 19,
                "market_hash_name": "Charm | Pocket AWP"
            }
        ],
        "image": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn8f6pIl2-yYp9SnjA23-BBuNW-iLI-XJgFsZQyG_VW2lOq918e8uszLn2wj5HeAvkVdtQ",
        "type": "Weapon",
        "souvenir": false,
        "stattrak": false
    }
}</pre>
                    </div>
                </div>  
            </body>
            </html>
        `
    }
}
