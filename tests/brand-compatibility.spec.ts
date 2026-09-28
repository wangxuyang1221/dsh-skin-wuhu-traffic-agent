// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installWuhuBrand, type WuhuBrandClasses } from '../src/client/brand.ts'

const classes = Object.fromEntries([
  'stage', 'identity', 'title', 'titleLine', 'emblem', 'verticalName',
  'signal', 'signalDot', 'signalLabel', 'registry', 'registryCode',
].map(name => [name, name])) as unknown as WuhuBrandClasses
let dispose: (() => void) | undefined
const skinCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/client/wuhu-traffic-agent.module.css'), 'utf8')

function renderMacSidebar(): HTMLElement {
  document.body.innerHTML = `
    <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px 1fr"></div></div></div>
    <div data-slot="sidebar"><div>
      <div class="host_topStrip" data-window-drag><button aria-label="收起侧边栏">toggle</button></div>
      <div class="host_logoRow" data-window-drag><span class="host_brand">
        <span class="host_brandIdentity"><span data-slot="sidebar.brand.mark"><svg></svg></span>
        <span data-slot="sidebar.brand.name">DSH HARNESS</span></span>
      </span></div>
      <button class="host_newSession">新会话</button>
      <nav class="host_panelList"><button>插件</button></nav>
      <div class="host_regionArea"><div role="tree">工作区</div></div>
    </div></div>`
  const pane = document.querySelector<HTMLElement>('[data-slot="sidebar"] > div')!
  pane.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
  return pane
}

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('data-dsh-wuhu-traffic-agent')
  document.body.removeAttribute('data-wuhu-sidebar-wide')
  document.body.style.removeProperty('--wuhu-sidebar-width')
  document.head.querySelector('[data-test-skin]')?.remove()
  vi.unstubAllGlobals()
})

describe('official macOS sidebar compatibility', () => {
  it('does not measure the sidebar for terminal or input-backdrop churn, or after disposal', async () => {
    const pane = renderMacSidebar()
    const terminal = document.createElement('div')
    terminal.className = 'xterm'
    const backdrop = document.createElement('div')
    backdrop.dataset.inputBackdrop = ''
    pane.append(terminal, backdrop)
    const measure = vi.spyOn(pane, 'getBoundingClientRect')
    dispose = installWuhuBrand(document.body, classes)
    await new Promise(resolve => setTimeout(resolve, 0))
    measure.mockClear()
    for (let n = 0; n < 100; n++) {
      terminal.append(document.createElement('span'))
      backdrop.append(document.createTextNode('stream'))
    }
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(measure).not.toHaveBeenCalled()
    expect(pane.querySelectorAll('[data-wuhu-brand-stage]')).toHaveLength(1)
    dispose()
    pane.append(document.createElement('div'))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(measure).not.toHaveBeenCalled()
    expect(pane.querySelector('[data-wuhu-brand-stage]')).toBeNull()
  })

  it('cleans only its own stage and preserves later owners of markers', () => {
    renderMacSidebar()
    const foreign = document.createElement('section')
    foreign.dataset.wuhuBrandStage = 'foreign'
    document.body.append(foreign)
    const row = document.querySelector('.host_logoRow')!
    row.setAttribute('data-wuhu-brand-row', 'previous')
    document.body.style.setProperty('--wuhu-sidebar-width', '333px', 'important')
    dispose = installWuhuBrand(document.body, classes)
    row.setAttribute('data-wuhu-brand-row', 'later-owner')
    document.body.setAttribute('data-wuhu-sidebar-wide', 'later-owner')
    dispose()

    expect(foreign.isConnected).toBe(true)
    expect(row.getAttribute('data-wuhu-brand-row')).toBe('later-owner')
    expect(document.body.getAttribute('data-wuhu-sidebar-wide')).toBe('later-owner')
    expect(document.body.style.getPropertyValue('--wuhu-sidebar-width')).toBe('333px')
    expect(document.body.style.getPropertyPriority('--wuhu-sidebar-width')).toBe('important')
    document.body.removeAttribute('data-wuhu-sidebar-wide')
    document.body.style.removeProperty('--wuhu-sidebar-width')
  })

  it('disconnects observers when initial host measurement throws', () => {
    const pane = renderMacSidebar()
    pane.getBoundingClientRect = () => { throw new Error('host measurement failed') }
    const disconnectMutation = vi.fn()
    const disconnectResize = vi.fn()
    vi.stubGlobal('MutationObserver', class { observe() {} disconnect = disconnectMutation })
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnectResize })

    expect(() => installWuhuBrand(document.body, classes)).toThrow('host measurement failed')
    expect(disconnectMutation).toHaveBeenCalledOnce()
    expect(disconnectResize).toHaveBeenCalled()
    expect(document.querySelector('[data-wuhu-brand-stage]')).toBeNull()
  })

  it('releases brand space at a zero-width Desktop track and keeps the native top strip through collapse and expand', async () => {
    const pane = renderMacSidebar()
    let resized = (): void => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resized = callback }
      observe() {}
      disconnect() {}
    })
    const frame = document.querySelector<HTMLElement>('[data-slot="root"] > div')!
    const row = pane.querySelector<HTMLElement>('.host_logoRow')!
    const brandMarkup = row.innerHTML
    dispose = installWuhuBrand(document.body, classes)
    const stage = pane.querySelector('[data-wuhu-brand-stage]')!

    frame.style.gridTemplateColumns = '0px 1fr'
    row.innerHTML = ''
    resized()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.body.hasAttribute('data-wuhu-sidebar-wide')).toBe(false)
    expect(document.body.style.getPropertyValue('--wuhu-sidebar-width')).toBe('0px')
    expect(pane.querySelector('.host_topStrip')!.hasAttribute('data-wuhu-brand-row')).toBe(false)
    expect(row.nextElementSibling).toBe(stage)
    expect(row.hasAttribute('data-wuhu-brand-static-row')).toBe(false)

    frame.style.gridTemplateColumns = '280px 1fr'
    row.innerHTML = brandMarkup
    resized()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.body.hasAttribute('data-wuhu-sidebar-wide')).toBe(true)
    expect(pane.querySelectorAll('[data-wuhu-brand-stage]')).toHaveLength(1)
    expect(row.nextElementSibling).toBe(stage)
  })

  it('releases replaced host nodes and follows the new row without duplicating the stage', async () => {
    const pane = renderMacSidebar()
    const oldRow = pane.querySelector<HTMLElement>('.host_logoRow')!
    const originalRow = oldRow.outerHTML
    dispose = installWuhuBrand(document.body, classes)
    const stage = pane.querySelector('[data-wuhu-brand-stage]')!
    const nextRow = oldRow.cloneNode(true) as HTMLElement
    nextRow.removeAttribute('data-wuhu-brand-row')
    nextRow.removeAttribute('data-wuhu-brand-static-row')
    nextRow.querySelector('[data-wuhu-brand-content]')!.removeAttribute('data-wuhu-brand-content')
    oldRow.remove()
    pane.append(nextRow)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(oldRow.outerHTML).toBe(originalRow)
    expect(nextRow.nextElementSibling).toBe(stage)
    expect(pane.querySelectorAll('[data-wuhu-brand-stage]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-wuhu-brand-content]')).toHaveLength(1)
  })

  it('reserves brand space in flow before navigation, without old margin compensation or hiding new-session controls', () => {
    const pane = renderMacSidebar()
    document.body.setAttribute('data-dsh-wuhu-traffic-agent', '')
    const style = document.createElement('style')
    style.dataset.testSkin = ''
    style.textContent = `.host_regionArea { margin-top: 0px }\n${skinCss}`
    document.head.append(style)
    dispose = installWuhuBrand(document.body, classes)

    const row = pane.querySelector('.host_logoRow')!
    const stage = pane.querySelector<HTMLElement>('[data-wuhu-brand-stage]')!
    expect(row.nextElementSibling).toBe(stage)
    expect(stage.nextElementSibling).toBe(pane.querySelector('.host_newSession'))
    expect(getComputedStyle(row).display).toBe('none')
    expect(getComputedStyle(stage).position).toBe('relative')
    expect(getComputedStyle(stage).flexShrink).toBe('0')
    expect(getComputedStyle(pane.querySelector('.host_regionArea')!).marginTop).toBe('0px')
    expect(getComputedStyle(pane.querySelector('.host_newSession')!).color).not.toBe('rgba(0, 0, 0, 0)')
  })

  it('targets the slot brand, not the native top strip, including a non-button brand', () => {
    renderMacSidebar()
    const strip = document.querySelector('.host_topStrip')!
    const originalStrip = strip.outerHTML
    dispose = installWuhuBrand(document.body, classes)

    expect(document.querySelector('[data-wuhu-brand-row]')).toBe(document.querySelector('.host_logoRow'))
    const content = document.querySelector('[data-wuhu-brand-content]')!
    expect(content).not.toBeNull()
    expect(content.contains(document.querySelector('[data-slot="sidebar.brand.name"]'))).toBe(true)
    expect(content.contains(document.querySelector('[data-slot="sidebar.brand.mark"]'))).toBe(true)
    expect(content.contains(strip)).toBe(false)
    expect(strip.outerHTML).toBe(originalStrip)

    dispose()
    expect(document.querySelector('[data-wuhu-brand-content]')).toBeNull()
    expect(document.querySelector('[data-wuhu-brand-row]')).toBeNull()
  })
})
