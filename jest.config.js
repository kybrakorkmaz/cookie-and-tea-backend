export default {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    coverageDirectory: './coverage',
    collectCoverageFrom: ['src/**/*.js'],
    transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
    },
    setupFilesAfterEnv: [
        '<rootDir>/__tests__/setup/cloudinary.js',
        '<rootDir>/__tests__/setup/stripe.js',
    ],
};