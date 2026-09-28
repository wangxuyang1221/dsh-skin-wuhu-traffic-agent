import { POLICE_EMBLEM } from './emblem.ts'
import { hasRelevantMutation } from './mutation-filter.ts'

const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"
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

function findBrandRow(pane: HTMLElement): HTMLElement | null {
  let node = pane.querySelector<HTMLElement>("[data-slot='sidebar.brand.name'], [data-slot='sidebar.brand.mark']")
  while (node !== null && node.parentElement !== pane) node = node.parentElement
  return node
    ?? pane.querySelector<HTMLElement>(":scope > [class*='logoRow']")
    ?? pane.querySelector<HTMLElement>(":scope > :first-child:not([data-wuhu-brand-stage])")
}

function findBrandContent(row: HTMLElement): HTMLElement | null {
  const name = row.querySelector<HTMLElement>("[data-slot='sidebar.brand.name']")
  if (name === null) return null // A collapsed rail's mark belongs to its toggle.
  const button = name.closest('button')
  if (button !== null && row.contains(button)) return button
  const mark = row.querySelector("[data-slot='sidebar.brand.mark']")
  let content = name
  while (mark !== null && !content.contains(mark) && content.parentElement !== row) {
    if (content.parentElement === null) break
    content = content.parentElement
  }
  return content
}

/** Mount responsive brand chrome into the real DSH sidebar. */
export function installWuhuBrand(body: HTMLElement, classes: WuhuBrandClasses): () => void {
  const originalWidth = body.style.getPropertyValue(WIDTH_PROPERTY)
  const originalWidthPriority = body.style.getPropertyPriority(WIDTH_PROPERTY)
  const originalWide = body.getAttribute(WIDE_ATTRIBUTE)
  const originalRows = new Map<HTMLElement, string | null>()
  const originalContents = new Map<HTMLElement, string | null>()
  const originalStaticRows = new Map<HTMLElement, string | null>()
  let ownedWidth: string | null = null
  let ownedWidthPriority = ''
  let ownedWide: string | null | undefined
  let currentStage: HTMLElement | null = null
  let observedPane: HTMLElement | null = null

  const synchronizeWidth = (pane: HTMLElement): void => {
    const measured = pane.getBoundingClientRect().width
    const frame = body.querySelector<HTMLElement>(APP_FRAME_SELECTOR)
    const firstTrack = frame?.style.gridTemplateColumns.trim().match(/^(-?(?:\d+|\d*\.\d+))px(?:\s|$)/)?.[1]
    const endpoint = firstTrack === undefined ? measured : Number.parseFloat(firstTrack)
    const width = Number.isFinite(endpoint) && endpoint >= 0 ? endpoint : measured
    if (!Number.isFinite(width) || width < 0) return
    const serialized = `${width}px`
    if (body.style.getPropertyValue(WIDTH_PROPERTY) !== serialized) body.style.setProperty(WIDTH_PROPERTY, serialized)
    ownedWidth = serialized
    ownedWidthPriority = body.style.getPropertyPriority(WIDTH_PROPERTY)
    body.toggleAttribute(WIDE_ATTRIBUTE, width > 96)
    ownedWide = body.getAttribute(WIDE_ATTRIBUTE)
  }

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => {
        if (observedPane !== null) synchronizeWidth(observedPane)
      })

  const mark = (element: HTMLElement | null, attribute: string, originals: Map<HTMLElement, string | null>): void => {
    // Keep only the current host node; detached React rows must not accumulate.
    for (const [previous, original] of originals) {
      if (previous === element) continue
      if (previous.getAttribute(attribute) === '') {
        if (original === null) previous.removeAttribute(attribute)
        else previous.setAttribute(attribute, original)
      }
      originals.delete(previous)
    }
    if (element !== null && !originals.has(element)) {
      originals.set(element, element.getAttribute(attribute))
      element.setAttribute(attribute, '')
    }
  }

  const synchronize = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    if (pane === null) return
    const row = findBrandRow(pane)
    if (row === null) return

    if (observedPane !== pane) {
      resizeObserver?.disconnect()
      observedPane = pane
      resizeObserver?.observe(pane)
    }
    synchronizeWidth(pane)

    currentStage ??= createBrandStage(classes)
    if (row.nextElementSibling !== currentStage) row.after(currentStage)
    mark(row, 'data-wuhu-brand-row', originalRows)
    const brandContent = findBrandContent(row)
    mark(brandContent, 'data-wuhu-brand-content', originalContents)
    mark(brandContent !== null && row.querySelector('button') === null ? row : null,
      'data-wuhu-brand-static-row', originalStaticRows)
  }

  const observer = new MutationObserver((records) => {
    if (hasRelevantMutation(records)) synchronize()
  })
  let disposed = false
  const dispose = (): void => {
    if (disposed) return
    disposed = true
    observer.disconnect()
    resizeObserver?.disconnect()
    currentStage?.remove()

    mark(null, 'data-wuhu-brand-row', originalRows)
    mark(null, 'data-wuhu-brand-content', originalContents)
    mark(null, 'data-wuhu-brand-static-row', originalStaticRows)

    if (ownedWidth !== null && body.style.getPropertyValue(WIDTH_PROPERTY) === ownedWidth
      && body.style.getPropertyPriority(WIDTH_PROPERTY) === ownedWidthPriority) {
      if (originalWidth === '') body.style.removeProperty(WIDTH_PROPERTY)
      else body.style.setProperty(WIDTH_PROPERTY, originalWidth, originalWidthPriority)
    }
    if (ownedWide !== undefined && body.getAttribute(WIDE_ATTRIBUTE) === ownedWide) {
      if (originalWide === null) body.removeAttribute(WIDE_ATTRIBUTE)
      else body.setAttribute(WIDE_ATTRIBUTE, originalWide)
    }
  }

  try {
    observer.observe(body, { childList: true, subtree: true })
    synchronize()
    return dispose
  } catch (error) {
    dispose()
    throw error
  }
}
