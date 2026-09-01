import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'))
const skin = JSON.parse(readFileSync(resolve(repositoryRoot, 'skin.json'), 'utf8'))

describe('standalone skin manifest contract', () => {
  it('uses one formal package identity across package and skin metadata', () => {
    expect(packageJson.name).toBe('@wuhu-traffic/dsh-client-ui-skin')
    expect(packageJson.version).toBe('0.1.0')
    expect(packageJson.private).toBeUndefined()
    expect(packageJson.author).toBe('wangxuyang1221')
    expect(packageJson.repository).toEqual({
      type: 'git',
      url: 'https://github.com/wangxuyang1221/dsh-skin-wuhu-traffic-agent.git',
    })
    expect(skin.package).toBe(packageJson.name)
    expect(skin.author).toBe(packageJson.author)
    expect(skin.tags).not.toContain('prototype')
    expect(skin.dshCompatibility).toBe('0.1.1rc2')
  })

  it('contains no prototype copy in release-facing files', () => {
    const releaseFacingFiles = [
      'README.md',
      'NOTICE',
      'cordis.patch.yml',
      'src/client/brand.ts',
    ]

    for (const file of releaseFacingFiles) {
      const contents = readFileSync(resolve(repositoryRoot, file), 'utf8')
      expect(contents, file).not.toMatch(/prototype|原型/i)
    }
  })
})
