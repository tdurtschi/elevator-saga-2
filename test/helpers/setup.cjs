const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// Set up global browser-like objects for tests
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };

require("../../libs/riot.js");
global.riot = window.riot;

// If jQuery or other libs need additional globals, add them here
// (e.g., global.$ = require('jquery'); if needed, but imports handle it)