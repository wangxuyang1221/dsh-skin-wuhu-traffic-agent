// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'
import { WUHU_HEADLINE } from '../src/client/headline.ts'
import { POLICE_EMBLEM } from '../src/client/emblem.ts'

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const mounted = new Context().plugin({ apply })
  await mounted.await()
  return mounted
}

function renderShell(): HTMLElement {
  document.body.innerHTML = `
    <div id="root"><div data-slot="root"><div style="grid-template-columns: 320px minmax(0px, 1fr) 0px"></div></div></div>
    <div data-slot="sidebar">
      <div>
        <div>
          <button type="button"><span data-slot="sidebar.brand.mark"><svg></svg></span><span data-slot="sidebar.brand.name">DSH</span></button>
          <button type="button" aria-label="收起侧边栏"></button>
        </div>
        <button type="button">新会话</button>
        <button type="button" data-dsh-part="sidebar-entry">任务看板</button>
        <button type="button" data-dsh-part="sidebar-entry">SSH</button>
        <div class="fixture_regionArea"><div role="tree"><div role="treeitem" aria-selected="true">会话</div></div></div>
      </div>
    </div>
    <div data-phase="hero">
      <div data-conversation-scroll>
        <span data-slot="conversation.hero.brand.mark" style="display: contents"><svg width="34" height="34"></svg></span>
        <h2 class="fixture_headlineText">原始欢迎语</h2>
        <div data-composer-card><textarea data-phase="plain"></textarea></div>
      </div>
    </div>
  `
  const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
  pane.getBoundingClientRect = () => ({ width: 320 } as DOMRect)
  return pane
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.head.querySelectorAll('[data-wuhu-favicon]').forEach(element => element.remove())
  document.title = ''
  vi.unstubAllGlobals()
})

describe('Wuhu traffic-agent skin', () => {
  it('mounts real sidebar branding without creating external plugin features', async () => {
    const pane = renderShell()
    const taskBoard = Array.from(document.querySelectorAll('[data-dsh-part="sidebar-entry"]'))[0]
    document.title = 'original'

    fiber = await mount()

    expect(document.body.hasAttribute('data-dsh-wuhu-traffic-agent')).toBe(true)
    expect(document.body.hasAttribute('data-wuhu-sidebar-wide')).toBe(true)
    expect(document.body.style.getPropertyValue('--wuhu-sidebar-width')).toBe('320px')
    expect(document.title).toBe('芜湖交管警用智能体 · DSH')
    expect(document.querySelector('[data-wuhu-brand-stage]')?.parentElement).toBe(pane)
    expect(document.querySelector('[data-wuhu-brand-stage]')?.textContent).toContain('芜湖市公安交管')
    expect(document.querySelector('[data-wuhu-brand-identity] > h1')).not.toBeNull()
    expect(document.querySelector('[data-wuhu-brand-identity] > img')).not.toBeNull()
    expect(document.querySelector('[data-wuhu-signal-label]')?.textContent).toBe('系统待命')
    expect(document.querySelector('[data-wuhu-headline]')?.textContent).toBe(WUHU_HEADLINE)

    const entries = Array.from(document.querySelectorAll('[data-dsh-part="sidebar-entry"]'))
    expect(entries).toHaveLength(2)
    expect(entries[0]).toBe(taskBoard)
    expect(document.querySelector('[data-wuhu-brand-stage]')?.textContent).not.toContain('任务看板')
    expect(document.querySelector('[data-wuhu-brand-stage]')?.textContent).not.toContain('SSH')

    await fiber.dispose()
    fiber = undefined
    expect(document.body.hasAttribute('data-dsh-wuhu-traffic-agent')).toBe(false)
    expect(document.body.hasAttribute('data-wuhu-sidebar-wide')).toBe(false)
    expect(document.body.style.getPropertyValue('--wuhu-sidebar-width')).toBe('')
    expect(document.querySelector('[data-wuhu-brand-stage]')).toBeNull()
    expect(document.querySelector('[data-skin-chrome]')).toBeNull()
    expect(document.querySelector('[data-wuhu-headline]')).toBeNull()
    expect(document.querySelector('.fixture_headlineText')?.textContent).toBe('原始欢迎语')
    expect(document.title).toBe('original')
    expect(entries[0]).toBe(taskBoard)
  })

  it('replaces both whale marks with the existing police emblem without replacing host nodes or handlers', async () => {
    renderShell()
    const slots = Array.from(document.querySelectorAll<HTMLElement>(
      '[data-slot="sidebar.brand.mark"], [data-slot="conversation.hero.brand.mark"]',
    ))
    const originalMarkup = slots.map(slot => slot.outerHTML)
    const originalIcons = slots.map(slot => slot.querySelector('svg'))
    const button = slots[0]!.closest('button')!
    const onClick = vi.fn()
    button.addEventListener('click', onClick)

    fiber = await mount()

    for (const [index, slot] of slots.entries()) {
      const emblem = slot.querySelector<HTMLImageElement>('img[data-wuhu-brand-mark]')
      expect(emblem, slot.dataset.slot).not.toBeNull()
      expect(emblem!.src).toBe(POLICE_EMBLEM)
      expect(emblem!.width).toBe(index === 0 ? 24 : 34)
      expect(emblem!.height).toBe(emblem!.width)
      expect(emblem!.alt).toBe('')
      expect(emblem!.getAttribute('aria-hidden')).toBe('true')
      expect(slot.hasAttribute('data-wuhu-brand-mark-slot')).toBe(true)
      expect(slot.querySelector('svg')).toBe(originalIcons[index])
    }
    slots[0]!.querySelector<HTMLImageElement>('img')!.click()
    expect(onClick).toHaveBeenCalledOnce()

    await fiber.dispose()
    fiber = undefined
    expect(slots.map(slot => slot.outerHTML)).toEqual(originalMarkup)
    button.click()
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('keeps both emblems after sidebar collapse, hero remount, and host icon rerenders', async () => {
    const pane = renderShell()
    fiber = await mount()
    const oldSidebarSlot = pane.querySelector('[data-slot="sidebar.brand.mark"]')!
    pane.firstElementChild!.innerHTML = `
      <button type="button" aria-label="展开侧边栏">
        <span class="fixture_railMark"><span data-slot="sidebar.brand.mark" style="display: contents"><svg></svg></span></span>
        <svg class="fixture_panelIcon"></svg>
      </button>
    `
    const oldHeroSlot = document.querySelector('[data-slot="conversation.hero.brand.mark"]')!
    oldHeroSlot.remove()
    await new Promise(resolve => setTimeout(resolve, 0))

    const sidebarSlot = pane.querySelector('[data-slot="sidebar.brand.mark"]')!
    expect(sidebarSlot.querySelector('img[data-wuhu-brand-mark]')).not.toBeNull()
    expect(oldSidebarSlot.querySelector('img')).toBeNull()
    expect(oldSidebarSlot.hasAttribute('data-wuhu-brand-mark-slot')).toBe(false)
    expect(oldHeroSlot.querySelector('img')).toBeNull()
    expect(pane.querySelector('.fixture_panelIcon')).not.toBeNull()

    const heroSlot = document.createElement('span')
    heroSlot.dataset.slot = 'conversation.hero.brand.mark'
    heroSlot.innerHTML = '<svg></svg>'
    document.querySelector('[data-conversation-scroll]')!.prepend(heroSlot)
    sidebarSlot.innerHTML = '<svg data-host-update></svg>'
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(heroSlot.querySelectorAll('img[data-wuhu-brand-mark]')).toHaveLength(1)
    expect(sidebarSlot.querySelectorAll('img[data-wuhu-brand-mark]')).toHaveLength(1)
    expect(sidebarSlot.querySelector('[data-host-update]')).not.toBeNull()

    await fiber.dispose()
    fiber = undefined
    expect(document.querySelector('[data-wuhu-brand-mark]')).toBeNull()
    expect(document.querySelector('[data-wuhu-brand-mark-slot]')).toBeNull()
    expect(sidebarSlot.querySelector('[data-host-update]')).not.toBeNull()
    heroSlot.append(document.createElement('svg'))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.querySelector('[data-wuhu-brand-mark]')).toBeNull()
  })

  it('restores prior mark attributes without overwriting a later owner', async () => {
    renderShell()
    const sidebarSlot = document.querySelector('[data-slot="sidebar.brand.mark"]')!
    const heroSlot = document.querySelector('[data-slot="conversation.hero.brand.mark"]')!
    sidebarSlot.setAttribute('data-wuhu-brand-mark-slot', 'previous')
    fiber = await mount()
    heroSlot.setAttribute('data-wuhu-brand-mark-slot', 'later-owner')

    await fiber.dispose()
    fiber = undefined
    expect(sidebarSlot.getAttribute('data-wuhu-brand-mark-slot')).toBe('previous')
    expect(heroSlot.getAttribute('data-wuhu-brand-mark-slot')).toBe('later-owner')
    expect(document.querySelector('[data-wuhu-brand-mark]')).toBeNull()
  })

  it('tracks Settings only while the skin activation owns the page', async () => {
    const pane = renderShell()
    const settings = document.createElement('div')
    settings.dataset.slot = 'sidebar.settings'
    pane.append(settings)
    fiber = await mount()

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    settings.append(dialog)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.body.hasAttribute('data-wuhu-settings-open')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(document.body.hasAttribute('data-wuhu-settings-open')).toBe(false)
  })

  it('reconciles a sidebar replaced by the host and cleans the replacement', async () => {
    renderShell()
    fiber = await mount()
    const sidebar = document.querySelector<HTMLElement>("[data-slot='sidebar']")!
    sidebar.innerHTML = `
      <div>
        <div><button type="button"><svg></svg></button><button type="button" aria-label="侧边栏"></button></div>
        <div class="next_regionArea"></div>
      </div>
    `
    const replacement = sidebar.firstElementChild as HTMLElement
    replacement.getBoundingClientRect = () => ({ width: 288 } as DOMRect)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(replacement.querySelector(':scope > [data-wuhu-brand-stage]')).not.toBeNull()
    expect(document.body.style.getPropertyValue('--wuhu-sidebar-width')).toBe('320px')

    await fiber.dispose()
    fiber = undefined
    expect(replacement.querySelector('[data-wuhu-brand-stage]')).toBeNull()
    expect(replacement.querySelector('[data-wuhu-brand-row]')).toBeNull()
  })
})
