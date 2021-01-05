const {parseCSSColor: deansParser} = require('csscolorparser');

const parseCSSColor = require('./src/index.js');
const colorString = require('color-string');
const colorParse = require('color-parse');

const iterations = 1000000;

const benchHex = () => {
    const hexColors = [];
    let out1 = [];
    for (let i = 0; i < iterations; i++) {
        // const hexLen = [3, 4, 6, 8][Math.floor(Math.random() * 4)];
        const hexLen = [3, 6][Math.floor(Math.random() * 2)];
        hexColors.push('#' + ('0'.repeat(hexLen) + ((Math.random() * (2 ** (hexLen * 4))) >>> 0).toString(16)).slice(-hexLen));
    }

    // Warm up
    global.gc();
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(deansParser(hexColors[i]));
    }
    out1 = [];
    global.gc();
    console.time('Hex (deanm\'s parser)');
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(deansParser(hexColors[i]));
    }
    console.timeEnd('Hex (deanm\'s parser)');
    global.gc();

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < hexColors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, hexColors[i]);
    }
    out1 = [];
    global.gc();
    console.time('Hex (css-color)');
    for (let i = 0; i < hexColors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, hexColors[i]);
    }
    console.timeEnd('Hex (css-color)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(colorString.get.rgb(hexColors[i]));
    }
    out1 = [];
    global.gc();
    console.time('Hex (color-string)');
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(colorString.get.rgb(hexColors[i]));
    }
    console.timeEnd('Hex (color-string)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(colorParse(hexColors[i]));
    }
    out1 = [];
    global.gc();
    console.time('Hex (color-parse)');
    for (let i = 0; i < hexColors.length; i++) {
        out1.push(colorParse(hexColors[i]));
    }
    console.timeEnd('Hex (color-parse)');
};

const benchRgba = () => {
    const rgbaColors = [];
    let out1 = [];
    const randomColorValue = usePercentages => {
        let rand = Math.random();
        if (usePercentages) {
            rand *= 100;
            if (Math.random() > 0.1) {
                rand = Math.floor(rand);
            } else {
                rand = rand.toFixed(2);
            }
            return rand + '%';
        }

        return Math.floor(rand * 255).toString();
    };
    for (let i = 0; i < iterations; i++) {
        const comma = Math.random() > 0.5 ? ',' : '';
        const hasAlpha = Math.random() > 0.5;
        const alpha = Math.random() > 0.5 ? Math.floor(Math.random() * 100) + '%' : Math.random().toFixed(2);
        const usePercentages = Math.random() > 0.5;
        rgbaColors.push(`rgb${Math.random() > 0.5 ? 'a' : ''}(${randomColorValue(usePercentages)}${comma} ${randomColorValue(usePercentages)}${comma} ${randomColorValue(usePercentages)}${hasAlpha ? (comma ? (comma + ' ') : ' / ') : ''}${hasAlpha ? alpha : ''})`);
    }

    // console.log(rgbaColors.slice(0, 100));

    // Warm up
    global.gc();
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(deansParser(rgbaColors[i]));
    }
    out1 = [];
    global.gc();
    console.time('rgba (deanm\'s parser)');
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(deansParser(rgbaColors[i]));
    }
    console.timeEnd('rgba (deanm\'s parser)');
    global.gc();

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < rgbaColors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, rgbaColors[i]);
    }
    out1 = [];
    global.gc();
    console.time('rgba (css-color)');
    for (let i = 0; i < rgbaColors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, rgbaColors[i]);
    }
    console.timeEnd('rgba (css-color)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(colorString.get.rgb(rgbaColors[i]));
    }
    out1 = [];
    // let numParseFailures = 0;
    global.gc();
    console.time('rgba (color-string)');
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(colorString.get.rgb(rgbaColors[i]));
        // if (out1[out1.length - 1] === null) numParseFailures++;
    }
    console.timeEnd('rgba (color-string)');
    // console.log(`successful parses: ${rgbaColors.length - numParseFailures}/${rgbaColors.length}`);

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(colorParse(rgbaColors[i]));
    }
    out1 = [];
    global.gc();
    console.time('rgba (color-parse)');
    for (let i = 0; i < rgbaColors.length; i++) {
        out1.push(colorParse(rgbaColors[i]));
    }
    console.timeEnd('rgba (color-parse)');
};

const benchHsla = () => {
    const colors = [];
    let out1 = [];
    const randomColorValue = () => Math.floor(Math.random() * 100) + '%';
    const randomHue = () => {
        let hue = Math.random() * 360;
        if (Math.random() > 0.9) hue *= 2;
        if (Math.random() > 0.9) hue -= 480;

        if (Math.random() > 0.2) {
            hue = Math.floor(hue);
        } else {
            hue = hue.toFixed(2);
        }
        return hue;
    };
    for (let i = 0; i < iterations; i++) {
        const comma = Math.random() > 0.5 ? ',' : '';
        const hasAlpha = Math.random() > 0.5;
        const alpha = Math.random() > 0.5 ? Math.floor(Math.random() * 100) + '%' : Math.random().toFixed(2);
        colors.push(`hsl${Math.random() > 0.5 ? 'a' : ''}(${randomHue()}${comma} ${randomColorValue()}${comma} ${randomColorValue()}${hasAlpha ? (comma ? (comma + ' ') : ' / ') : ''}${hasAlpha ? alpha : ''})`);
    }

    // console.log(colors.slice(0, 100));

    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(deansParser(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('hsla (deanm\'s parser)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(deansParser(colors[i]));
    }
    console.timeEnd('hsla (deanm\'s parser)');
    global.gc();

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    out1 = [];
    global.gc();
    console.time('hsla (css-color)');
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    console.timeEnd('hsla (css-color)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('hsla (color-string)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    console.timeEnd('hsla (color-string)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('hsla (color-parse)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    console.timeEnd('hsla (color-parse)');
};

const benchHwb = () => {
    const colors = [];
    let out1 = [];
    const randomColorValue = () => Math.floor(Math.random() * 100) + '%';
    const randomHue = () => {
        let hue = Math.random() * 360;
        if (Math.random() > 0.9) hue *= 2;
        if (Math.random() > 0.9) hue -= 480;

        if (Math.random() > 0.2) {
            hue = Math.floor(hue);
        } else {
            hue = hue.toFixed(2);
        }
        return hue;
    };
    for (let i = 0; i < iterations; i++) {
        const hasAlpha = Math.random() > 0.5;
        const alpha = Math.random() > 0.5 ? Math.floor(Math.random() * 100) + '%' : Math.random().toFixed(2);
        colors.push(`hwb(${randomHue()} ${randomColorValue()} ${randomColorValue()}${hasAlpha ? ' / ' : ''}${hasAlpha ? alpha : ''})`);
    }

    // console.log(colors.slice(0, 100));

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    out1 = [];
    global.gc();
    console.time('hwb (css-color)');
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    console.timeEnd('hwb (css-color)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('hwb (color-string)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    console.timeEnd('hwb (color-string)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('hwb (color-parse)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    console.timeEnd('hwb (color-parse)');
};

const benchKeywords = () => {
    const colors = ["transparent","aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","green","greenyellow","grey","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];
    for (let i = 0, len = colors.length; i < len; i++) {
        colors.push(colors[i].toUpperCase());
    }

    for (let i = 0, len = colors.length; i < iterations; i++) {
        colors.push(colors[i % len]);
    }

    let out1 = [];

    // console.log(colors.slice(0, 298));

    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(deansParser(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('keywords (deanm\'s parser)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(deansParser(colors[i]));
    }
    console.timeEnd('keywords (deanm\'s parser)');
    global.gc();

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    out1 = [];
    global.gc();
    console.time('keywords (css-color)');
    for (let i = 0; i < colors.length; i++) {
        parseCSSColor((model, c1, c2, c3, a) => {
            out1.push([c1, c2, c3, a]);
        }, colors[i]);
    }
    console.timeEnd('keywords (css-color)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('keywords (color-string)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorString.get.rgb(colors[i]));
    }
    console.timeEnd('keywords (color-string)');

    out1 = [];
    // Warm up
    global.gc();
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    out1 = [];
    global.gc();
    console.time('keywords (color-parse)');
    for (let i = 0; i < colors.length; i++) {
        out1.push(colorParse(colors[i]));
    }
    console.timeEnd('keywords (color-parse)');
};

switch (process.argv[2]) {
    case 'hex': benchHex(); break;
    case 'rgb': benchRgba(); break;
    case 'hsl': benchHsla(); break;
    case 'hwb': benchHwb(); break;
    case 'keywords': benchKeywords(); break;
    default:
        benchHex();
        benchRgba();
        benchHsla();
        benchHwb();
        benchKeywords();
}

