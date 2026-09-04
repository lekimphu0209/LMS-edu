const base = require('./base.cjs');

module.exports = {
  ...base,
  test: {
    ...base.test,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
};
