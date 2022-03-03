import type { SimplePeerInstance } from './interface'
import { RemoteController } from './RemoteController'
import { createSocket } from './ws'

const statusDom = document.getElementById('status') as HTMLDivElement

function getParameterByName(name: string, url: string = window.location.href) {
  const paramName = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp(`[?&]${paramName}(=([^&#]*)|&|#|$)`)
  const results = regex.exec(url)
  if (!results) {
    return null
  }
  if (!results[2]) {
    return ''
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function showStatus(status: string) {
  statusDom.textContent = status
}

createSocket('client')
  .then((res) => {
    showStatus('Connecting to peer...')
    const ws = res.socket
    const targetId = getParameterByName('id')
    const peerConnection: SimplePeerInstance = new (window as any).SimplePeer()
    peerConnection.on('signal', (signalData: any) => {
      ws.emit('signal', { target: targetId, data: signalData })
    })
    peerConnection.on('connect', () => {
      showStatus('Connected.')
      // eslint-disable-next-line no-new
      new RemoteController(peerConnection)
    })
    peerConnection.on('disconnect', () => {
      showStatus('Disconnected.')
    })
    ws.on('signal', ({ data }) => {
      peerConnection.signal(data)
    })
    ws.emit('needConnect', targetId)
  })
  .catch((err) => {
    console.log(err)
    showStatus('Connect to server error.')
  })
