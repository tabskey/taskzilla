import type { Config } from 'jest';

const config: Config = {
  preset:          'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles:  ['<rootDir>/src/__tests__/setup.ts'],
  testMatch:   ['**/__tests__/**/*.spec.ts'], 
};

module.exports = config;