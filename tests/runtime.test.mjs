import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync('main.js', 'utf8');
function boot(overrides = {}) {
  const attrs = {}, listeners = {};
  const classes = { add() {}, toggle() {}, contains() { return false; } };
  const document = { documentElement: { setAttribute(k,v) { attrs[k]=v; }, style: { setProperty() {} }, classList: classes }, body: { classList: classes }, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, addEventListener(k,v) { listeners[k]=v; } };
  let calls = 0;
  document.startViewTransition = function(cb) { assert.equal(this, document); calls++; cb(); return { finished: Promise.resolve(), updateCallbackDone: Promise.resolve() }; };
  const window = { addEventListener() {}, removeEventListener() {}, innerWidth:1440, innerHeight:900 };
  Object.assign(window, overrides);
  const context = { document, window, navigator: {}, location: { href:'https://example.org/', search:'' }, history: { replaceState() {} }, localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } }, URL, URLSearchParams, setTimeout(){ return 1; }, clearTimeout(){}, Element:class Element { closest(selector) { return selector.includes("theme") ? { getAttribute() { return "light"; } } : null; } } };
  vm.runInNewContext(source, context);
  return { attrs, document, listeners, Element: context.Element, get calls() { return calls; } };
}
test('startup succeeds with storage, matchMedia, RAF and observers unavailable', () => {
  const app=boot(); assert.equal(app.attrs['data-theme'], 'dark'); assert.equal(app.attrs['data-lang'], 'es'); assert.ok(app.listeners.click);
});
test('theme toggle retains Document receiver', () => {
  const app=boot();
  app.listeners.click({ target:new app.Element(), preventDefault() {} });
  assert.equal(app.calls,1); assert.equal(app.attrs['data-theme'],'light');
});
