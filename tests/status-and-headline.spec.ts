// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installWuhuHeadline, WUHU_HEADLINE } from '../src/client/headline.ts'
import { installWuhuStatus, WUHU_STATUS_LABELS } from '../src/client/status.ts'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Wuhu presentation projections', () => {
  it('tracks only the visible conversation status', async () => {
    document.body.innerHTML = `
      <div data-wuhu-signal><span data-wuhu-signal-label></span></div>
      <div data-phase="hero"><div data-conversation-scroll><textarea data-phase="plain"></textarea></div></div>
      <div data-state="running">background session marker</div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const scroll = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const dispose = installWuhuStatus(document.body)

    expect(document.body.dataset.wuhuStatus).toBe('standby')
    expect(document.querySelector('[data-wuhu-signal-label]')?.textContent).toBe(WUHU_STATUS_LABELS.standby)

    root.dataset.phase = 'active'
    scroll.prepend(Object.assign(document.createElement('div'), { innerHTML: '<span data-state="running"></span>' }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.body.dataset.wuhuStatus).toBe('working')
    expect(document.querySelector('[data-wuhu-signal-label]')?.textContent).toBe(WUHU_STATUS_LABELS.working)

    scroll.querySelector('[data-state="running"]')?.parentElement?.remove()
    scroll.prepend(Object.assign(document.createElement('div'), { innerHTML: '<div data-approval-key="one"></div>' }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.body.dataset.wuhuStatus).toBe('approval')
    expect(document.querySelector('[data-wuhu-signal-label]')?.textContent).toBe(WUHU_STATUS_LABELS.approval)

    dispose()
    expect(document.body.hasAttribute('data-wuhu-status')).toBe(false)
  })

  it('restores the latest host headline it did not own', async () => {
    document.body.innerHTML = `
      <div data-phase="hero"><div data-conversation-scroll><h2 class="fixture_headlineText">默认欢迎语</h2></div></div>
    `
    const headline = document.querySelector<HTMLElement>('.fixture_headlineText')!
    const dispose = installWuhuHeadline(document.body)
    expect(headline.textContent).toBe(WUHU_HEADLINE)

    headline.textContent = '宿主更新后的欢迎语'
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(headline.textContent).toBe(WUHU_HEADLINE)

    dispose()
    expect(headline.textContent).toBe('宿主更新后的欢迎语')
    expect(headline.hasAttribute('data-wuhu-headline')).toBe(false)
  })
})
