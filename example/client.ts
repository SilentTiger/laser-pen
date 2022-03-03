import type { SimplePeerInstance } from './interface'
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

let pc: SimplePeerInstance | null = null

createSocket('client')
  .then((res) => {
    showStatus('Connecting to peer...')
    const ws = res.socket
    const targetId = getParameterByName('id')
    const newPc: SimplePeerInstance = new (window as any).SimplePeer()
    newPc.on('signal', (signalData: any) => {
      ws.emit('signal', { target: targetId, data: signalData })
    })
    newPc.on('connect', () => {
      showStatus('Connected.')
      pc = newPc
    })
    newPc.on('disconnect', () => {
      showStatus('Disconnected.')
    })
    ws.on('signal', ({ data }) => {
      newPc.signal(data)
    })
    ws.emit('needConnect', targetId)
  })
  .catch((err) => {
    console.log(err)
    showStatus('Connect to server error.')
  })
;(() => {
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const color = readColor()
      if (pc) {
        pc.send(JSON.stringify({ type: 'color', color }))
      }
    })
  })
})()

function readColor(): [number, number, number] {
  const rangeColorRed = parseInt((document.getElementById('rangeColorRed') as HTMLInputElement).value, 10)
  const rangeColorGreen = parseInt((document.getElementById('rangeColorGreen') as HTMLInputElement).value, 10)
  const rangeColorBlue = parseInt((document.getElementById('rangeColorBlue') as HTMLInputElement).value, 10)
  const color = `rgb(${rangeColorRed}, ${rangeColorGreen}, ${rangeColorBlue})`
  ;(document.querySelector('#colorBox') as HTMLDivElement).style.backgroundColor = color
  return [rangeColorRed, rangeColorGreen, rangeColorBlue]
}
