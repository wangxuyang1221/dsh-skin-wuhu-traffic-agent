import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@wuhu-traffic/dsh-client-ui-skin', ['src/index.ts'], {
  portableCssModuleIds: true,
})
