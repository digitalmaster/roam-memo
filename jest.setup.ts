import '@testing-library/jest-dom';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Since we don't have control over the version of react installed on roam
  // let's just supress these warnings
  console.error = (...args) => {
    if (/Invalid prop/.test(args.toString())) {
      return;
    }
    originalConsoleError(...args);
  };
  console.warn = (...args) => {
    if (/componentWillUpdate has been renamed/.test(args.toString())) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
