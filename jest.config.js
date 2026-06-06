export default {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    coverageDirectory: './coverage',
    collectCoverageFrom: ['src/**/*.js'],
};