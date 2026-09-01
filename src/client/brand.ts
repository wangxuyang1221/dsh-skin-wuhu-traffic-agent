import { POLICE_EMBLEM } from './emblem.ts'
import { hasRelevantMutation } from './mutation-filter.ts'

const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"
const SIDEBAR_LOGO_ROW_SELECTOR = `${SIDEBAR_PANE_SELECTOR} > :first-child`
const APP_FRAME_SELECTOR = "[id='root'] > div[data-slot='root'] > div"
const WIDTH_PROPERTY = '--wuhu-sidebar-width'
const WIDE_ATTRIBUTE = 'data-wuhu-sidebar-wide'

export interface WuhuBrandClasses {
  stage: string
  identity: string
  title: string
  titleLine: string
  emblem: string
  verticalName: string
  signal: string
  signalDot: string
  signalLabel: string
  registry: string
  registryCode: string
}

function createText(tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = value
  return element
}

function createBrandStage(classes: WuhuBrandClasses): HTMLElement {
  const stage = document.createElement('section')
  stage.className = classes.stage
  stage.dataset.wuhuBrandStage = ''
  stage.dataset.skinChrome = 'brand-stage'
  stage.setAttribute('aria-label', '芜湖市公安交管警用智能体')

  const title = document.createElement('h1')
  title.className = classes.title
  title.append(
    createText('span', classes.titleLine, '芜湖市公安交管'),
    createText('span', classes.titleLine, '警用智能体'),
  )

  const emblem = document.createElement('img')
  emblem.className = classes.emblem
  emblem.src = POLICE_EMBLEM
  emblem.alt = ''
  emblem.setAttribute('aria-hidden', 'true')

  const identity = document.createElement('div')
  identity.className = classes.identity
  identity.dataset.wuhuBrandIdentity = ''
  identity.append(title, emblem)

  const verticalName = createText('span', classes.verticalName, '芜湖交管')
  verticalName.setAttribute('aria-hidden', 'true')

  const signal = document.createElement('div')
  signal.className = classes.signal
  signal.dataset.wuhuSignal = ''
  signal.setAttribute('aria-live', 'polite')
  const dot = document.createElement('span')
  dot.className = classes.signalDot
  dot.setAttribute('aria-hidden', 'true')
  const label = createText('span', classes.signalLabel, '系统待命')
  label.dataset.wuhuSignalLabel = ''
  signal.append(dot, label)

  const registry = document.createElement('div')
  registry.className = classes.registry
  registry.setAttribute('aria-hidden', 'true')
  registry.append(
    createText('span', '', 'POLICE INTELLIGENCE CONSOLE'),
    createText('span', classes.registryCode, '340200 · SECURE LOCAL UI'),
  )

  stage.append(identity, verticalName, signal, registry)
  return stage
}

function findBrandButton(row: HTMLElement): HTMLButtonElement | null {
  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>(':scope > button'))
  return buttons.find((button, index) => {
    const label = button.getAttribute('aria-label') ?? ''
    return index === 0 && (buttons.length > 1 || !/sidebar|侧边栏/i.test(label))
  }) ?? null
}

/** Mount responsive brand chrome into the real DSH sidebar. */
export function installWuhuBrand(body: HTMLElement, classes: WuhuBrandClasses): () => void {
  const originalWidth = body.style.getPropertyValue(WIDTH_PROPERTY)
  const originalWide = body.hasAttribute(WIDE_ATTRIBUTE)
  const originalRows = new Map<HTMLElement, string | null>()
  const originalButtons = new Map<HTMLElement, string | null>()
  let ownedWidth: string | null = null
  let ownedWide: boolean | null = null
  let currentStage: HTMLElement | null = null
  let observedPane: HTMLElement | null = null

  const synchronizeWidth = (pane: HTMLElement): void => {
    const measured = pane.getBoundingClientRect().width
    if (measured <= 0) return
    const frame = body.querySelector<HTMLElement>(APP_FRAME_SELECTOR)
    const firstTrack = frame?.style.gridTemplateColumns.trim().match(/^(-?(?:\d+|\d*\.\d+))px(?:\s|$)/)?.[1]
    const endpoint = firstTrack === undefined ? measured : Number.parseFloat(firstTrack)
    const width = Number.isFinite(endpoint) && endpoint > 0 ? endpoint : measured
    const serialized = `${width}px`
    if (body.style.getPropertyValue(WIDTH_PROPERTY) !== serialized) body.style.setProperty(WIDTH_PROPERTY, serialized)
    ownedWidth = serialized
    const wide = width > 96
    body.toggleAttribute(WIDE_ATTRIBUTE, wide)
    ownedWide = wide
  }

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => {
        if (observedPane !== null) synchronizeWidth(observedPane)
      })

  const mark = (element: HTMLElement, attribute: string, originals: Map<HTMLElement, string | null>): void => {
    if (!originals.has(element)) originals.set(element, element.getAttribute(attribute))
    if (element.getAttribute(attribute) !== '') element.setAttribute(attribute, '')
  }

  const synchronize = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    const row = body.querySelector<HTMLElement>(SIDEBAR_LOGO_ROW_SELECTOR)
    if (pane === null || row === null) return

    if (observedPane !== pane) {
      resizeObserver?.disconnect()
      observedPane = pane
      resizeObserver?.observe(pane)
    }
    synchronizeWidth(pane)

    if (currentStage?.parentElement !== pane) {
      currentStage?.remove()
      currentStage = pane.querySelector<HTMLElement>(':scope > [data-wuhu-brand-stage]')
      if (currentStage === null) {
        currentStage = createBrandStage(classes)
        pane.append(currentStage)
      }
    }

    mark(row, 'data-wuhu-brand-row', originalRows)
    const brandButton = findBrandButton(row)
    if (brandButton !== null) mark(brandButton, 'data-wuhu-brand-button', originalButtons)
  }

  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) synchronize()
  })
  observer.observe(body, { childList: true, subtree: true })
  synchronize()

  return () => {
    observer.disconnect()
    resizeObserver?.disconnect()
    body.querySelectorAll('[data-wuhu-brand-stage]').forEach(stage => stage.remove())
    currentStage?.remove()

    for (const [row, original] of originalRows) {
      if (row.getAttribute('data-wuhu-brand-row') !== '') continue
      if (original === null) row.removeAttribute('data-wuhu-brand-row')
      else row.setAttribute('data-wuhu-brand-row', original)
    }
    for (const [button, original] of originalButtons) {
      if (button.getAttribute('data-wuhu-brand-button') !== '') continue
      if (original === null) button.removeAttribute('data-wuhu-brand-button')
      else button.setAttribute('data-wuhu-brand-button', original)
    }

    if (ownedWidth !== null && body.style.getPropertyValue(WIDTH_PROPERTY) === ownedWidth) {
      if (originalWidth === '') body.style.removeProperty(WIDTH_PROPERTY)
      else body.style.setProperty(WIDTH_PROPERTY, originalWidth)
    }
    if (ownedWide !== null && body.hasAttribute(WIDE_ATTRIBUTE) === ownedWide) {
      body.toggleAttribute(WIDE_ATTRIBUTE, originalWide)
    }
  }
}
