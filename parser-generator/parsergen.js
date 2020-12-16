const makeParser = (grammar, root, opts) => {
    const compileRule = (ruleName, depth = 0) => {
        if (!Object.prototype.hasOwnProperty.call(grammar, ruleName)) {
            throw new Error(`Referenced rule ${ruleName} not in grammar`);
        }

        const rule = grammar[ruleName];

        let ruleText;
        switch (typeof rule) {
            case 'object':
                ruleText = rule.regex;
                break;
            case 'string':
                ruleText = rule;
                break;
            default:
                throw new TypeError(`Incorrect type for grammar rule ${ruleName}`);
        }

        const templateRegex = /\${(.+?)}/g;

        return ruleText.replace(templateRegex, (match, ref) => {
            return `(?:${compileRule(ref, depth + 1)})`;
        });
    };

    const compiledRegex = new RegExp(`^(?:${compileRule(root, root)})$`, opts && opts.caseInsensitive ? 'i' : '');

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

        const numGroups = rule.groups.length + subgroupLengths;
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
