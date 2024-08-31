import '@testing-library/jest-dom';

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    if (/Invalid prop/.test(args.toString())) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
