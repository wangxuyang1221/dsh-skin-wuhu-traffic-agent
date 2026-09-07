import { POLICE_EMBLEM } from './emblem.ts'
import { hasRelevantMutation } from './mutation-filter.ts'

const SLOT_SELECTOR = '[data-slot="sidebar.brand.mark"], [data-slot="conversation.hero.brand.mark"]'
const OWNERSHIP_ATTRIBUTE = 'data-wuhu-brand-mark-slot'

interface MarkOwnership {
  originalAttribute: string | null
  image: HTMLImageElement
}

/** Keep host-owned icons mounted so their rendering and event handlers survive skin disposal. */
export function installWuhuBrandMarks(body: HTMLElement): () => void {
  const ownership = new Map<HTMLElement, MarkOwnership>()

  const release = (slot: HTMLElement, state: MarkOwnership): void => {
    state.image.remove()
    if (slot.getAttribute(OWNERSHIP_ATTRIBUTE) === '') {
      if (state.originalAttribute === null) slot.removeAttribute(OWNERSHIP_ATTRIBUTE)
      else slot.setAttribute(OWNERSHIP_ATTRIBUTE, state.originalAttribute)
    }
    ownership.delete(slot)
  }

  const synchronize = (): void => {
    for (const [slot, state] of ownership) {
      if (!body.contains(slot) || !slot.matches(SLOT_SELECTOR)) release(slot, state)
    }
    for (const slot of body.querySelectorAll<HTMLElement>(SLOT_SELECTOR)) {
      let state = ownership.get(slot)
      if (state === undefined) {
        const image = document.createElement('img')
        image.dataset.wuhuBrandMark = ''
        image.src = POLICE_EMBLEM
        image.alt = ''
        image.setAttribute('aria-hidden', 'true')
        image.width = image.height = slot.dataset.slot === 'sidebar.brand.mark' ? 24 : 34
        state = { originalAttribute: slot.getAttribute(OWNERSHIP_ATTRIBUTE), image }
        ownership.set(slot, state)
        slot.setAttribute(OWNERSHIP_ATTRIBUTE, '')
      }
      if (state.image.parentElement !== slot) slot.append(state.image)
    }
  }

  const observer = new MutationObserver(records => {
    if (hasRelevantMutation(records)) synchronize()
  })
  const dispose = (): void => {
    observer.disconnect()
    for (const [slot, state] of ownership) release(slot, state)
  }

  try {
    observer.observe(body, { childList: true, subtree: true })
    synchronize()
  } catch (error) {
    dispose()
    throw error
  }

  return dispose
}
