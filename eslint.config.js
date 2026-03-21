import js from "@eslint/js";

export default [
    {
        ignores: ["dist/**", "node_modules/**", "libs/**"],
    },
    {
        ...js.configs.recommended,
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // Browser
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                localStorage: "readonly",
                location: "readonly",
                fetch: "readonly",
                confirm: "readonly",
                alert: "readonly",
                navigator: "readonly",
                MutationObserver: "readonly",
                // Node
                process: "readonly",
                __dirname: "readonly",
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        },
    },
    {
        files: ["spec/**/*.js"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                spyOn: "readonly",
                jasmine: "readonly",
            },
        },
    },
    {
        files: ["playwright-tests/**/*.js"],
        languageOptions: {
            globals: {
                monaco: "readonly",
                MutationObserver: "readonly",
            },
        },
    },
];
