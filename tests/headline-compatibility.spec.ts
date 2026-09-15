// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installWuhuHeadline, WUHU_HEADLINE } from '../src/client/headline.ts'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.innerHTML = ''
})

// Structure verified in the published ui-conversation 0.1.5-rc.1 HeroShell.
const modernHero = `<div data-phase="hero">
  <span class="fixture_titleGroup"><span>探索未至之境</span><span class="fixture_previewBadge">预览版</span></span>
</div>`

const flushMutations = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

describe('host headline compatibility', () => {
  it.each([
    '<span>探索未至之境</span>',
    '<span class="fixture_titleGroup"><span>未知布局</span></span>',
    '<span class="fixture_titleGroup"><span><strong>未知布局</strong></span><span class="fixture_previewBadge">预览版</span></span>',
    '<span class="fixture_titleGroup"><span class="fixture_previewBadge">预览版</span><span>倒序布局</span></span>',
    '<span class="fixture_titleGroup"><span>额外节点</span><span class="fixture_previewBadge">预览版</span><button>操作</button></span>',
  ])('leaves unrecognized hero markup untouched: %s', markup => {
    document.body.innerHTML = `<div data-phase="hero">${markup}</div>`
    const original = document.body.innerHTML
    dispose = installWuhuHeadline(document.body)
    expect(document.body.innerHTML).toBe(original)
  })

  it('ignores other views and prefers the legacy target if both known structures exist', () => {
    document.body.innerHTML = `<div data-phase="active"><span class="fixture_headlineText">会话标题</span></div>
      ${modernHero}<div data-phase="hero"><span class="fixture_headlineText">旧版标题</span></div>`
    dispose = installWuhuHeadline(document.body)
    expect(document.querySelector('[data-phase="active"]')?.textContent).toBe('会话标题')
    expect(document.querySelector('.fixture_titleGroup')?.firstElementChild?.textContent).toBe('探索未至之境')
    expect(document.querySelector('[data-wuhu-headline]')?.textContent).toBe(WUHU_HEADLINE)
    expect(document.querySelectorAll('[data-wuhu-headline]')).toHaveLength(1)
  })

  it('handles a late modern hero, host text updates, replacement, and disposal', async () => {
    dispose = installWuhuHeadline(document.body)
    document.body.innerHTML = modernHero
    await flushMutations()
    const firstTitle = document.querySelector('[data-wuhu-headline]')!
    expect(firstTitle.textContent).toBe(WUHU_HEADLINE)

    firstTitle.textContent = 'Into the Unknown'
    await flushMutations()
    expect(firstTitle.textContent).toBe(WUHU_HEADLINE)

    const replacement = document.createElement('span')
    replacement.textContent = '宿主的新欢迎语'
    firstTitle.replaceWith(replacement)
    await flushMutations()
    expect(firstTitle.textContent).toBe('Into the Unknown')
    expect(firstTitle.hasAttribute('data-wuhu-headline')).toBe(false)
    expect(replacement.textContent).toBe(WUHU_HEADLINE)

    dispose()
    dispose = undefined
    expect(replacement.textContent).toBe('宿主的新欢迎语')
    expect(replacement.hasAttribute('data-wuhu-headline')).toBe(false)
    replacement.textContent = '停用后的宿主文案'
    await flushMutations()
    expect(replacement.textContent).toBe('停用后的宿主文案')
  })

  it('replaces only the modern title leaf and preserves the preview node and its handlers', () => {
    document.body.innerHTML = modernHero
    const group = document.querySelector('.fixture_titleGroup')!
    const title = group.firstElementChild!
    const badge = group.lastElementChild as HTMLElement
    let clicks = 0
    badge.addEventListener('click', () => { clicks++ })

    dispose = installWuhuHeadline(document.body)

    expect(title.textContent).toBe(WUHU_HEADLINE)
    expect(title.hasAttribute('data-wuhu-headline')).toBe(true)
    expect(group.children).toHaveLength(2)
    expect(group.lastElementChild).toBe(badge)
    expect(badge.textContent).toBe('预览版')
    badge.click()
    expect(clicks).toBe(1)

    dispose()
    expect(title.textContent).toBe('探索未至之境')
    expect(title.hasAttribute('data-wuhu-headline')).toBe(false)
    expect(group.lastElementChild).toBe(badge)
  })
})
