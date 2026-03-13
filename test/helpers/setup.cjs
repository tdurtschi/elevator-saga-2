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

// Load riot.js by executing it in the window context (avoids ESM require issues)
const riotSrc = fs.readFileSync(path.join(__dirname, '../../libs/riot.js'), 'utf8');
vm.runInNewContext(riotSrc, window);
global.riot = window.riot;

// If jQuery or other libs need additional globals, add them here
// (e.g., global.$ = require('jquery'); if needed, but imports handle it)