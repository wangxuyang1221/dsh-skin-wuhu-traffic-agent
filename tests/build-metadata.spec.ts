import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')
const helper = resolve(repositoryRoot, 'scripts/write-skin-build.mjs')
const fixtures: string[] = []

function createSkinFixture(): string {
  const root = mkdtempSync(resolve(repositoryRoot, '.test-tmp-build-'))
  fixtures.push(root)
  mkdirSync(resolve(root, 'lib'))
  writeFileSync(resolve(root, 'lib/client.js'), 'client bundle\n')
  writeFileSync(resolve(root, 'lib/index.js'), 'host bundle\n')
  writeFileSync(resolve(root, 'cordis.patch.yml'), '- insert: []\n')
  writeFileSync(resolve(root, 'skin.json'), `${JSON.stringify({
    id: 'wuhu-traffic-agent',
    dshCompatibility: '0.1.1rc2',
  }, null, 2)}\n`)
  return root
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true })
})

describe('skin build metadata helper', () => {
  it('writes standalone repository metadata for a root-level skin', () => {
    const skinRoot = createSkinFixture()
    const args = [helper, skinRoot, 'wangxuyang1221/dsh-skin-wuhu-traffic-agent', '.']

    execFileSync(process.execPath, args, { cwd: repositoryRoot })
    const first = JSON.parse(readFileSync(resolve(skinRoot, 'skin.build.json'), 'utf8'))
    execFileSync(process.execPath, args, { cwd: repositoryRoot })
    const second = JSON.parse(readFileSync(resolve(skinRoot, 'skin.build.json'), 'utf8'))

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      schema: 1,
      repository: 'wangxuyang1221/dsh-skin-wuhu-traffic-agent',
      path: '.',
    })
    expect(first.fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(first.sourceCommit).toBe(execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }).trim())
  })

  it('runs the build metadata helper entirely inside this repository', () => {
    const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'))

    expect(packageJson.scripts.build).toBe(
      'tsdown && node scripts/write-skin-build.mjs . wangxuyang1221/dsh-skin-wuhu-traffic-agent .',
    )
    expect(packageJson.scripts.build).not.toContain('../scripts')
    expect(packageJson.scripts.build).not.toContain('Small-tailqwq/dsh-deep-whale')
  })
})
