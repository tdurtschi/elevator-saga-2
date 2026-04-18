const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// Set up global browser-like objects for tests
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };
const store = {};
global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

// If jQuery or other libs need additional globals, add them here
// (e.g., global.$ = require('jquery'); if needed, but imports handle it)