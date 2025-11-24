import '@testing-library/jest-dom';

// Polyfill fetch for tests (simple mock) if needed
if (!globalThis.fetch) {
  globalThis.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
}

// tests/setupTests.js
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = (file) => {
    // devolver un valor simple; puede ser 'mock-url' o un data URL
    return 'mocked-url-' + (file && file.name ? file.name : 'file');
  };
}
