import { hasRelevantMutation } from './mutation-filter.ts'

export const WUHU_HEADLINE = '欢迎使用芜湖市公安交管警用智能体'
const HEADLINE_SELECTOR = "[data-phase='hero'] [class*='headlineText']"
const OWNERSHIP_ATTRIBUTE = 'data-wuhu-headline'

interface HeadlineOwnership {
  element: HTMLElement
  original: string
}

/** Replace only the mounted hero headline and restore the latest host copy. */
export function installWuhuHeadline(body: HTMLElement): () => void {
  let ownership: HeadlineOwnership | null = null

  const release = (): void => {
    if (ownership === null) return
    const { element, original } = ownership
    if (element.textContent === WUHU_HEADLINE) element.textContent = original
    if (element.getAttribute(OWNERSHIP_ATTRIBUTE) === '') element.removeAttribute(OWNERSHIP_ATTRIBUTE)
    ownership = null
  }

  const synchronize = (): void => {
    const found = body.querySelector<HTMLElement>(HEADLINE_SELECTOR)
    if (found !== ownership?.element) {
      release()
      if (found === null) return
      ownership = { element: found, original: found.textContent ?? '' }
    } else if (found !== null && found.textContent !== WUHU_HEADLINE) {
      ownership.original = found.textContent ?? ''
    }

    if (found !== null) {
      if (found.getAttribute(OWNERSHIP_ATTRIBUTE) !== '') found.setAttribute(OWNERSHIP_ATTRIBUTE, '')
      if (found.textContent !== WUHU_HEADLINE) found.textContent = WUHU_HEADLINE
    }
  }

  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) synchronize()
  })
  observer.observe(body, { attributes: true, childList: true, characterData: true, subtree: true })
  synchronize()

  return () => {
    observer.disconnect()
    release()
  }
}
