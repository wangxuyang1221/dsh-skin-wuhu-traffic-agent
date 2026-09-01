// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installWuhuSettingsOverlay } from '../src/client/settings-overlay.ts'

const SETTINGS_OPEN_ATTRIBUTE = 'data-wuhu-settings-open'

async function flushMutations(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute(SETTINGS_OPEN_ATTRIBUTE)
})

describe('Wuhu settings overlay state', () => {
  it('tracks only the DSH sidebar settings dialog', async () => {
    document.body.innerHTML = `
      <div role="dialog" data-other-dialog></div>
      <div data-slot="sidebar.settings"></div>
    `
    const settings = document.querySelector<HTMLElement>("[data-slot='sidebar.settings']")!
    const dispose = installWuhuSettingsOverlay(document.body)

    expect(document.body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe(false)

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    settings.append(dialog)
    await flushMutations()
    expect(document.body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe(true)

    dialog.remove()
    await flushMutations()
    expect(document.body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe(false)

    dispose()
  })

  it('restores the settings state that existed before activation', async () => {
    document.body.setAttribute(SETTINGS_OPEN_ATTRIBUTE, 'preexisting')
    document.body.innerHTML = `
      <div data-slot="sidebar.settings"><div role="dialog"></div></div>
    `
    const dispose = installWuhuSettingsOverlay(document.body)
    const dialog = document.querySelector<HTMLElement>("[role='dialog']")!

    dialog.remove()
    await flushMutations()
    expect(document.body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe(false)

    dispose()
    expect(document.body.getAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe('preexisting')
  })

  it('does not overwrite settings state owned by a successor', () => {
    document.body.innerHTML = `
      <div data-slot="sidebar.settings"><div role="dialog"></div></div>
    `
    const dispose = installWuhuSettingsOverlay(document.body)
    expect(document.body.getAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe('')

    document.body.setAttribute(SETTINGS_OPEN_ATTRIBUTE, 'successor')
    dispose()

    expect(document.body.getAttribute(SETTINGS_OPEN_ATTRIBUTE)).toBe('successor')
  })
})
