/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/__tests__/setup-env.ts'],
  testPathIgnorePatterns: ['/node_modules/', 'setup-env.ts', 'helpers.ts'],
}
