import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/wuhu-traffic-agent.module.css', import.meta.url),
  'utf8',
)

describe('Wuhu Settings layering contract', () => {
  it('raises the application root below the official Modal tier while Settings is open', () => {
    const settingsRootRule = css.match(
      /body\[data-dsh-wuhu-traffic-agent\]\[data-wuhu-settings-open\]\s+\[id='root'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    expect(css).toContain('--wuhu-settings-overlay-z: 980')
    expect(css).not.toContain('#root')
    expect(settingsRootRule).not.toBe('')
    expect(settingsRootRule).toContain('z-index: var(--wuhu-settings-overlay-z) !important')
  })

  it('releases every skin-created ancestor stacking context around Settings', () => {
    const paneRule = css.match(
      /\[data-wuhu-settings-open\]\s+:is\(\[data-pane='sidebar'\], \[data-slot='sidebar'\] > :first-child\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const columnRule = css.match(
      /\[data-wuhu-settings-open\]\s+\[class\*='sidebarCol'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const carrierRule = css.match(
      /\[data-wuhu-settings-open\]\s+\[data-slot='sidebar'\] > :first-child > :has\(\[role='dialog'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    expect(paneRule).toContain('z-index: auto')
    expect(paneRule).toContain('isolation: auto')
    expect(columnRule).toContain('position: relative')
    expect(columnRule).toContain('z-index: auto')
    expect(columnRule).toContain('overflow: visible')
    expect(carrierRule).toContain('position: relative')
    expect(carrierRule).toContain('z-index: auto')
    expect(carrierRule).toContain('opacity: 1 !important')
    expect(carrierRule).not.toContain('position: static')
  })

  it('removes unrelated chrome from painting and hit testing without hiding host content', () => {
    const chromeRule = css.match(
      /\[data-wuhu-settings-open\]\s+\[data-skin-chrome\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    expect(css).toContain("[data-wuhu-settings-open] [class*='toggleCluster']")
    expect(chromeRule).toContain('opacity: 0')
    expect(chromeRule).toContain('visibility: hidden')
    expect(chromeRule).toContain('pointer-events: none')
    expect(css).not.toContain("[data-wuhu-settings-open] [data-phase='hero']")
    expect(css).not.toContain("[data-wuhu-settings-open] [data-composer-card]")
  })
})
