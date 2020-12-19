const colorNames = require('./color-names');

const {rgbParser, hslParser, hwbParser, labParser, lchParser, deviceCmykParser} = require('./generated-parsers');

/**
 * @callback cssParseCallback
 * @param {('rgb'|'hsl'|'hwb'|'lab'|'lch'|'device-cmyk'|null)} type the type of parsed CSS color, or null if it could
 * not be parsed
 * @param {...number} componentValues The color component values. For RGB, these are numbers (not necessarily integers)
 * from 0 to 255. For HSL and HWB, the first component (hue) is a number from 0 to 360, and the next two are numbers
 * from 0 to 100. For LAB, the first component (lightness) is a number from 0 to +Infinity, with 100 representing white.
 * The next two components are unbounded numbers. For LCH, the first component is the same as LAB's. The second
 * component (chroma) is a number from 0 to +Infinity. The third component (hue) is a number from 0 to 360.
 * For device-cmyk, the first 4 components are numbers from 0 to 100.
 * @param {number} alpha The alpha, or opacity, of the color. This is a decimal value ranging from 0 to 1.
 * @param {string?} fallback For device-cmyk, this is the non-parsed value of the fallback color, or null if one was not
 * given. It may itself be passed into `parseCSSColor`.
 */

/**
 * Parse a CSS color string, passing the result to the given callback function.
 * @param {cssParseCallback} cb The function to pass the parsed color to.
 * @param {string} cssStr The CSS color string to be parsed.
 * @returns The return value of the passed callback `cb`.
 */
const parseCSSColor = (cb, cssStr) => {
    const str = cssStr.trim();

    // Hex
    if (/^#[0-9a-fA-F]+$/.test(str)) {
        // We need the above regex because parseInt ignores weird invalid characters when parsing hex
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

    let parseResult, relMap;

    const parseDecimalOrPercentage = val => {
        if (val.charAt(val.length - 1) === '%') {
            return percentageToDecimal(val);
        } else {
            return decimalClamp(val);
        }
    };

    const parseAlphaValue = pathOffset => {
        if (parseResult[pathOffset + relMap['numberOrPercentage.percentage']]) {
            return percentageToDecimal(parseResult[pathOffset + relMap['numberOrPercentage.percentage']]);
        } else if (parseResult[pathOffset + relMap['numberOrPercentage.number']]) {
            return decimalClamp(Number(parseResult[pathOffset + relMap['numberOrPercentage.number']]));
        } else {
            return 1;
        }
    };

    const parseHueValue = hueOffset => {
        let h;
        if (parseResult[hueOffset + relMap['hue.angle']]) {
            const angleValue = parseResult[hueOffset + relMap['hue.angle'] + relMap['angle.value']];

            switch (parseResult[hueOffset + relMap['hue.angle'] + relMap['angle.unit']]) {
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
            h = Number(parseResult[hueOffset + relMap['hue.number']]);
        }

        return ((h % 360) + 360) % 360;
    };

    // Regex-based parsing
    if (/^rgb/i.test(str)) {
        parseResult = rgbParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = rgbParser.regex.exec(str);
        if (parseResult === null) return cb(null);
        relMap = rgbParser.relMap;

        let r, g, b;
        let pathStart;

        if (parseResult[relMap['rgb.rgbPercentage']]) {
            pathStart = relMap['rgb.rgbPercentage'];
            pathStart += parseResult[pathStart + relMap['rgbPercentage|commas']] ? relMap['rgbPercentage|commas'] : relMap['rgbPercentage|spaces'];
            r = percentageToUint8(parseResult[pathStart + relMap['rgbPercentage.red']]);
            g = percentageToUint8(parseResult[pathStart + relMap['rgbPercentage.green']]);
            b = percentageToUint8(parseResult[pathStart + relMap['rgbPercentage.blue']]);
        } else if (parseResult[relMap['rgb.rgbNumber']]) {
            pathStart = relMap['rgb.rgbNumber'];
            pathStart += parseResult[pathStart + relMap['rgbNumber|commas']] ? relMap['rgbNumber|commas'] : relMap['rgbNumber|spaces'];
            r = floatToUint8(parseResult[pathStart + relMap['rgbNumber.red']]);
            g = floatToUint8(parseResult[pathStart + relMap['rgbNumber.green']]);
            b = floatToUint8(parseResult[pathStart + relMap['rgbNumber.blue']]);
        } else {
            return cb(null);
        }

        const a = parseAlphaValue(pathStart + relMap['rgbNumber.alpha']);

        return cb('rgb', r, g, b, a);
    } else if (/^hsl/i.test(str)) {
        parseResult = hslParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = hslParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        relMap = hslParser.relMap;

        const pathStart = parseResult[relMap['hsl|commas']] ? relMap['hsl|commas'] : relMap['hsl|spaces'];
        const h = parseHueValue(pathStart + relMap['hsl.hue']);
        const s = percentageToNumber(parseResult[pathStart + relMap['hsl.saturation']]);
        const l = percentageToNumber(parseResult[pathStart + relMap['hsl.lightness']]);
        const a = parseAlphaValue(pathStart + relMap['hsl.alpha']);

        return cb('hsl', h, s, l, a);
    } else if (/^hwb/i.test(str)) {
        parseResult = hwbParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = hwbParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        relMap = hwbParser.relMap;

        const h = parseHueValue(relMap['hwb.hue']);
        const w = percentageToNumber(parseResult[relMap['hwb.whiteness']]);
        const b = percentageToNumber(parseResult[relMap['hwb.blackness']]);
        const a = parseAlphaValue(relMap['hwb.alpha']);

        return cb('hwb', h, w, b, a);
    } else if (/^lab/i.test(str)) {
        parseResult = labParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = labParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        relMap = labParser.relMap;

        // Don't clamp maximum lightness
        const l = Math.max(0, Number(parseResult[relMap['lab.lightness']].slice(0, -1)));
        const a = Number(parseResult[relMap['lab.a']]);
        const b = Number(parseResult[relMap['lab.b']]);
        const alpha = parseAlphaValue(relMap['lab.alpha']);

        return cb('lab', l, a, b, alpha);
    } else if (/^lch/i.test(str)) {
        parseResult = lchParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = lchParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        relMap = lchParser.relMap;

        const l = Math.max(0, Number(parseResult[relMap['lch.lightness']].slice(0, -1)));
        const c = Math.max(0, Number(parseResult[relMap['lch.chroma']]));
        const h = parseHueValue(relMap['lch.hue']);
        const alpha = parseAlphaValue(relMap['lch.alpha']);

        return cb('lch', l, c, h, alpha);
    } else if (/^device-cmyk/i.test(str)) {
        parseResult = deviceCmykParser.fastRegex.exec(str);
        if (parseResult === null) parseResult = deviceCmykParser.regex.exec(str);
        if (parseResult === null) return cb(null);

        relMap = deviceCmykParser.relMap;

        const c = parseDecimalOrPercentage(parseResult[relMap['deviceCmyk.c']]) * 100;
        const m = parseDecimalOrPercentage(parseResult[relMap['deviceCmyk.m']]) * 100;
        const y = parseDecimalOrPercentage(parseResult[relMap['deviceCmyk.y']]) * 100;
        const k = parseDecimalOrPercentage(parseResult[relMap['deviceCmyk.k']]) * 100;
        const alpha = parseAlphaValue(relMap['deviceCmyk.alpha']);
        const fallback = parseResult[relMap['deviceCmyk.fallback']] || null;

        return cb('device-cmyk', c, m, y, k, alpha, fallback);
    }

    // Color keyword parsing/lookup
    let colorKeywordValue = colorNames[str];
    if (!colorKeywordValue) colorKeywordValue = colorNames[str.toLowerCase()];
    if (colorKeywordValue) return cb('rgb', ...colorKeywordValue);

    return cb(null);
};

module.exports = parseCSSColor;
