import SimplePeer from 'simple-peer'
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
    ws.emit('needConnect', targetId)

    const pc = new SimplePeer()
    pc.on('signal', (signalData) => {
      ws.emit('signal', { target: targetId, data: signalData })
    })
    pc.on('connect', () => {
      console.log('connect')
      showStatus('Connected.')
    })
    pc.on('disconnect', () => {
      showStatus('Disconnected.')
    })

    ws.on('signal', (e) => {
      const { from, data } = e
      console.log('received signal from', from, data)
      pc.signal(data)
    })
  })
  .catch(() => {
    showStatus('Connect to server error.')
  })
