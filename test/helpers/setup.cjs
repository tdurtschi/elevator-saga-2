// test/helpers/setup.cjs
const { JSDOM } = require('jsdom');

// Create a simulated DOM environment
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = dom;

// Assign to global to mimic browser globals
global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node' };

require("../../libs/riot.js");
global.riot = window.riot;

// If your tests use other browser APIs, add polyfills here (e.g., for requestAnimationFrame)
window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
window.cancelAnimationFrame = (id) => clearTimeout(id);