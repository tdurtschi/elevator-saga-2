const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// Set up global browser-like objects for tests
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };

// Load unobservable.js by executing it in the window context (avoids ESM require issues)
const unobservableSrc = fs.readFileSync(path.join(__dirname, '../../libs/unobservable.js'), 'utf8');
vm.runInNewContext(unobservableSrc, window);
global.unobservable = window.unobservable;

// If jQuery or other libs need additional globals, add them here
// (e.g., global.$ = require('jquery'); if needed, but imports handle it)