module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePathIgnorePatterns: ["<rootDir>/docs/", "<rootDir>/test-vault/"],

    coveragePathIgnorePatterns: ["src/obsidianUtils.ts"],
	coverageDirectory: "coverage",
	coverageReporters: ["text-summary","text", "lcov"],

    modulePaths: ['<rootDir>', 'node_modules'],
    moduleDirectories: ['src', 'node_modules'],
};
