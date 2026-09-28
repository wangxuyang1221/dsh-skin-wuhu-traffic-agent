// Opt-in integration check against a running official Desktop with this skin enabled.
// Start the isolated Desktop with --remote-debugging-port=19340 first.
import assert from 'node:assert/strict'

const port = Number(process.env.DSH_DESKTOP_DEBUG_PORT ?? 19340)
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'Invalid debug port')
const pages = await fetch(`http://127.0.0.1:${port}/json/list`, {
  signal: AbortSignal.timeout(10000),
}).then(response => response.json())
const page = pages.find(page => page.type === 'page' && page.url.startsWith('dsh-app://app/'))
assert.ok(page, 'Official Desktop page not found')
const socket = new WebSocket(page.webSocketDebuggerUrl)
const timeout = setTimeout(() => {
  console.error('Desktop drag check timed out')
  socket.close()
  process.exitCode = 1
}, 10000)
try {
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const response = new Promise((resolve, reject) => {
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id !== 1) return
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
    })
    socket.addEventListener('close', () => reject(new Error('Desktop connection closed')), { once: true })
  })
  socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
    returnByValue: true,
    expression: `(() => {
      const describe = element => ({
        region: getComputedStyle(element).getPropertyValue('-webkit-app-region'),
        pointerEvents: getComputedStyle(element).pointerEvents,
        rect: element.getBoundingClientRect().toJSON(),
      });
      const visible = element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && rect.x < innerWidth && rect.y < innerHeight };
      return {
        platform: document.documentElement.dataset.platform,
        enabled: document.body.hasAttribute('data-dsh-wuhu-traffic-agent'),
        ambient: [...document.querySelectorAll('body > [data-skin-chrome="ambient"]')].map(describe),
        spine: [...document.querySelectorAll('body > [data-skin-chrome="spine"]')].map(describe),
        titles: [...document.querySelectorAll('[data-window-drag]')].filter(visible).map(describe),
        buttons: [...document.querySelectorAll('[data-window-drag] button')].filter(visible).map(describe),
      };
    })()`,
  } }))
  const result = await response
  assert.equal(result.exceptionDetails, undefined, 'Renderer evaluation failed')
  const state = result.result.value
  console.log(JSON.stringify(state, null, 2))
  assert.equal(state.platform, 'darwin', 'This check requires official macOS Desktop')
  assert.equal(state.enabled, true, 'Enable the skin first')
  for (const name of ['ambient', 'spine']) {
    assert.equal(state[name].length, 1, `Expected exactly one ${name}`)
    assert.equal(state[name][0].region, 'none', `${name} must not exclude native drag regions`)
    assert.equal(state[name][0].pointerEvents, 'none', `${name} must not intercept page input`)
  }
  assert.ok(state.titles.length > 0, 'Expected a visible native drag surface')
  assert.ok(state.titles.every(title => title.region === 'drag'), 'Preserve host drag surfaces')
  assert.ok(state.buttons.length > 0, 'Expected a visible titlebar button')
  assert.ok(state.buttons.every(button => button.region === 'no-drag'), 'Preserve clickable titlebar buttons')
  console.log('PASS: Desktop drag-region styles. Native window movement needs separate OS-level verification.')
} finally {
  clearTimeout(timeout)
  socket.close()
}
