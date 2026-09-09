import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync('static/js/analytics.js', 'utf8');
function run(url, repeat = false) {
 const scripts = [], window = {location: new URL(url)};
 const document = {querySelector: () => scripts[0], createElement: () => ({dataset: {}}), head: {appendChild: script => scripts.push(script)}};
 vm.runInNewContext(code, {window, document});
 if (repeat) vm.runInNewContext(code, {window, document});
 return {window, scripts};
}
test('only the canonical HTTPS host loads Plausible, once', () => {
 for (const host of ['http://optimum.ba/', 'http://localhost:4321/', 'https://www.optimum.ba/', 'https://optimum-ba.pages.dev/', 'https://preview.optimum-ba.pages.dev/']) assert.equal(run(host).scripts.length, 0, host);
 const {scripts, window} = run('https://optimum.ba/blog/test/?email=private#section', true);
 assert.equal(scripts.length, 1);
 assert.equal(scripts[0].src, 'https://plausible.io/js/pa-L9tGewdmu_Uy8MsVELS5p.js');
 assert.equal(window.plausible.o.transformRequest({u: window.location.href}).u, 'https://optimum.ba/blog/test/');
});
