import pluginImport from "eslint-plugin-import";

export default [
    {
        // 1. Define which files to lint
        files: ["**/*.js"],

        // 2. Configure the environment (Node.js)
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                process: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                // This allows the use of 'node' globals without errors
                __dirname: "readonly",
            },
        },

        plugins: {
            import: pluginImport,
        },

        // 3. The Rules
        rules: {
            "no-unused-vars": "warn",        // Highlights variables you forgot to use
            "no-undef": "error",             // Errors if you use something not defined
            "no-console": "off",             // Allow console.logs for backend debugging
            "prefer-const": "error",         // Suggests 'const' if variable isn't reassigned
            "eqeqeq": ["error", "always"],   // Forces '===' instead of '=='
            "import/extensions": ["error", "always"], // Forces .js in imports (required for Node ESM)
        },
    },
];