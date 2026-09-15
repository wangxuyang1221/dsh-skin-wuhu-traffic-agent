import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/wuhu-traffic-agent.module.css', import.meta.url), 'utf8')

describe('skin-owned headline styles', () => {
  it('styles both host layouts through the ownership marker, including responsive and reduced-motion rules', () => {
    const selector = "body[data-dsh-wuhu-traffic-agent] [data-phase='hero'] [data-wuhu-headline]"
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(match => match[1]!.includes(selector))
      .map(match => match[2]!)

    expect(rules).toHaveLength(4)
    expect(rules[0]).toContain('display: inline-block')
    expect(rules[0]).toContain('font-family:')
    expect(rules[1]).toContain('animation: wuhu-status-pulse')
    expect(rules[2]).toContain('white-space: normal')
    expect(rules[3]).toContain('animation: none !important')
    expect(css).not.toContain("[class*='headlineText']")
  })
})
