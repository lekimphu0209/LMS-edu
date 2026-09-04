const base = require('./base.cjs');

module.exports = {
  ...base,
  test: {
    ...base.test,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
  },
};
