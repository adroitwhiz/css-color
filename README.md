# css-color-parser

`css-color-parser` is a CSS Color Module Level 4-compliant CSS color value parser. Its goal is to parse any color values defined in the CSS Color Module Level 4, and to refuse to parse any other values. This is to ensure complete consistency with, for instance, web browsers. In comparison, most other JS color parsers both fail to parse color values that browsers will accept, and succeed in parsing bogus values that browsers will ignore. I've also created an extensive [test suite](https://github.com/adroitwhiz/css-color-parser-test-suite) for CSS color parsers, which includes many of the edge cases that other parsers currently fail on.

This library doesn't include any color conversion functionality--it is solely focused on parsing.

## Usage

The parser function is the default export:

```js
const parseColor = require('css-color-parser');
```

### Argument Order and Ranges

The parser function takes two arguments, a callback which is passed the parsed color values as arguments and the color string to be parsed (this API is designed to minimize GC pressure). It returns the callback's return value.

If the color could not be successfully parsed, the callback will be called with `null` as its only argument. Otherwise:

The first argument passed to the callback is the type of color, one of `rgb`, `hsl`, `hwb`, `lab`, `lch`, or `device-cmyk`. Hex colors and named colors are converted to `rgb`.

The next 3 arguments (or 4 if the color is of type `device-cmyk`) are the color channel values.

The red, green, and blue channel values (passed in that order) are all numbers (though not necessarily integers) that range from 0 to 255.

The hue channel value, the first one passed for both `hsl` and `hwb` and the last one passed for `lch`, is a number that ranges from 0 to 360.

The saturation, lightness, white, and black values (the next two arguments for `hsl` and `hwb` respectively) are numbers that range from 0 to 100.

The `lab` lightness value (the first one passed) is a number that ranges from 0 to +Infinity.

The `lab` `a` and `b` values (the next two passed) are numbers that range from -Infinity to +Infinity and center around 0.

The `lch` chroma value (the second one passed) is a number that ranges from 0 to +Infinity.

The cyan, magenta, yellow, and black values for `device-cmyk` (passed in that order) are numbers that range from 0 to 100.

The next argument after all 3 or 4 color channel values is the alpha value. It ranges from 0 to 1.

For the `device-cmyk` color type, there will be one additional argument after the alpha value: the fallback color. This is a string that represents an unparsed CSS color. It can itself be parsed.

### Examples

#### Basics

```js
parseColor((type, c1, c2, c3, a) => {
    // type === 'rgb';
    // c1 === 127;
    // c2 === 0;
    // c3 === 60;
    // a = 0.5;
}, 'rgba(127, 0, 60, 0.5)');

parseColor((type, c1, c2, c3, a) => {
    // type === 'hsl';
    // c1 === 180;
    // c2 === 50;
    // c3 === 25;
    // a = 0.75;
}, 'hsla(0.5turn 50% 25% 75%)');
```

#### Constructing your own color classes

```js
class MyColor {
    constructor(red, green, blue, alpha) {...}
}

const instanceOfMyColor = parseColor((type, c1, c2, c3, a) => {
    if (type !== 'rgb') {
        // You could use a color conversion library here, or just throw an error
    } else {
        return new MyColor(c1, c2, c3, a);
    }
}, 'rgba(127, 0, 60, 0.5)');
```

If you're feeling fancy, you can bind the parser to a callback and create your own "factory" function:

```js
class MyColor {
    constructor(red, green, blue, alpha) {...}
}

const colorFactory = parseColor.bind(null, (type, c1, c2, c3, a) => {
    if (type !== 'rgb') {
        // You could use a color conversion library here, or just throw an error
    } else {
        return new MyColor(c1, c2, c3, a);
    }
});

const color1 = colorFactory('rgba(127, 0, 60, 0.5)');
const color2 = colorFactory('#fc08dc');
// and so on...
```

## Development

At the core of the parser is a set of very large regexes, which is automatically generated from the grammar in `parser-generator/generate-csscolor.js`. In order to rerun this generation after changing the grammar, use:

```bash
npm run generate-parsers
```

Benchmarks can be run using:
```bash
npm run benchmark

# To run a specific benchmark
npm run benchmark -- <hex, rgb, hsl, hwb, keywords>
```
Note that as many other parsers are much more limited in what they can parse (and parse failures are often much faster), the results should be taken with a grain of salt.

## Limitations

- The `color()` function syntax is currently not supported.
- `currentcolor` is currently not supported.