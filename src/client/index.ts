/** Presentation-only Wuhu traffic-police skin. */
import type { Context } from '@deepseek-ai/cordis'
import { installWuhuBrand } from './brand.ts'
import { installWuhuBrandMarks } from './brand-marks.ts'
import { POLICE_EMBLEM } from './emblem.ts'
import { installWuhuHeadline } from './headline.ts'
import { installWuhuSettingsOverlay } from './settings-overlay.ts'
import { installWuhuStatus } from './status.ts'
import css from './wuhu-traffic-agent.module.css'

const BODY_ATTRIBUTE = 'data-dsh-wuhu-traffic-agent'
const SKIN_TITLE = '芜湖交管警用智能体 · DSH'
const cls = (name: keyof typeof css): string => css[name] ?? ''

export function apply(ctx: Context): void {
  const body = document.body
  const cleanup: Array<() => void> = []
  let disposed = false

  const dispose = (): void => {
    if (disposed) return
    disposed = true
    for (const release of cleanup.reverse()) release()
  }

  try {
    const originalBodyAttribute = body.getAttribute(BODY_ATTRIBUTE)
    const originalTitle = document.title
    body.setAttribute(BODY_ATTRIBUTE, '')
    document.title = SKIN_TITLE

    const ambient = document.createElement('div')
    ambient.className = cls('ambient')
    ambient.dataset.skinChrome = 'ambient'
    ambient.setAttribute('aria-hidden', 'true')

    const spine = document.createElement('div')
    spine.className = cls('spine')
    spine.dataset.skinChrome = 'spine'
    spine.setAttribute('aria-hidden', 'true')

    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.href = POLICE_EMBLEM
    favicon.dataset.wuhuFavicon = ''

    body.append(ambient, spine)
    document.head.append(favicon)
    cleanup.push(() => {
      ambient.remove()
      spine.remove()
      favicon.remove()
      if (body.getAttribute(BODY_ATTRIBUTE) === '') {
        if (originalBodyAttribute === null) body.removeAttribute(BODY_ATTRIBUTE)
        else body.setAttribute(BODY_ATTRIBUTE, originalBodyAttribute)
      }
      if (document.title === SKIN_TITLE) document.title = originalTitle
    })

    cleanup.push(installWuhuBrand(body, {
      stage: cls('stage'),
      identity: cls('identity'),
      title: cls('title'),
      titleLine: cls('titleLine'),
      emblem: cls('emblem'),
      verticalName: cls('verticalName'),
      signal: cls('signal'),
      signalDot: cls('signalDot'),
      signalLabel: cls('signalLabel'),
      registry: cls('registry'),
      registryCode: cls('registryCode'),
    }))
    cleanup.push(installWuhuStatus(body))
    cleanup.push(installWuhuHeadline(body))
    cleanup.push(installWuhuBrandMarks(body))
    cleanup.push(installWuhuSettingsOverlay(body))

    ctx.effect(() => dispose, 'ui-skin-wuhu-traffic-agent: presentation chrome')
  } catch (error) {
    dispose()
    throw error
  }
}
