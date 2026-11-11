'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      const k = String(key);
      return data.has(k) ? data.get(k) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(String(key));
    },
    clear() {
      data.clear();
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null;
    },
    get length() {
      return data.size;
    },
  };
}

function loadScripts(files, opts) {
  opts = opts || {};
  const localStorage = opts.localStorage || memoryStorage();
  const context = {
    console,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Infinity,
    NaN,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    URIError,
    URLSearchParams,
    URL,
    decodeURIComponent,
    encodeURIComponent,
    decodeURI,
    encodeURI,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage,
    sessionStorage: memoryStorage(),
    location: { search: opts.search || '', href: 'http://localhost/index.html' },
  };
  if (opts.globals) Object.assign(context, opts.globals);
  context.globalThis = context;
  context.window = context;
  context.self = context;
  context.global = context;
  vm.createContext(context);
  for (const rel of files) {
    const filename = path.join(ROOT, rel);
    const code = fs.readFileSync(filename, 'utf8');
    vm.runInContext(code, context, { filename });
  }
  return { context, localStorage };
}

function loadTowers() {
  const { context } = loadScripts(['js/towers.js']);
  return context.PNTowers;
}

function loadCombat() {
  const { context } = loadScripts(['js/enemies.js', 'js/rules.js']);
  return context;
}

function loadLevels(opts) {
  return loadScripts(['js/levels.js'], opts);
}

module.exports = {
  memoryStorage,
  loadScripts,
  loadTowers,
  loadCombat,
  loadLevels,
};
