// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { apply } from '../src/client/index.ts'

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/client/wuhu-traffic-agent.module.css'), 'utf8')
let fiber: Fiber | undefined
let style: HTMLStyleElement | undefined

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  style?.remove()
  document.documentElement.removeAttribute('data-platform')
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.removeAttribute('data-dsh-desktop-mode')
  document.body.innerHTML = ''
})

describe.each([false, true])('opaque skin surfaces, host dark=%s', dark => {
  it.each(['official', 'compatibility'])('uses the reference gray independently of %s host backing and restores native tokens', async mode => {
    document.body.toggleAttribute('data-ds-dark-theme', dark)
    document.body.dataset.dshDesktopMode = mode
    document.documentElement.dataset.platform = 'darwin'
    style = document.createElement('style')
    style.textContent = `
      body { --dsw-alias-bg-base: white; --dsw-specific-sidebar-fill: silver; }
      body[data-ds-dark-theme] { --dsw-alias-bg-base: black; --dsw-specific-sidebar-fill: gray; }
      html[data-platform='darwin'] body { background: transparent; }
      body[data-dsh-desktop-mode='compatibility'] { background: transparent !important; }
      ${css}
    `
    document.head.append(style)
    const native = getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base')
    fiber = new Context().plugin({ apply })
    await fiber.await()

    const computed = getComputedStyle(document.body)
    expect(computed.getPropertyValue('--dsw-alias-bg-base').trim()).toBe('#181d21')
    expect(computed.getPropertyValue('--dsw-specific-sidebar-fill').trim()).toBe('#050d18')
    expect(computed.backgroundImage).toBe('none')
    expect(computed.backgroundColor).toBe('rgb(24, 29, 33)')
    expect(document.body.hasAttribute('data-ds-dark-theme')).toBe(dark)

    await fiber.dispose()
    fiber = undefined
    expect(getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base')).toBe(native)
  })
})
