import test from 'node:test'
import assert from 'node:assert/strict'
import { validateImage, safeExternalLinks } from '../src/lib/mediaValidation.js'
import { readBookmarks, toggleBookmark } from '../src/lib/bookmarks.js'
const values=new Map()
globalThis.localStorage={ getItem:(key) => values.get(key) ?? null,setItem:(key,value) => values.set(key,value) }
test('bookmarks cannot leak between accounts or create guest entries', () => {
 values.clear(); toggleBookmark('first','post-a'); toggleBookmark('second','post-b')
 assert.deepEqual(readBookmarks('first'),['post-a']); assert.deepEqual(readBookmarks('second'),['post-b'])
 assert.throws(() => toggleBookmark(null,'post-a'))
 values.set('mora:saved-posts:first','not-json'); assert.deepEqual(readBookmarks('first'),[])
 values.set('mora:saved-posts:first','{}'); assert.deepEqual(readBookmarks('first'),[])
})
test('image uploads reject MIME spoofing, unsupported formats and empty files', async () => {
 const png=new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0])],{ type:'image/png' })
 assert.equal(await validateImage(png),'png')
 await assert.rejects(validateImage(new Blob(['<svg onload="bad()">'],{ type:'image/png' })))
 await assert.rejects(validateImage(new Blob(['svg'],{ type:'image/svg+xml' })))
 await assert.rejects(validateImage(new Blob([],{ type:'image/jpeg' })))
})
test('public contact links only allow HTTP and HTTPS', () => {
 assert.deepEqual(safeExternalLinks({ web:'https://mour.example',script:'javascript:alert(1)',file:'file:///tmp/data',data:'data:text/html,x' }),[['web','https://mour.example']])
})
