import test from 'node:test'
import assert from 'node:assert/strict'
import { createSaveQueue, validateProjectBackup, workspacePayload } from '../src/lib/projectData.js'
const one='11111111-1111-4111-8111-111111111111'
const two='22222222-2222-4222-8222-222222222222'
const three='33333333-3333-4333-8333-333333333333'
const backup = () => ({ owner_id:'owner',name:'My project',sections:[],nodes:[{ id:one,canvas_kind:'character' },{ id:two,canvas_kind:'character' }],links:[{ id:three,canvas_kind:'character',source_id:one,target_id:two }],events:[] })
test('rejects foreign backups, duplicate identifiers and cross-canvas links', () => {
 assert.equal(validateProjectBackup(backup(),'owner').name,'My project')
 assert.throws(() => validateProjectBackup(backup(),'someone-else'))
 const duplicate=backup(); duplicate.sections.push({ id:one }); assert.throws(() => validateProjectBackup(duplicate,'owner'))
 const cross=backup(); cross.nodes[1].canvas_kind='land'; assert.throws(() => validateProjectBackup(cross,'owner'))
 const missing=backup(); missing.links[0].target_id=crypto.randomUUID(); assert.throws(() => validateProjectBackup(missing,'owner'))
})
test('cloud payload strips privileged metadata and derived row fields', () => {
 const draft={ ...backup(),status:'published',public_snapshot:{ secret:true },share_token:'secret',member_role:'owner' }
 draft.nodes[0].project_id='another-project'; draft.nodes[0].image_url='temporary-url'
 const payload=workspacePayload(draft)
 assert.equal(payload.metadata.owner_id,undefined); assert.equal(payload.metadata.public_snapshot,undefined)
 assert.equal(payload.nodes[0].project_id,undefined); assert.equal(payload.nodes[0].image_url,undefined)
 assert.equal(payload.links[0].source_id,one)
})
test('autosave queue serializes writes and recovers after a failure', async () => {
 const writes=[]
 let release
 const blocked=new Promise((resolve) => { release=resolve })
 const enqueue=createSaveQueue(async (snapshot) => { writes.push(`start:${snapshot}`); if(snapshot==='first') await blocked; if(snapshot==='failure') throw new Error('Offline'); writes.push(`end:${snapshot}`) })
 const a=enqueue('first'); const b=enqueue('failure'); const failed=assert.rejects(b,/Offline/); const c=enqueue('latest')
 await Promise.resolve(); await Promise.resolve(); assert.deepEqual(writes,['start:first'])
 release(); await a; await failed; await c
 assert.deepEqual(writes,['start:first','end:first','start:failure','start:latest','end:latest'])
})
