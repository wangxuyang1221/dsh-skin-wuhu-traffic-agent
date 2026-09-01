const HIGH_CHURN_SELECTOR = '.xterm, [data-input-backdrop]'

function belongsToHighChurnSubtree(node: Node): boolean {
  if (node instanceof Element) {
    return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null
  }
  return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null
}

function isHighChurnOnly(record: MutationRecord): boolean {
  if (belongsToHighChurnSubtree(record.target)) return true
  if (record.type !== 'childList') return false
  const changed = [...record.addedNodes, ...record.removedNodes]
  return changed.length > 0 && changed.every(belongsToHighChurnSubtree)
}

/** Ignore terminal and draft-backdrop churn that cannot change skin chrome. */
export function hasRelevantMutation(records: MutationRecord[]): boolean {
  return records.some(record => !isHighChurnOnly(record))
}
