module.exports = {
  test: {
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
  },
};
