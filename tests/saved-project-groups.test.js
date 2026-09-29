import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readSavedProjectGroups, toggleSavedProjectGroup } from '../src/lib/savedProjectGroups.js'

test('saved project teams stay scoped to the current account and tolerate invalid local data', () => {
  const values = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  try {
    assert.deepEqual(toggleSavedProjectGroup('alice', 'public-project'), ['public-project'])
    assert.deepEqual(readSavedProjectGroups('bob'), [])
    assert.deepEqual(toggleSavedProjectGroup('alice', 'public-project'), [])
    values.set('mora:saved-project-groups:bob', '{broken')
    assert.deepEqual(readSavedProjectGroups('bob'), [])
  } finally { globalThis.localStorage = previous }
})
