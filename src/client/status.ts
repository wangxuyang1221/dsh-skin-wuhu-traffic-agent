import { hasRelevantMutation } from './mutation-filter.ts'

export type WuhuStatus =
  | 'standby'
  | 'syncing'
  | 'working'
  | 'approval'
  | 'input'
  | 'review'
  | 'complete'
  | 'fault'
  | 'offline'
  | 'ready'

export const WUHU_STATUS_LABELS: Record<WuhuStatus, string> = {
  standby: '系统待命',
  syncing: '状态同步',
  working: '任务执行',
  approval: '等待授权',
  input: '等待输入',
  review: '方案审阅',
  complete: '任务完成',
  fault: '系统异常',
  offline: '连接离线',
  ready: '会话就绪',
}

const SIGNAL_SELECTOR = '[data-wuhu-signal]'
const SIGNAL_LABEL_SELECTOR = '[data-wuhu-signal-label]'
const BODY_STATUS_ATTRIBUTE = 'data-wuhu-status'
const SIGNAL_STATUS_ATTRIBUTE = 'data-wuhu-signal-status'

function conversationRoot(body: HTMLElement): HTMLElement | null {
  for (const candidate of body.querySelectorAll<HTMLElement>('[data-phase]')) {
    if (candidate.querySelector(':scope > [data-conversation-scroll]') !== null) return candidate
  }
  return null
}

function flowRows(flow: HTMLElement): HTMLElement[] {
  return Array.from(flow.children).filter((child): child is HTMLElement => (
    child instanceof HTMLElement && child.dataset.chatFlowKind !== undefined
  ))
}

export function resolveWuhuStatus(root: HTMLElement | null): WuhuStatus {
  if (root === null) return 'standby'
  const phase = root.dataset.phase ?? ''
  if (phase === 'hero') return 'standby'
  if (phase === 'settling') return 'syncing'
  if (phase !== 'active') return 'ready'

  if (root.querySelector('[data-approval-key]') !== null) return 'approval'
  if (root.querySelector('[data-plan-review-key]') !== null) return 'review'
  if (root.querySelector('[data-question-key]') !== null) return 'input'

  const input = root.querySelector<HTMLTextAreaElement>('textarea[data-phase]')
  if (input?.dataset.phase === 'submitting' || input?.dataset.phase === 'adjudicating') return 'syncing'
  if (
    root.querySelector("[data-state='running']") !== null
    || root.querySelector("button[aria-label*='停止'], button[aria-label*='stop' i]") !== null
  ) return 'working'
  if (input?.disabled === true) return 'offline'

  const flow = root.querySelector<HTMLElement>('[data-chat-flow]')
  if (flow === null) return 'ready'
  const rows = flowRows(flow)
  const tail = rows.at(-1) ?? null
  const meaningful = rows.filter(row => row.dataset.chatFlowKind !== 'turn-tail').at(-1) ?? null
  if (meaningful?.querySelector("[data-state='error'], [data-state='interrupted']") !== null) return 'fault'
  if (tail?.dataset.chatFlowKind === 'turn-tail') return 'complete'
  return 'ready'
}

/** Project the visible conversation state into the sidebar's presentation chip. */
export function installWuhuStatus(body: HTMLElement): () => void {
  const originalBodyStatus = body.getAttribute(BODY_STATUS_ATTRIBUTE)
  let ownedStatus: WuhuStatus | null = null

  const synchronize = (): void => {
    const status = resolveWuhuStatus(conversationRoot(body))
    ownedStatus = status
    if (body.getAttribute(BODY_STATUS_ATTRIBUTE) !== status) body.setAttribute(BODY_STATUS_ATTRIBUTE, status)
    const signal = body.querySelector<HTMLElement>(SIGNAL_SELECTOR)
    if (signal === null) return
    signal.setAttribute(SIGNAL_STATUS_ATTRIBUTE, status)
    const label = signal.querySelector<HTMLElement>(SIGNAL_LABEL_SELECTOR)
    if (label !== null && label.textContent !== WUHU_STATUS_LABELS[status]) {
      label.textContent = WUHU_STATUS_LABELS[status]
    }
  }

  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) synchronize()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-label', 'data-phase', 'data-state', 'disabled'],
  })
  synchronize()

  return () => {
    observer.disconnect()
    if (ownedStatus !== null && body.getAttribute(BODY_STATUS_ATTRIBUTE) === ownedStatus) {
      if (originalBodyStatus === null) body.removeAttribute(BODY_STATUS_ATTRIBUTE)
      else body.setAttribute(BODY_STATUS_ATTRIBUTE, originalBodyStatus)
    }
    const signal = body.querySelector<HTMLElement>(SIGNAL_SELECTOR)
    signal?.removeAttribute(SIGNAL_STATUS_ATTRIBUTE)
  }
}
