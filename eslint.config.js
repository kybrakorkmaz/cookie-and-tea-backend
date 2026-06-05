import pluginImport from "eslint-plugin-import";

export default [
    {
        // 1. Define which files to lint
        files: ["**/*gallery.route.js"],

        // 2. Configure the environment (Node.js)
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                process: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                URL: "readonly",
            },
        },

        plugins: {
            import: pluginImport,
        },

        // 3. The Rules
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],        // Highlights variables you forgot to use
            "no-undef": "error",             // Errors if you use something not defined
            "no-console": "off",             // Allow console.logs for backend debugging
            "prefer-const": "error",         // Suggests 'const' if variable isn't reassigned
            "eqeqeq": ["error", "always"],   // Forces '===' instead of '=='
            "import/extensions": ["error", "ignorePackages"], // Allow package imports without gallery.route.js, but require it for local imports
        },
    },
];