import '@testing-library/jest-dom';

const originalConsoleError = console.error;

// @ts-expect-error
beforeAll(() => {
  console.error = (...args) => {
    if (/Invalid prop/.test(args.toString())) {
      return;
    }
    originalConsoleError(...args);
  };
});

// @ts-expect-error
afterAll(() => {
  console.error = originalConsoleError;
});

module.exports = () => {
  process.env.TZ = 'UTC';
};
