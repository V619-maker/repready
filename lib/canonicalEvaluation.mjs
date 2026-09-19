import { createHash } from 'node:crypto'

export const SCORING_VERSION = 'boardroom-v1'
export const SCORING_MODEL_ID = 'gemini-2.5-flash'
export const EVALUATION_SOURCE_PRACTICE = 'practice'

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/**
 * Bind a future canonical evaluation to the exact transcript string that was
 * scored without persisting the practice transcript itself.
 *
 * Intentionally no trimming/whitespace normalization: changing the transcript
 * changes the digest.
 */
export function hashTranscript(transcript) {
  if (typeof transcript !== 'string') {
    throw new TypeError('transcript must be a string')
  }
  return sha256Hex(transcript)
}

/**
 * Fingerprint the scoring-relevant criteria snapshot.
 *
 * Criteria order is significant because the current scoring prompt preserves
 * array order. Only key/name/description are included because those are the
 * fields the current scoring path uses; unrelated metadata must not change the
 * scoring-methodology fingerprint.
 */
export function fingerprintCriteria(criteria) {
  if (!Array.isArray(criteria)) {
    throw new TypeError('criteria must be an array')
  }

  const scoringRelevantCriteria = criteria.map((criterion, index) => {
    if (!criterion || typeof criterion !== 'object' || Array.isArray(criterion)) {
      throw new TypeError(`criteria[${index}] must be an object`)
    }

    const { key, name, description } = criterion
    if (typeof key !== 'string' || typeof name !== 'string' || typeof description !== 'string') {
      throw new TypeError(`criteria[${index}] must contain string key, name, and description`)
    }

    return { key, name, description }
  })

  return sha256Hex(JSON.stringify(scoringRelevantCriteria))
}
