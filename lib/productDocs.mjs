// Pure rules for product documents (no database, no network) so they can be
// unit-tested. The API route calls these; see /api/product-docs.

export const PRODUCT_DOC_LIMITS = {
  maxDocs: 10,
  maxCharsPerDoc: 60000,
  maxCharsTotal: 200000,
  maxNameChars: 120,
  minChars: 20,
}

// Who may upload/delete: a manager of a company workspace, or the sole owner of
// their own personal (free-email) workspace. Everyone else may only list.
export function canManageProductDocs({ role, isPersonalWorkspace }) {
  return role === 'manager' || isPersonalWorkspace === true
}

// Returns { ok: true, name, text } or { ok: false, status, error }.
export function validateProductDocInput(rawName, rawText, limits = PRODUCT_DOC_LIMITS) {
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  // Strip NUL bytes; keep everything else the customer wrote as-is.
  const text = typeof rawText === 'string' ? rawText.replace(/\u0000/g, '').trim() : ''
  if (!name || name.length > limits.maxNameChars) {
    return { ok: false, status: 400, error: `Give the document a name (max ${limits.maxNameChars} characters).` }
  }
  if (text.length < limits.minChars) {
    return { ok: false, status: 400, error: 'The document looks empty.' }
  }
  if (text.length > limits.maxCharsPerDoc) {
    return { ok: false, status: 413, error: `Too long: max ${limits.maxCharsPerDoc.toLocaleString('en-US')} characters per document. Split it into parts.` }
  }
  return { ok: true, name, text }
}

// existing: [{ chars }] already stored in the workspace.
export function checkProductDocQuota(existing, newChars, limits = PRODUCT_DOC_LIMITS) {
  if (existing.length >= limits.maxDocs) {
    return { ok: false, status: 409, error: `Limit reached: ${limits.maxDocs} documents per workspace. Delete one first.` }
  }
  const total = existing.reduce((n, d) => n + (d.chars || 0), 0)
  if (total + newChars > limits.maxCharsTotal) {
    return { ok: false, status: 409, error: `Storage limit reached (${limits.maxCharsTotal.toLocaleString('en-US')} characters total). Delete a document first.` }
  }
  return { ok: true }
}
