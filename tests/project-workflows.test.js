import assert from 'node:assert/strict'
import { test } from 'node:test'
import { budgetTotal, matchesToEarn } from '../src/lib/gameEconomy.js'
import { projectWorkflow, sectionBelongsToTab, sectionForTab } from '../src/lib/projectWorkflows.js'

test('Story, Game Design and Game Event expose the right project sections', () => {
  const story = projectWorkflow('Novel')
  const game = projectWorkflow('Game')
  const event = projectWorkflow('Game Event')

  assert.ok(story.tabs.includes('lore'))
  assert.ok(!story.tabs.includes('currency'))
  assert.ok(game.tabs.includes('currency'))
  assert.ok(game.tabs.includes('skins'))
  assert.ok(event.tabs.includes('game_events'))
  assert.ok(!event.tabs.includes('items'))
  assert.ok(projectWorkflow('Film').tabs.includes('story'))
  assert.equal(projectWorkflow('Film').labels.events, 'Cảnh quay')
})

test('lore and game economy entries stay out of generic custom notes', () => {
  const lore = sectionForTab('lore', 'Lore', 0)
  const currency = { section_type: 'custom', content: { category: 'game_currency' } }
  const board = { section_type: 'custom', content: { category: 'board_element', board_tab: 'overview', text: 'Riêng tư' } }
  const note = sectionForTab('custom', 'Note', 1)

  assert.ok(sectionBelongsToTab(lore, 'lore'))
  assert.ok(!sectionBelongsToTab(lore, 'custom'))
  assert.ok(!sectionBelongsToTab(currency, 'custom'))
  assert.ok(!sectionBelongsToTab(board, 'custom'))
  assert.ok(!sectionBelongsToTab(board, 'lore'))
  assert.ok(sectionBelongsToTab(note, 'custom'))
})

test('prices use their own game currency and production budget is independent', () => {
  assert.equal(matchesToEarn(750, 80), 10)
  assert.equal(matchesToEarn(0, 80), 0)
  assert.equal(matchesToEarn(750, 0), null)
  assert.equal(budgetTotal([{ content: { productionCost: '1200000' } }, { content: { productionCost: 800000 } }]), 2000000)
})
