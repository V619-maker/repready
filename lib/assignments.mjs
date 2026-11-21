// Assigned practice: a manager sets "practice <buyer> (optionally focusing a skill) by <date>"
// for named reps or everyone in the org, and sees who has done it. Pure rules; the routes
// do the database work. Completion is DERIVED from the existing sessions collection (a
// session by the rep, against that buyer, saved after the assignment was created, scoring
// at least minScore), so nothing in the scoring or session-save path changes.

export const ASSIGNMENT_PERSONAS = ['richard', 'sandra', 'priya', 'rakesh']
export const ASSIGNMENT_LIMITS = { title: 120, note: 500, focus: 60, maxAssignees: 500, maxOpenPerOrg: 50 }
// A due date means the end of that calendar day in India (UTC+05:30), the product's home market.
const IST_OFFSET_MS = 5.5 * 3600 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function dueDateEndMs(dueDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dueDate || ''))
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const probe = new Date(Date.UTC(y, mo - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null
  return Date.UTC(y, mo - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS
}

const clean = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

export function validateAssignmentInput(input, { orgDomain, now = Date.now() } = {}) {
  const title = clean(input?.title, ASSIGNMENT_LIMITS.title)
  if (!title) return { ok: false, error: 'Give the assignment a title.' }
  if (!ASSIGNMENT_PERSONAS.includes(input?.persona)) return { ok: false, error: 'Choose one of the buyers.' }
  const focus = clean(input?.focus, ASSIGNMENT_LIMITS.focus) || null
  const note = clean(input?.note, ASSIGNMENT_LIMITS.note) || null

  let dueDate = null
  if (input?.dueDate !== undefined && input?.dueDate !== null && input?.dueDate !== '') {
    const end = dueDateEndMs(input.dueDate)
    if (end === null) return { ok: false, error: 'Due date must look like 2026-12-31.' }
    if (end < now) return { ok: false, error: 'The due date has already passed.' }
    if (end > now + 366 * 86400000) return { ok: false, error: 'The due date is more than a year away.' }
    dueDate = String(input.dueDate)
  }

  let minScore = null
  if (input?.minScore !== undefined && input?.minScore !== null && input?.minScore !== '') {
    const n = Number(input.minScore)
    if (!Number.isFinite(n) || n < 1 || n > 100) return { ok: false, error: 'Minimum score must be between 1 and 100.' }
    minScore = Math.round(n)
  }

  const raw = Array.isArray(input?.assignees)
    ? input.assignees
    : String(input?.assignees || '').split(/[\s,;]+/)
  const assignees = []
  for (const r of raw) {
    const e = String(r || '').trim().toLowerCase()
    if (!e) continue
    if (!EMAIL_RE.test(e)) return { ok: false, error: `"${clean(e, 60)}" is not a valid email address.` }
    if (orgDomain && e.split('@')[1] !== orgDomain) return { ok: false, error: `${e} is not at ${orgDomain}. Assignments only reach people at your own company email domain.` }
    if (!assignees.includes(e)) assignees.push(e)
  }
  if (assignees.length > ASSIGNMENT_LIMITS.maxAssignees) return { ok: false, error: `At most ${ASSIGNMENT_LIMITS.maxAssignees} people per assignment.` }

  return { ok: true, value: { title, persona: input.persona, focus, note, dueDate, minScore, assignees } }
}

// Status of one rep against one assignment.
export function repStatus(assignment, repSessions, now = Date.now()) {
  const created = Date.parse(assignment.createdAt)
  const dueEnd = assignment.dueDate ? dueDateEndMs(assignment.dueDate) : null
  const mine = (repSessions || []).filter((s) => s.persona === assignment.persona && Date.parse(s.createdAt) >= created)
  const attempts = mine.length
  const best = attempts ? Math.max(...mine.map((s) => Number(s.finalScore) || 0)) : null
  const need = assignment.minScore ?? 0
  const passing = mine.filter((s) => (Number(s.finalScore) || 0) >= need)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  if (passing.length) {
    const at = passing[0].createdAt
    const late = dueEnd !== null && Date.parse(at) > dueEnd
    return { status: late ? 'done_late' : 'done', attempts, bestScore: best, completedAt: at }
  }
  if (attempts) return { status: dueEnd !== null && now > dueEnd ? 'overdue' : 'attempted', attempts, bestScore: best, completedAt: null }
  return { status: dueEnd !== null && now > dueEnd ? 'overdue' : 'pending', attempts: 0, bestScore: null, completedAt: null }
}

// Everyone an assignment applies to: the named reps, or all known reps in the org.
export function targetsOf(assignment, knownRepEmails) {
  return assignment.assignees?.length ? assignment.assignees : [...new Set((knownRepEmails || []).map((e) => String(e).toLowerCase()))]
}

export function evaluateAssignment(assignment, sessionsByEmail, knownRepEmails, now = Date.now()) {
  const reps = targetsOf(assignment, knownRepEmails).sort().map((email) => ({ email, ...repStatus(assignment, sessionsByEmail[email] || [], now) }))
  const done = reps.filter((r) => r.status === 'done' || r.status === 'done_late').length
  return {
    reps,
    total: reps.length,
    done,
    overdue: reps.filter((r) => r.status === 'overdue').length,
    completionPct: reps.length ? Math.round((done / reps.length) * 100) : null,
  }
}

// What a rep sees: assignments that apply to them, with their own status only.
export function assignmentsForRep(assignments, repEmail, repSessions, now = Date.now()) {
  const email = String(repEmail || '').toLowerCase()
  return (assignments || [])
    .filter((a) => !a.assignees?.length || a.assignees.includes(email))
    .map((a) => ({
      id: a.id, title: a.title, persona: a.persona, focus: a.focus, note: a.note, dueDate: a.dueDate, minScore: a.minScore,
      ...repStatus(a, repSessions, now),
    }))
    .sort((x, y) => (x.dueDate || '9999').localeCompare(y.dueDate || '9999'))
}

export const isOpenStatus = (s) => s === 'pending' || s === 'attempted' || s === 'overdue'
