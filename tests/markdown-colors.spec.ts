// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { apply } from '../src/client/index.ts'

const skinCss = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/client/wuhu-traffic-agent.module.css'), 'utf8')
let fiber: Fiber | undefined
let styles: HTMLStyleElement[] = []

function addStyle(text: string): void {
  const style = document.createElement('style')
  style.textContent = text
  document.head.append(style)
  styles.push(style)
}

// Host token values verified against DSH ui-theme 0.1.2-alpha.1.
// Keep this fixture local so the skin gate does not require a sibling checkout.
function renderHost(dark: boolean): void {
  document.body.toggleAttribute('data-ds-dark-theme', dark)
  addStyle(`
    body {
      --dsw-alias-markdown-inline-code: rgb(235, 238, 242);
      --dsw-alias-markdown-code-block: rgb(249, 250, 251);
      --dsw-alias-markdown-code-block-banner: rgb(249, 250, 251);
    }
    body[data-ds-dark-theme] {
      --dsw-alias-markdown-inline-code: rgb(44, 44, 46);
      --dsw-alias-markdown-code-block: rgb(27, 27, 28);
      --dsw-alias-markdown-code-block-banner: rgb(44, 44, 46);
    }
  `)
  addStyle(skinCss)
}

const token = (name: string): string => getComputedStyle(document.body).getPropertyValue(name).replace(/\s+/g, '')

async function mount(): Promise<void> {
  fiber = new Context().plugin({ apply })
  await fiber.await()
}

async function unmount(): Promise<void> {
  await fiber?.dispose()
  fiber = undefined
}

afterEach(async () => {
  await unmount()
  for (const style of styles) style.remove()
  styles = []
  document.body.innerHTML = ''
  document.body.removeAttribute('data-ds-dark-theme')
  document.title = ''
})

describe.each([false, true])('Markdown palette with host dark=%s', dark => {
  // jsdom does not resolve inherited var() backgrounds on code nodes. Check
  // the actual cascade on body here; verify rendered nodes in Desktop as well.
  it.each([
    { suffix: 'inline-code', skin: '#143456', light: 'rgb(235,238,242)', dark: 'rgb(44,44,46)' },
    { suffix: 'code-block', skin: '#071322', light: 'rgb(249,250,251)', dark: 'rgb(27,27,28)' },
    { suffix: 'code-block-banner', skin: '#0c2139', light: 'rgb(249,250,251)', dark: 'rgb(44,44,46)' },
  ])('keeps $suffix dark only while the skin is active', async palette => {
    renderHost(dark)
    const name = `--dsw-alias-markdown-${palette.suffix}`
    const original = token(name)
    expect(original).toBe(dark ? palette.dark : palette.light)

    await mount()
    expect(token(name)).toBe(palette.skin)
    expect(token('--dsw-alias-label-primary')).toBe('#edf5ff')
    expect(document.body.hasAttribute('data-ds-dark-theme')).toBe(dark)

    // A host theme change must not reintroduce light code surfaces.
    document.body.toggleAttribute('data-ds-dark-theme', !dark)
    expect(token(name)).toBe(palette.skin)

    await unmount()
    expect(token(name)).toBe(dark ? palette.light : palette.dark)
    expect(document.body.hasAttribute('data-ds-dark-theme')).toBe(!dark)

    document.body.toggleAttribute('data-ds-dark-theme', dark)
    expect(token(name)).toBe(original)
  })
})
