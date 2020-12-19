const makeParser = require('./parsergen.js');

const fullGrammar = {
    hexColor: '#[0-9a-zA-Z]{8}|#[0-9a-zA-Z]{6}|#[0-9a-zA-Z]{3,4}',
    namedColor: 'a(?:liceblue|ntiquewhite|qua(?:marine)?|zure)|b(?:eige|isque|l(?:a(?:ck|nchedalmond)|ue(?:violet)?)|rown|urlywood)|c(?:adetblue|h(?:artreuse|ocolate)|or(?:al|n(?:flowerblue|silk))|rimson|yan)|d(?:ark(?:blue|cyan|g(?:oldenrod|r(?:ay|e(?:en|y)))|khaki|magenta|o(?:livegreen|r(?:ange|chid))|red|s(?:almon|eagreen|late(?:blue|gr(?:ay|ey)))|turquoise|violet)|eep(?:pink|skyblue)|imgr(?:ay|ey)|odgerblue)|f(?:irebrick|loralwhite|orestgreen|uchsia)|g(?:ainsboro|hostwhite|old(?:enrod)?|r(?:ay|e(?:en(?:yellow)?|y)))|ho(?:neydew|tpink)|i(?:ndi(?:anred|go)|vory)|khaki|l(?:a(?:vender(?:blush)?|wngreen)|emonchiffon|i(?:ght(?:blue|c(?:oral|yan)|g(?:oldenrodyellow|r(?:ay|e(?:en|y)))|pink|s(?:almon|eagreen|kyblue|lategr(?:ay|ey)|teelblue)|yellow)|me(?:green)?|nen))|m(?:a(?:genta|roon)|edium(?:aquamarine|blue|orchid|purple|s(?:eagreen|lateblue|pringgreen)|turquoise|violetred)|i(?:dnightblue|ntcream|styrose)|occasin)|nav(?:ajowhite|y)|o(?:l(?:dlace|ive(?:drab)?)|r(?:ange(?:red)?|chid))|p(?:a(?:le(?:g(?:oldenrod|reen)|turquoise|violetred)|payawhip)|e(?:achpuff|ru)|ink|lum|owderblue|urple)|r(?:e(?:beccapurple|d)|o(?:sybrown|yalblue))|s(?:a(?:ddlebrown|lmon|ndybrown)|ea(?:green|shell)|i(?:enna|lver)|kyblue|late(?:blue|gr(?:ay|ey))|now|pringgreen|teelblue)|t(?:an|eal|histle|omato|urquoise)|violet|wh(?:eat|ite(?:smoke)?)|yellow(?:green)?',
    number: '[+-]?(?:\\d*\\.\\d+|\\d+)(?:[eE][+-]\\d+)?',
    percentage: '${number}%',
    angle: {
        regex: '(${number})(deg|g?rad|turn)',
        groups: ['value:number', 'unit']
    },
    hue: {
        regex: '(${angle})|(${number})',
        groups: ['angle:angle', 'number:number']
    },
    numberOrPercentage: {
        regex: '(${number})|(${percentage})',
        groups: ['number:number', 'percentage:percentage']
    },
    w: '\\s*',
    rgbPercentage: {
        regex: {
            spaces: 'rgba?\\(${w}(${percentage})${w}(${percentage})${w}(${percentage})${w}(?:\\/${w}(${numberOrPercentage})${w})?\\)?',
            commas: 'rgba?\\(${w}(${percentage})${w},${w}(${percentage})${w},${w}(${percentage})${w}(?:,${w}(${numberOrPercentage})${w})?\\)?'
        },
        groups: ['red:percentage', 'green:percentage', 'blue:percentage', 'alpha:numberOrPercentage']
    },
    rgbNumber: {
        regex: {
            spaces: 'rgba?\\(${w}(${number})${w}(${number})${w}(${number})${w}(?:\\/${w}(${numberOrPercentage}))?${w}\\)?',
            commas: 'rgba?\\(${w}(${number})${w},${w}(${number})${w},${w}(${number})${w}(?:,${w}(${numberOrPercentage})${w})?\\)?'
        },
        groups: ['red:number', 'green:number', 'blue:number', 'alpha:numberOrPercentage']
    },
    hsl: {
        regex: {
            spaces: 'hsla?\\(${w}(${hue})${w}(${percentage})${w}(${percentage})${w}(?:\\/${w}(${numberOrPercentage})${w})?\\)?',
            commas: 'hsla?\\(${w}(${hue})${w},${w}(${percentage})${w},${w}(${percentage})${w}(?:,${w}(${numberOrPercentage})${w})?\\)?',
        },
        groups: ['hue:hue', 'saturation:percentage', 'lightness:percentage', 'alpha:numberOrPercentage']
    },
    rgb: {
        regex: '(${rgbPercentage})|(${rgbNumber})',
        groups: ['rgbPercentage:rgbPercentage', 'rgbNumber:rgbNumber']
    },
    hwb: {
        regex: 'hwb\\(${w}(${hue})${w}(${percentage})${w}(${percentage})${w}(?:\\/${w}(${numberOrPercentage})${w})?\\)?',
        groups: ['hue:hue', 'whiteness:percentage', 'blackness:percentage', 'alpha:numberOrPercentage']
    },
    lab: {
        regex: 'lab\\(${w}(${percentage})${w}(${number})${w}(${number})${w}(?:\\/${w}(${numberOrPercentage})${w})?\\)?',
        groups: ['lightness:percentage', 'a:number', 'b:number', 'alpha:numberOrPercentage']
    },
    lch: {
        regex: 'lch\\(${w}(${percentage})${w}(${number})${w}(${hue})${w}(?:\\/${w}(${numberOrPercentage})${w})?\\)?',
        groups: ['lightness:percentage', 'chroma:number', 'hue:hue', 'alpha:numberOrPercentage']
    },
    deviceCmyk: {
        regex: 'device-cmyk\\(${w}(${numberOrPercentage})${w}(${numberOrPercentage})${w}(${numberOrPercentage})${w}(${numberOrPercentage})${w}(?:\\/${w}(${numberOrPercentage}(?:${w},${w}(.+?))?)${w})?\\)?',
        groups: ['c:numberOrPercentage', 'm:numberOrPercentage', 'y:numberOrPercentage', 'k:numberOrPercentage', 'alpha:numberOrPercentage', 'fallback']
    }/*,
    color: {
        regex: '(transparent)|(${namedColor})|(${hexColor})|(${rgb})|(${hsl})|(${hwb})|(${lab})|(${lch})|(${deviceCmyk})',
        groups: ['transparent', 'namedColor:namedColor', 'hexColor:hexColor', 'rgb:rgb', 'hsl:hsl', 'hwb:hwb', 'lab:lab', 'lch:lch', 'device-cmyk:device-cmyk']
    },*/
};

// Instead of matching on one big regex, split it up into several smaller ones, then decide which to use based on the first few characters.
const parserDefs = {
    rgbParser: 'rgb',
    hslParser: 'hsl',
    hwbParser: 'hwb',
    labParser: 'lab',
    lchParser: 'lch',
    deviceCmykParser: 'deviceCmyk'
};

const parsers = {};
for (const [k, v] of Object.entries(parserDefs)) {
    parsers[k] = makeParser(fullGrammar, v, {caseInsensitive: true});
}


// Create a "fast-path" parser with a much stricter definition of a number. This is a ~20% performance improvement.
// This can't parse things like scientific notation, but for that we can fall back to the slow-path parser.
fullGrammar.number = '\\d+(?:\\.\\d+)?';

const fastParsers = {};
for (const [k, v] of Object.entries(parserDefs)) {
    fastParsers[k] = makeParser(fullGrammar, v, {caseInsensitive: true});
}

const genCodeFromParser = (parser, fastParser) => {
    return `{
    relMap: ${JSON.stringify(parser.pathMap)},
    regex: ${parser.regex.toString()},
    fastRegex: ${fastParser.regex.toString()}
}`;
};

console.log(Object.keys(parserDefs).map(parserIdent =>
    `module.exports.${parserIdent} = ${genCodeFromParser(parsers[parserIdent], fastParsers[parserIdent])};`
).join('\n\n'));
