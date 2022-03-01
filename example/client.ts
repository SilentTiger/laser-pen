import SimplePeer from 'simple-peer'
import { createSocket } from './ws'

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

createSocket('client').then((res) => {
  console.log('createSocket', res)
  const ws = res.socket
  const targetId = getParameterByName('id')
  ws.emit('needConnect', targetId)

  const pc = new SimplePeer()
  pc.on('signal', (signalData) => {
    ws.emit('signal', { target: targetId, data: signalData })
  })
  pc.on('connect', () => {
    console.log('connect')
  })
  pc.on('disconnect', () => {
    console.log('disconnect')
  })

  ws.on('signal', (e) => {
    const { from, data } = e
    console.log('received signal from', from, data)
    pc.signal(data)
  })
})
