const parser = require('../src/index');

const chai = require('chai');
const chaiAlmost = require('chai-almost');
const { expect } = chai;

chai.use(chaiAlmost(1));

suite('hex', () => {
    test('6-digit hex', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '#ff0000');
    });
    test('3-digit hex', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '#f00');
    });

    test('4-digit hex with alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 0.8]);
        }, '#f00c');
    });
    test('8-digit hex with alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 0.8]);
        }, '#ff0000cc');
    });

    test('uppercase hex', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '#FF0000');
    });
    test('mixed-case hex', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '#Ff0000');
    });

    test('5-digit hex', () => {
        parser(result => {
            expect(result).to.be.null;
        }, '#ff000');
    });
    test('hex with invalid character replaced', () => {
        parser(result => {
            expect(result).to.be.null;
        }, '#ffz000');
    });
    test('hex with invalid character inserted', () => {
        parser(result => {
            expect(result).to.be.null;
        }, '#fffz000');
    });
    test('hex with two hash marks', () => {
        parser(result => {
            expect(result).to.be.null;
        }, '##fff000');
    });
    test('hex with no hash mark', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'fff000');
    });

    test('6-digit hex with leading spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '   #ff0000');
    });
    test('6-digit hex with trailing spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '#ff0000    ');
    });
    test('6-digit hex with leading and trailing spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '   #ff0000    ');
    });

    test('6-digit hex with leading and trailing newlines', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '\n#ff0000\n');
    });
    test('6-digit hex with leading and trailing newlines + carriage returns', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '\r\n#ff0000\n\r');
    });
    test('6-digit hex with leading and trailing tabs', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '\t#ff0000\t');
    });
    test('6-digit hex with leading and trailing mixed whitespace', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hex', 255, 0, 0, 1]);
        }, '\n  \r\t  \t\n   #ff0000\n  \t  \r\n  \t   ');
    });
});

suite('keywords', () => {
    test('red color keyword', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['keyword', 255, 0, 0, 1]);
        }, 'red');
    });
    test('rebeccapurple color keyword', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['keyword', 102, 51, 153, 1]);
        }, 'rebeccapurple');
    });
    test('transparent color keyword', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['keyword', 0, 0, 0, 0]);
        }, 'transparent');
    });

    test('uppercase color keyword', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['keyword', 255, 0, 0, 1]);
        }, 'RED');
    });
    test('uppercase transparent color keyword', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['keyword', 0, 0, 0, 0]);
        }, 'TRANSPARENT');
    });
});

suite('rgb', () => {
    const variants = [
        ['rgba()', 'rgb()'],
        ['with alpha', 'no alpha'],
        ['commas', 'no commas'],
        ['percentages', '0-255']
    ];

    const numPermutations = 2 ** variants.length;
    for (let i = 0; i < numPermutations; i++) {
        const variantValues = [];
        for (let j = 0; j < variants.length; j++) {
            const variantValue = ((i >> j) & 1) === 1;
            variantValues.push(variantValue);
        }

        const [
            functionNameEndsInA,
            hasAlpha,
            hasCommas,
            usesPercentages
        ] = variantValues;

        const runTest = alphaIsPercentage => {
            let channelValues = usesPercentages ? ['50%', '60%', '25%'] : ['127', '153', '64'];
            channelValues = channelValues.join(hasCommas ? ', ': ' ');

            const chosen = variants.map((options, index) => variantValues[index] ? options[0] : options[1]);
            if (hasAlpha) {
                chosen.push(alphaIsPercentage ? 'alpha is a percentage' : 'alpha is a float');
            }

            const testString = `rgb${functionNameEndsInA ? 'a' : ''}(${channelValues}${hasAlpha ? (hasCommas ? ', ' : ' / ') + (alphaIsPercentage ? '30%' : '0.3') : ''})`;

            test(chosen.join(', '), () => {
                parser((...args) => {
                    expect(args).to.be.deep.almost(['rgb', 127, 153, 64, hasAlpha ? 0.3 : 1]);
                }, testString);
            });
        };

        if (hasAlpha) {
            runTest(true);
        }
        runTest(false);
    }

    test('rgb() with decimals', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 31, 61, 41, 1]);
        }, 'rgb(30.7, 60.6, 41.2)');
    });
    test('rgb() with decimals without leading digits', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 0, 0, 0, 1]);
        }, 'rgb(.4, .4, .4)');
    });
    test('rgb() with decimal percentages', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 14, 28, 82, 1]);
        }, 'rgb(5.5%, 10.875%, 32.25%)');
    });
    test('rgb() percentages with multiple decimal points', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(5..5%, 10....875%, 32...25%)');
    });
    test('rgb() with negative percentages', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 0, 28, 0, 1]);
        }, 'rgb(-5%, 10.875%, -32.25%)');
    });
    test('rgb() with unary-positive percentages', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 13, 28, 82, 1]);
        }, 'rgb(+5%, 10.875%, +32.25%)');
    });
    test('rgb() with above-maximum numbers', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 255, 170, 255, 1]);
        }, 'rgb(300, 170, 750)');
    });
    test('rgb() with negative numbers', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 0, 170, 0, 1]);
        }, 'rgb(-132, 170, -72)');
    });
    test('rgb() with unary-positive numbers', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(+132, +170, +73)');
    });
    test('rgb() with unary-positive numbers and no spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(+132+170+73)');
    });
    test('no-comma rgb() without any spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 0, 0, 0, 1]);
        }, 'rgb(.4.4.4)');
    });
    test('rgb() with scientific notation', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 30, 57, 40, 1]);
        }, 'rgb(30e+0, 57000e-3, 4.0e+1)');
    });
    test('rgb() with scientific notation percentages', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 77, 145, 102, 1]);
        }, 'rgb(30e+0%, 57000e-3%, 4e+1%)');
    });
    test('rgb() with missing close-paren', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 128, 192, 64, 1]);
        }, 'rgb(128, 192, 64');
    });
    test('rgb() with extra spaces inside parentheses', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(   132,    170, 73    )');
    });
    test('rgb() with spaces before commas', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(132 , 170 , 73)');
    });
    test('rgb() with commas but no spaces', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(132,170,73)');
    });
    test('rgb() with newlines', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(\n132,\n170,\n73\n)');
    });
    test('rgb() with tabs', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'rgb(\t132,\t170,\t73\t)');
    });
    test('rgba() with too many components', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgba(132, 170, 73, 1, 0.5)');
    });
    test('rgba() with not enough components', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgba(132, 170)');
    });
    test('rgb() with too many components', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(132, 170, 73, 1, 0.5)');
    });
    test('rgb() with not enough components', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(132, 170)');
    });
    test('rgb with no parentheses', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb 132, 170, 73');
    });
    test('rgb with no parentheses or spaces', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb132,170,73');
    });
    test('rgb () with space before opening parenthesis', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb (132, 170, 73)');
    });
    test('rgb() with extra garbage after', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(132, 170, 73)garbage');
    });
    test('rgb() with mixed percentages/numbers', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(5%, 50, 30%)');
    });
    test('rgb() with an "e" where it should not be', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(3e, 50, 30)');
    });
    test('rgb() with extra letters after values', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(3blah, 50, 30)');
    });
    test('rgb() with mixed commas/no commas', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(50 50, 30)');
    });
    test('RGB() in uppercase', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'RGB(132, 170, 73)');
    });
    test('RgB() in mixed case', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 1]);
        }, 'RgB(132, 170, 73)');
    });
    test('rgba() with scientific notation alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['rgb', 132, 170, 73, 0.5]);
        }, 'rgba(132, 170, 73, 5e-1)');
    });
    test('rgb() with no commas and no slash before alpha', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(132 170 73 0.5)');
    });
    test('rgb() with all slashes', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'rgb(132 / 170 / 73 / 0.5)');
    });
});


suite('hsl', () => {
    const variants = [
        ['hsl()', 'hsla()'],
        ['no alpha', 'with alpha'],
        ['no commas', 'commas'],
        ['', 'deg', 'grad', 'rad', 'turn']
    ];

    const numPermutations = variants.reduce((prev, cur) => prev * cur.length, 1);

    for (let i = 0; i < numPermutations; i++) {
        const variantValues = [];
        let variantRange = 1;
        for (let j = 0; j < variants.length; j++) {
            let variantValue = (Math.floor(i / variantRange)) % variants[j].length;
            if (variants[j].length === 2) variantValue = variantValue === 0;
            variantValues.push(variantValue);
            variantRange *= variants[j].length;
        }

        const [
            functionNameEndsInA,
            hasAlpha,
            hasCommas,
        ] = variantValues;

        const runTest = alphaIsPercentage => {
            const chosen = variants.map((options, index) => options[Number(variantValues[index])]);
            const hueUnits = chosen[chosen.length - 1];
            chosen[chosen.length - 1] = hueUnits === '' ? 'no hue unit' : `hue unit is ${hueUnits}`;
            if (hasAlpha) {
                chosen.push(alphaIsPercentage ? 'alpha is a percentage' : 'alpha is a float');
            }

            const hueUnitValues = {
                '': '50',
                'deg': '50deg',
                'grad': '55.5grad',
                'rad': '0.87266rad',
                'turn': '0.139turn'
            };

            let channelValues = [hueUnitValues[hueUnits], '80%', '35%'];
            channelValues = channelValues.join(hasCommas ? ', ': ' ');

            const testString = `hsl${functionNameEndsInA ? 'a' : ''}(${channelValues}${hasAlpha ? (hasCommas ? ', ' : ' / ') + (alphaIsPercentage ? '30%' : '0.3') : ''})`;

            test(chosen.join(', '), () => {
                parser((...args) => {
                    expect(args).to.be.deep.almost(['hsl', 50, 80, 35, hasAlpha ? 0.3 : 1]);
                }, testString);
            });
        };

        if (hasAlpha) {
            runTest(true);
        }
        runTest(false);
    }

    test('hsl() with hue as a percentage', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'hsl(50%, 80%, 35%)');
    });
    test('hsl() with saturation and lightness as floats', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'hsl(50, 0.8, 0.35)');
    });
    test('hsl() with a hue > 360', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hsl', 30, 80, 35, 1]);
        }, 'hsl(750, 80%, 35%)');
    });
    test('hsl() with a hue < -360', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hsl', 220, 80, 35, 1]);
        }, 'hsl(-500, 80%, 35%)');
    });
    test('hsl() with fractional hue', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hsl', 30.51, 80, 35, 1]);
        }, 'hsl(30.51, 80%, 35%)');
    });
    test('hsl() with scientific notation hue', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['hsl', 30.51, 80, 35, 1]);
        }, 'hsl(3051e-2, 80%, 35%)');
    });
});

suite('hwb', () => {
    const variants = [
        ['with alpha', 'no alpha'],
        ['', 'deg', 'grad', 'rad', 'turn']
    ];

    const numPermutations = variants.reduce((prev, cur) => prev * cur.length, 1);

    for (let i = 0; i < numPermutations; i++) {
        const variantValues = [];
        let variantRange = 1;
        for (let j = 0; j < variants.length; j++) {
            let variantValue = (Math.floor(i / variantRange)) % variants[j].length;
            if (variants[j].length === 2) variantValue = variantValue === 1;
            variantValues.push(variantValue);
            variantRange *= variants[j].length;
        }

        const hasAlpha = variantValues[0];

        const runTest = alphaIsPercentage => {

            const chosen = variants.map((options, index) => options[Number(variantValues[index])]);
            const hueUnits = chosen[chosen.length - 1];
            chosen[chosen.length - 1] = hueUnits === '' ? 'no hue unit' : `hue unit is ${hueUnits}`;
            if (hasAlpha) {
                chosen.push(alphaIsPercentage ? 'alpha is a percentage' : 'alpha is a float');
            }

            const hueUnitValues = {
                '': '50',
                'deg': '50deg',
                'grad': '55.5grad',
                'rad': '0.87266rad',
                'turn': '0.139turn'
            };

            let channelValues = [hueUnitValues[hueUnits], '80%', '35%'];
            channelValues = channelValues.join(' ');

            const testString = `hwb(${channelValues}${hasAlpha ? ' / ' + (alphaIsPercentage ? '30%' : '0.3') : ''})`;

            test('hwb(), ' + chosen.join(', '), () => {
                parser((...args) => {
                    expect(args).to.be.deep.almost(['hwb', 50, 80, 35, hasAlpha ? 0.3 : 1]);
                }, testString);
            });
        };

        if (hasAlpha) {
            runTest(true);
        }
        runTest(false);
    }
});

suite('lab', () => {
    test('lab() with no alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lab', 50, 35, -20, 1]);
        }, 'lab(50% 35 -20)');
    });
    test('lab() with alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lab', 50, 35, -20, 0.5]);
        }, 'lab(50% 35 -20 / 0.5)');
    });
    test('lab() with lightness above 100', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lab', 250, 35, -20, 1]);
        }, 'lab(250% 35 -20)');
    });
    test('lab() with lightness below 0', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lab', 0, 35, -20, 1]);
        }, 'lab(-50% 35 -20)');
    });
    test('lab() with large a and b', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lab', 50, 335, -2750, 1]);
        }, 'lab(50% 335 -2750)');
    });
    test('lab() with non-percentage lightness', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'lab(50 35 -20)');
    });
    test('lab() with percentage a and b', () => {
        parser(result => {
            expect(result).to.be.null;
        }, 'lab(50% 33% -20%)');
    });
});

suite('lch', () => {
    test('lch() with no hue unit', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 1]);
        }, 'lch(50% 35 20)');
    });
    test('lch() with deg', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 1]);
        }, 'lch(50% 35 20deg)');
    });
    test('lch() with grad', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 1]);
        }, 'lch(50% 35 22.22grad)');
    });
    test('lch() with rad', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 1]);
        }, 'lch(50% 35 0.349rad)');
    });
    test('lch() with turn', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 1]);
        }, 'lch(50% 35 0.0556turn)');
    });
    test('lch() with alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 35, 20, 0.5]);
        }, 'lch(50% 35 20 / 0.5)');
    });

    test('lch() with lightness above 100', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 250, 35, 20, 1]);
        }, 'lch(250% 35 20)');
    });
    test('lch() with lightness below 0', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 0, 35, 20, 1]);
        }, 'lch(-50% 35 20)');
    });

    test('lch() with large chroma', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 350, 20, 1]);
        }, 'lch(50% 350 20)');
    });
    test('lch() with chroma below 0', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['lch', 50, 0, 20, 1]);
        }, 'lch(50% -50 20)');
    });
});

suite('device-cmyk', () => {
    test('device-cmyk() with percentages', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['device-cmyk', 70, 30, 25, 20, 1, null]);
        }, 'device-cmyk(70% 30% 25% 20%)');
    });
    test('device-cmyk() with mixed percentages and decimals', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['device-cmyk', 70, 30, 25, 20, 1, null]);
        }, 'device-cmyk(70% 0.3 25% 0.2000)');
    });
    test('device-cmyk() with alpha', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['device-cmyk', 70, 30, 25, 20, 0.3, null]);
        }, 'device-cmyk(70% 30% 25% 20% / 0.3)');
    });
    test('device-cmyk() with out-of-range values', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['device-cmyk', 100, 0, 25, 20, 1, null]);
        }, 'device-cmyk(700% -30% 25% 20%)');
    });
    test('device-cmyk() with fallback', () => {
        parser((...args) => {
            expect(args).to.be.deep.almost(['device-cmyk', 70, 30, 25, 20, 0.3, 'rgba(1, 0, 0, 0)']);
        }, 'device-cmyk(70% 30% 25% 20% / 0.3, rgba(1, 0, 0, 0))');
    });
});
