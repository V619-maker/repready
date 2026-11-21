import assert from 'node:assert/strict'
import { validateAssignmentInput, dueDateEndMs, repStatus, targetsOf, evaluateAssignment, assignmentsForRep, isOpenStatus, ASSIGNMENT_LIMITS } from './assignments.mjs'

let n = 0
const t = (fn) => { fn(); n++ }
const NOW = Date.parse('2026-11-21T10:00:00Z')
const base = { title: 'Price defence', persona: 'richard' }

// ---- validation ----
t(() => assert.equal(validateAssignmentInput(base, { orgDomain: 'acme.com', now: NOW }).ok, true))
t(() => assert.equal(validateAssignmentInput({ ...base, title: '   ' }, { now: NOW }).ok, false))
t(() => assert.equal(validateAssignmentInput({ ...base, persona: 'bob' }, { now: NOW }).ok, false))
t(() => assert.equal(validateAssignmentInput({ ...base, persona: '__proto__' }, { now: NOW }).ok, false))
t(() => assert.equal(validateAssignmentInput({ ...base, title: 'x'.repeat(500) }, { now: NOW }).value.title.length, ASSIGNMENT_LIMITS.title))
t(() => assert.equal(validateAssignmentInput({ ...base, title: 'a\n\n  b' }, { now: NOW }).value.title, 'a b'))
// due dates
t(() => assert.equal(validateAssignmentInput({ ...base, dueDate: '2026-12-01' }, { now: NOW }).value.dueDate, '2026-12-01'))
for (const bad of ['2026-02-30', '12/01/2026', 'tomorrow', '2026-13-01', '2026-11-20', '2028-01-01']) t(() => assert.equal(validateAssignmentInput({ ...base, dueDate: bad }, { now: NOW }).ok, false, bad))
t(() => assert.equal(validateAssignmentInput({ ...base, dueDate: '2026-11-21' }, { now: NOW }).ok, true)) // today is fine until the day ends in IST
t(() => assert.equal(validateAssignmentInput({ ...base, dueDate: '' }, { now: NOW }).value.dueDate, null))
// min score
t(() => assert.equal(validateAssignmentInput({ ...base, minScore: '70' }, { now: NOW }).value.minScore, 70))
for (const bad of [0, 101, 'abc', -5]) t(() => assert.equal(validateAssignmentInput({ ...base, minScore: bad }, { now: NOW }).ok, false, String(bad)))
// assignees
const a = validateAssignmentInput({ ...base, assignees: 'A@Acme.com, b@acme.com;\n a@acme.com' }, { orgDomain: 'acme.com', now: NOW })
t(() => assert.deepEqual(a.value.assignees, ['a@acme.com', 'b@acme.com']))
t(() => assert.equal(validateAssignmentInput({ ...base, assignees: ['x@other.com'] }, { orgDomain: 'acme.com', now: NOW }).ok, false))
t(() => assert.equal(validateAssignmentInput({ ...base, assignees: ['nope'] }, { orgDomain: 'acme.com', now: NOW }).ok, false))
t(() => assert.deepEqual(validateAssignmentInput({ ...base, assignees: '' }, { now: NOW }).value.assignees, []))
t(() => assert.equal(validateAssignmentInput({ ...base, assignees: Array.from({ length: 501 }, (_, i) => `u${i}@acme.com`) }, { orgDomain: 'acme.com', now: NOW }).ok, false))

// ---- due date end is end of day in IST ----
t(() => assert.equal(new Date(dueDateEndMs('2026-12-01')).toISOString(), '2026-12-01T18:29:59.999Z'))
t(() => assert.equal(dueDateEndMs('2026-02-30'), null))

// ---- rep status ----
const A = { id: '1', persona: 'richard', createdAt: '2026-11-20T00:00:00Z', dueDate: '2026-11-25', minScore: 70, assignees: [] }
const s = (persona, score, at) => ({ persona, finalScore: score, createdAt: at })
t(() => assert.equal(repStatus(A, [], NOW).status, 'pending'))
t(() => assert.equal(repStatus(A, [s('richard', 80, '2026-11-21T00:00:00Z')], NOW).status, 'done'))
t(() => assert.equal(repStatus(A, [s('richard', 50, '2026-11-21T00:00:00Z')], NOW).status, 'attempted'))
t(() => assert.equal(repStatus(A, [s('richard', 50, '2026-11-21T00:00:00Z')], NOW).bestScore, 50))
t(() => assert.equal(repStatus(A, [s('sandra', 99, '2026-11-21T00:00:00Z')], NOW).status, 'pending'))     // wrong buyer
t(() => assert.equal(repStatus(A, [s('richard', 99, '2026-11-19T00:00:00Z')], NOW).status, 'pending'))     // before assignment
t(() => assert.equal(repStatus(A, [], Date.parse('2026-11-26T00:00:00Z')).status, 'overdue'))
t(() => assert.equal(repStatus(A, [s('richard', 40, '2026-11-21T00:00:00Z')], Date.parse('2026-11-26T00:00:00Z')).status, 'overdue'))
t(() => assert.equal(repStatus(A, [s('richard', 90, '2026-11-27T00:00:00Z')], Date.parse('2026-11-28T00:00:00Z')).status, 'done_late'))
t(() => assert.equal(repStatus(A, [s('richard', 90, '2026-11-25T18:00:00Z')], Date.parse('2026-11-28T00:00:00Z')).status, 'done'))  // 23:30 IST on the due day
t(() => assert.equal(repStatus(A, [s('richard', 90, '2026-11-25T19:00:00Z')], Date.parse('2026-11-28T00:00:00Z')).status, 'done_late')) // 00:30 IST next day
t(() => assert.equal(repStatus({ ...A, minScore: null }, [s('richard', 1, '2026-11-21T00:00:00Z')], NOW).status, 'done'))
t(() => assert.equal(repStatus({ ...A, dueDate: null }, [], Date.parse('2030-01-01')).status, 'pending'))        // no due date never overdue
// earliest passing session is the completion time
t(() => assert.equal(repStatus(A, [s('richard', 95, '2026-11-23T00:00:00Z'), s('richard', 75, '2026-11-21T00:00:00Z')], NOW).completedAt, '2026-11-21T00:00:00Z'))
t(() => assert.equal(repStatus(A, [s('richard', 95, '2026-11-23T00:00:00Z'), s('richard', 75, '2026-11-21T00:00:00Z')], NOW).attempts, 2))

// ---- targets + evaluate ----
t(() => assert.deepEqual(targetsOf({ assignees: ['a@x.co'] }, ['b@x.co']), ['a@x.co']))
t(() => assert.deepEqual(targetsOf({ assignees: [] }, ['B@x.co', 'b@x.co']), ['b@x.co']))
{
  const byEmail = { 'a@acme.com': [s('richard', 80, '2026-11-21T00:00:00Z')], 'b@acme.com': [s('richard', 30, '2026-11-21T00:00:00Z')] }
  const ev = evaluateAssignment(A, byEmail, ['a@acme.com', 'b@acme.com', 'c@acme.com'], NOW)
  t(() => assert.deepEqual([ev.total, ev.done, ev.completionPct], [3, 1, 33]))
  t(() => assert.deepEqual(ev.reps.map((r) => [r.email, r.status]), [['a@acme.com', 'done'], ['b@acme.com', 'attempted'], ['c@acme.com', 'pending']]))
  // named assignee with no sessions at all still shows up (the point of naming people)
  const named = evaluateAssignment({ ...A, assignees: ['new@acme.com'] }, byEmail, ['a@acme.com'], NOW)
  t(() => assert.deepEqual(named.reps.map((r) => r.status), ['pending']))
  t(() => assert.equal(evaluateAssignment(A, {}, [], NOW).completionPct, null))
}

// ---- rep view ----
{
  const list = [
    { ...A, id: 'all', assignees: [] },
    { ...A, id: 'mine', assignees: ['me@acme.com'], dueDate: '2026-11-22' },
    { ...A, id: 'theirs', assignees: ['you@acme.com'] },
  ]
  const mine = assignmentsForRep(list, 'ME@acme.com', [], NOW)
  t(() => assert.deepEqual(mine.map((x) => x.id), ['mine', 'all']))   // sorted by due date, others' hidden
  t(() => assert.ok(!('assignees' in mine[0])))                         // never leaks who else was assigned
  t(() => assert.equal(isOpenStatus(mine[0].status), true))
  t(() => assert.equal(isOpenStatus('done'), false))
}

console.log(`assignments: ${n} assertions passed`)
