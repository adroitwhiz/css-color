const colorNames = require('./color-names');

const {rgbParser, hslParser, hwbParser, labParser, lchParser, deviceCmykParser} = require('./generated-parsers');

const parseCSSColor = (cssStr, cb) => {
    const str = cssStr.trim();

    // Hex
    if (/^#[0-9a-fA-F]+$/.test(str)) {
        const colorNum = parseInt(str.slice(1), 16);
        let r, g, b, a;
        switch (str.length) {
            case 7:
                r = colorNum >> 16;
                g = (colorNum >> 8) & 0xff;
                b = colorNum & 0xff;
                a = 255;
                break;

            case 4:
                r = colorNum >> 8;
                r = (r << 4) | r;

                g = (colorNum >> 4) & 0xf;
                g = (g << 4) | g;

                b = colorNum & 0xf;
                b = (b << 4) | b;

                a = 255;
                break;

            case 9:
                r = colorNum >>> 24;
                g = (colorNum >>> 16) & 0xff;
                b = (colorNum >>> 8) & 0xff;
                a = colorNum & 0xff;
                break;

            case 5:
                r = colorNum >> 12;
                r = (r << 4) | r;

                g = (colorNum >> 8) & 0xf;
                g = (g << 4) | g;

                b = (colorNum >> 4) & 0xf;
                b = (b << 4) | b;

                a = colorNum & 0xf;
                a = (a << 4) | a;
                break;

            default:
                return cb(null);
        }
        return cb('rgb', r, g, b, a / 255);
    }

    const percentageToUint8 = percentage => {
        const unclamped = Math.round(Number(percentage.slice(0, -1)) * 255 / 100);
        return unclamped < 0 ? 0 : unclamped > 255 ? 255 : unclamped;
    };

    const percentageToNumber = percentage => {
        const unclamped = Number(percentage.slice(0, -1));
        return unclamped < 0 ? 0 : unclamped > 100 ? 100 : unclamped;
    };

    const percentageToDecimal = percentage => {
        const unclamped = Number(percentage.slice(0, -1)) * 0.01;
        return unclamped < 0 ? 0 : unclamped > 1 ? 1 : unclamped;
    };

    const floatToUint8 = float => {
        const unclamped = Math.round(parseFloat(float));
        return unclamped < 0 ? 0 : unclamped > 255 ? 255 : unclamped;
    };

    const decimalClamp = float => {
        return float < 0 ? 0 : float > 1 ? 1 : float;
    };

    let parseResult, pathMap;

    if (parseResult === null) return cb(null);

    const parseDecimalOrPercentage = val => {
        if (val.charAt(val.length - 1) === '%') {
            return percentageToDecimal(val);
        } else {
            return decimalClamp(val);
        }
    };

    const parseAlphaValue = pathStart => {
        if (parseResult[pathMap[`${pathStart}.alpha.percentage`]]) {
            return percentageToDecimal(parseResult[pathMap[`${pathStart}.alpha.percentage`]]);
        } else if (parseResult[pathMap[`${pathStart}.alpha.number`]]) {
            return decimalClamp(Number(parseResult[pathMap[`${pathStart}.alpha.number`]]));
        } else {
            return 1;
        }
    };

    const parseHueValue = huePath => {
        let h;
        if (parseResult[pathMap[`${huePath}.angle`]]) {
            const angleValue = parseResult[pathMap[`${huePath}.angle.value`]];

            switch (parseResult[pathMap[`${huePath}.angle.unit`]]) {
                case 'deg':
                    h = Number(angleValue);
                    break;
                case 'grad':
                    h = Number(angleValue) * (360 / 400);
                    break;
                case 'rad':
                    h = Number(angleValue) * (180 / Math.PI);
                    break;
                case 'turn':
                    h = Number(angleValue) * 360;
                    break;
            }
        } else {
            h = Number(parseResult[pathMap[`${huePath}.number`]]);
        }

        return ((h % 360) + 360) % 360;
    };

    if (/^rgb/i.test(str)) {
        parseResult = rgbParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = rgbParser.regex.exec(str);
        if (parseResult === null) return cb(null);
        pathMap = rgbParser.pathMap;

        let r, g, b;
        let pathStart;

        if (parseResult[pathMap['rgb.rgbPercentage']] || parseResult[pathMap['rgb.rgbPercentageCommas']]) {
            pathStart = parseResult[pathMap['rgb.rgbPercentage']] ? 'rgb.rgbPercentage' : 'rgb.rgbPercentageCommas';
            r = percentageToUint8(parseResult[pathMap[`${pathStart}.red`]]);
            g = percentageToUint8(parseResult[pathMap[`${pathStart}.green`]]);
            b = percentageToUint8(parseResult[pathMap[`${pathStart}.blue`]]);
        } else if (parseResult[pathMap['rgb.rgbNumber']] || parseResult[pathMap['rgb.rgbNumberCommas']]) {
            pathStart = parseResult[pathMap['rgb.rgbNumber']] ? 'rgb.rgbNumber' : 'rgb.rgbNumberCommas';
            r = floatToUint8(parseResult[pathMap[`${pathStart}.red`]]);
            g = floatToUint8(parseResult[pathMap[`${pathStart}.green`]]);
            b = floatToUint8(parseResult[pathMap[`${pathStart}.blue`]]);
        } else {
            return cb(null);
        }

        const a = parseAlphaValue(pathStart);

        return cb('rgb', r, g, b, a);
    } else if (/^hsl/i.test(str)) {
        parseResult = hslParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = hslParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        pathMap = hslParser.pathMap;

        const pathStart = parseResult[pathMap['hsl.hslCommas']] ? 'hsl.hslCommas' : 'hsl.hslNoCommas';
        const h = parseHueValue(pathStart + '.hue');
        const s = percentageToNumber(parseResult[pathMap[`${pathStart}.saturation`]]);
        const l = percentageToNumber(parseResult[pathMap[`${pathStart}.lightness`]]);
        const a = parseAlphaValue(pathStart);

        return cb('hsl', h, s, l, a);
    } else if (/^hwb/i.test(str)) {
        parseResult = hwbParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = hwbParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        pathMap = hwbParser.pathMap;

        const h = parseHueValue('hwb.hue');
        const w = percentageToNumber(parseResult[pathMap['hwb.whiteness']]);
        const b = percentageToNumber(parseResult[pathMap['hwb.blackness']]);
        const a = parseAlphaValue('hwb');

        return cb('hwb', h, w, b, a);
    } else if (/^lab/i.test(str)) {
        parseResult = labParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = labParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        pathMap = labParser.pathMap;

        // Don't clamp maximum lightness
        const l = Math.max(0, Number(parseResult[pathMap['lab.lightness']].slice(0, -1)));
        const a = Number(parseResult[pathMap['lab.a']]);
        const b = Number(parseResult[pathMap['lab.b']]);
        const alpha = parseAlphaValue('lab');

        return cb('lab', l, a, b, alpha);
    } else if (/^lch/i.test(str)) {
        parseResult = lchParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = lchParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        pathMap = lchParser.pathMap;

        const l = Math.max(0, Number(parseResult[pathMap['lch.lightness']].slice(0, -1)));
        const c = Math.max(0, Number(parseResult[pathMap['lch.chroma']]));
        const h = parseHueValue('lch.hue');
        const alpha = parseAlphaValue('lch');

        return cb('lch', l, c, h, alpha);
    } else if (/^device-cmyk/i.test(str)) {
        parseResult = deviceCmykParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = deviceCmykParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        pathMap = deviceCmykParser.pathMap;

        const c = parseDecimalOrPercentage(parseResult[pathMap['deviceCmyk.c']]) * 100;
        const m = parseDecimalOrPercentage(parseResult[pathMap['deviceCmyk.m']]) * 100;
        const y = parseDecimalOrPercentage(parseResult[pathMap['deviceCmyk.y']]) * 100;
        const k = parseDecimalOrPercentage(parseResult[pathMap['deviceCmyk.k']]) * 100;
        const alpha = parseAlphaValue('deviceCmyk');
        const fallback = parseResult[pathMap['deviceCmyk.fallback']] || null;

        return cb('device-cmyk', c, m, y, k, alpha, fallback);
    }

    let colorKeywordValue = colorNames[str];
    if (!colorKeywordValue) colorKeywordValue = colorNames[str.toLowerCase()];
    if (colorKeywordValue) return cb('rgb', ...colorKeywordValue);

    return cb(null);
};

module.exports = parseCSSColor;
