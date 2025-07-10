module.exports = {
    tabWidth: 4,
    printWidth: 180,
    singleQuote: true,
    trailingComma: 'all',
    semi: true,
    bracketSpacing: true,
    arrowParens: 'avoid',
    endOfLine: 'lf',
    overrides: [
        {
            files: '*.{json,yml,yaml,md}',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
