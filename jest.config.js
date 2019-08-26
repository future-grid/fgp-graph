module.exports = {
    testPathIgnorePatterns: ['/node_modules/'],
    transform: {
        '^.+\\.(t|j)sx?$': 'ts-jest'
    },
    testMatch: ['<rootDir>/tests/**/*.[jt]s?(x)']
};
