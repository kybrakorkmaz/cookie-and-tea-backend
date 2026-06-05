export default {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test)gallery.route.js'],
    coverageDirectory: './coverage',
    collectCoverageFrom: ['src/**/*gallery.route.js'],
};