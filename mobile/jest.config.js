module.exports = {
  preset: "jest-expo",
  setupFiles: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/domain/**/*.ts",
    "!src/domain/**/*.d.ts",
  ],
  coverageThreshold: {
    "src/domain/": {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
};
