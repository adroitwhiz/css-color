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

    const paths = [];
    const compileGroupPaths = (ruleName, path) => {
        const rule = grammar[ruleName];

        if (typeof rule !== 'object') return;

        for (const group of rule.groups) {
            const [groupName, groupType] = group.split(':');

            paths.push(path + '.' + groupName);

            if (groupType) {
                compileGroupPaths(groupType, path + '.' + groupName);
            }
        }
    };
    compileGroupPaths(root, root);

    const pathMap = {};
    for (let i = 0; i < paths.length; i++) {
        pathMap[paths[i]] = i + 1;
    }

    return {
        exec: compiledRegex.exec.bind(compiledRegex),
        pathMap,
        regex: compiledRegex
    };
};

module.exports = makeParser;
