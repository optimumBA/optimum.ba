import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('Pages output preserves the empty 404 and contains its security policy', () => {
 assert.equal(fs.readFileSync('dist/404.html','utf8'), '');
 const headers = fs.readFileSync('dist/_headers','utf8');
 assert.match(headers, /X-Content-Type-Options: nosniff/);
 assert.match(headers, /frame-ancestors 'none'/);
 assert.match(headers, /https:\/\/fonts.googleapis.com/);
 assert.match(headers, /https:\/\/fonts.gstatic.com/);
 assert.match(headers, /application\/rss\+xml/);
});
