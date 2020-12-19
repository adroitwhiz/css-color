const makeParser = (grammar, root, opts) => {
    const compileRule = (ruleName, depth = 0) => {
        if (!Object.prototype.hasOwnProperty.call(grammar, ruleName)) {
            throw new Error(`Referenced rule ${ruleName} not in grammar`);
        }

        const rule = grammar[ruleName];

        let ruleText;
        let isSingleRule = true;
        switch (typeof rule) {
            case 'object':
                switch (typeof rule.regex) {
                    case 'string':
                        ruleText = rule.regex;
                        break;
                    case 'object':
                        ruleText = Object.values(rule.regex);
                        isSingleRule = false;
                        break;
                }

                break;
            case 'string':
                ruleText = rule;
                break;
            default:
                throw new TypeError(`Incorrect type for grammar rule ${ruleName}`);
        }

        const templateRegex = /\${(.+?)}/g;

        const compileSingle = singleRegex => singleRegex.replace(templateRegex, (match, ref) => {
            return compileRule(ref, depth + 1);
        });

        return isSingleRule ? `(?:${compileSingle(ruleText)})` : `(?:${ruleText.map(singleRegex => {
            return `(${compileSingle(singleRegex)})`;
        }).join('|')})`;
    };

    const compiledRegex = new RegExp(`^${compileRule(root, root)}$`, opts && opts.caseInsensitive ? 'i' : '');

    const pathsRelative = {[root]: 0};
    const visitedRules = new Map();
    const compileRelativePaths = (ruleName, path) => {
        const rule = grammar[ruleName];
        if (visitedRules.has(ruleName)) return visitedRules.get(ruleName);

        if (typeof rule !== 'object') return 0;

        let offset = 1;
        let subgroupLengths = 0;
        for (const group of rule.groups) {
            const [groupName, groupType] = group.split(':');

            pathsRelative[ruleName + '.' + groupName] = offset;
            offset++;

            if (groupType) {
                const numInnerGroups = compileRelativePaths(groupType, path + '.' + groupName);
                offset += numInnerGroups;
                subgroupLengths += numInnerGroups;
            }
        }
        let numGroups = rule.groups.length + subgroupLengths;
        if (typeof rule.regex === 'object') {
            let i = 0;
            const keys = Object.keys(rule.regex);
            for (const regexName of keys) {
                pathsRelative[ruleName + '|' + regexName] = (offset * i++) + 1;
            }

            numGroups = (numGroups + 1) * keys.length;
        }

        visitedRules.set(ruleName, numGroups);
        return numGroups;
    };
    compileRelativePaths(root, root);

    return {
        exec: compiledRegex.exec.bind(compiledRegex),
        pathMap: pathsRelative,
        regex: compiledRegex
    };
};

module.exports = makeParser;
