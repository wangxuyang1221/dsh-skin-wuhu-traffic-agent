import { hasRelevantMutation } from './mutation-filter.ts'

const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog']"
const SETTINGS_OPEN_ATTRIBUTE = 'data-wuhu-settings-open'

/** Project the official DSH Settings dialog state onto the active skin scope. */
export function installWuhuSettingsOverlay(body: HTMLElement): () => void {
  const originalState = body.getAttribute(SETTINGS_OPEN_ATTRIBUTE)
  let ownedState = originalState

  const synchronize = (): void => {
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null)
    ownedState = body.getAttribute(SETTINGS_OPEN_ATTRIBUTE)
  }
  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) synchronize()
  })
  observer.observe(body, { childList: true, subtree: true })
  synchronize()

  return () => {
    observer.disconnect()
    if (body.getAttribute(SETTINGS_OPEN_ATTRIBUTE) !== ownedState) return
    if (originalState === null) body.removeAttribute(SETTINGS_OPEN_ATTRIBUTE)
    else body.setAttribute(SETTINGS_OPEN_ATTRIBUTE, originalState)
  }
}
