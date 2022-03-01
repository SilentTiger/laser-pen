import QRCode from 'qrcode'
import ClipboardJS from 'clipboard'
import SimplePeer from 'simple-peer'
import type { Socket } from 'socket.io-client'
import type { IOriginalPointData } from '../src/index'
import {
  setTension,
  setDelay,
  setMinWidth,
  setMaxWidth,
  setOpacity,
  setColor,
  setRoundCap,
  drainPoints,
  drawLaserPen,
} from '../src/index'
import './remoteControl'
import { createSocket } from './ws'

type CustomSimplePeerInstance = SimplePeer.Instance & { remoteId: string }

let mouseTrack: IOriginalPointData[] = [
  // { x: 50 + 0, y: 50 + 50, time: 0 },
  // { x: 50 + 50, y: 50 + 0, time: 0 },
  // { x: 50 + 100, y: 50 + 50, time: 0 },
  // { x: 50 + 150, y: 50 + 0, time: 0 },
  // { x: 50 + 200, y: 50 + 50, time: 0 },
  // { "x": 500, "y": 400, "time": Infinity },
  // { "x": 450, "y": 350, "time": Infinity },
  // { "x": 400, "y": 300, "time": Infinity },
  // { "x": 350, "y": 250, "time": Infinity },
  // { "x": 300, "y": 200, "time": Infinity },
  // { "x": 250, "y": 150, "time": Infinity },
]
const cvsDom = document.querySelector('#cvs') as HTMLCanvasElement
const ctx = cvsDom.getContext('2d') as CanvasRenderingContext2D
const rangeDelayDom = document.querySelector('#rangeDelay') as HTMLInputElement
const rangeMaxWidthDom = document.querySelector('#rangeMaxWidth') as HTMLInputElement
const rangeMinWidthDom = document.querySelector('#rangeMinWidth') as HTMLInputElement
const rangeTensionDom = document.querySelector('#rangeTension') as HTMLInputElement
const rangeOpacityDom = document.querySelector('#rangeOpacity') as HTMLInputElement
const rangeColorRedDom = document.querySelector('#rangeColorRed') as HTMLInputElement
const rangeColorGreenDom = document.querySelector('#rangeColorGreen') as HTMLInputElement
const rangeColorBlueDom = document.querySelector('#rangeColorBlue') as HTMLInputElement
const colorBox = document.querySelector('#colorBox') as HTMLInputElement
const chkRoundCap = document.querySelector('#chkRoundCap') as HTMLInputElement
const canvasPos = cvsDom.getBoundingClientRect()
const imgQrCode = document.querySelector('#qr-code') as HTMLDivElement
const btnCopyUrl = document.querySelector('#btnCopyUrl') as HTMLButtonElement

const ratio = ((context: any) => {
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1
  return (window.devicePixelRatio || 1) / backingStore
})(ctx)

let drawing = false
function startDraw() {
  if (!drawing) {
    draw()
  }
}
function draw() {
  ctx.clearRect(0, 0, cvsDom.width, cvsDom.height)
  mouseTrack = drainPoints(mouseTrack)
  if (mouseTrack.length < 3) {
    drawing = false
    return
  }
  drawing = true
  drawLaserPen(ctx, mouseTrack)
  requestAnimationFrame(draw)
}

function onRangeChange(event: Event) {
  const input = event.target as HTMLInputElement
  const valueString = showInputValue(input)
  try {
    const valueFloat = parseFloat(valueString)
    switch (input.id) {
      case rangeDelayDom.id:
        setDelay(valueFloat * 1000)
        break
      case rangeMaxWidthDom.id:
        setMaxWidth(valueFloat)
        break
      case rangeMinWidthDom.id:
        setMinWidth(valueFloat)
        break
      case rangeTensionDom.id:
        setTension(valueFloat)
        break
      case rangeOpacityDom.id:
        setOpacity(valueFloat)
        break
      case rangeColorRedDom.id:
      case rangeColorGreenDom.id:
      case rangeColorBlueDom.id:
        showColor()
        setColor(
          parseInt(rangeColorRedDom.value, 10),
          parseInt(rangeColorGreenDom.value, 10),
          parseInt(rangeColorBlueDom.value, 10),
        )
        break
    }
  } catch (err) {
    console.error('set params error:', err)
  }
}

function onRoundCapChange() {
  setRoundCap(chkRoundCap.checked)
}

function onMouseMove(event: MouseEvent) {
  const relativeX = event.clientX - canvasPos.x
  const relativeY = event.clientY - canvasPos.y
  mouseTrack.push({
    x: relativeX,
    y: relativeY,
    time: Date.now(),
  })
  startDraw()
}

function showInputValue(input: HTMLInputElement) {
  const value = input.value.toString()
  const valueDomId = `${input.id}Value`
  const valueDom = document.querySelector(`#${valueDomId}`)
  if (valueDom) {
    valueDom.textContent = value
  }
  return value
}

function showColor() {
  colorBox.style.backgroundColor = `rgb(${rangeColorRedDom.value},${rangeColorGreenDom.value},${rangeColorBlueDom.value})`
}

function setCanvasSize() {
  const rect = cvsDom.getBoundingClientRect()
  cvsDom.setAttribute('width', `${rect.width * ratio}px`)
  cvsDom.setAttribute('height', `${rect.height * ratio}px`)
  ctx.scale(ratio, ratio)
}

;(function init() {
  rangeDelayDom.addEventListener('input', onRangeChange)
  rangeMaxWidthDom.addEventListener('input', onRangeChange)
  rangeMinWidthDom.addEventListener('input', onRangeChange)
  rangeTensionDom.addEventListener('input', onRangeChange)
  rangeOpacityDom.addEventListener('input', onRangeChange)

  rangeColorRedDom.addEventListener('input', onRangeChange)
  rangeColorGreenDom.addEventListener('input', onRangeChange)
  rangeColorBlueDom.addEventListener('input', onRangeChange)

  chkRoundCap.addEventListener('change', onRoundCapChange)

  document.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', setCanvasSize)

  setCanvasSize()

  showInputValue(rangeDelayDom)
  showInputValue(rangeMaxWidthDom)
  showInputValue(rangeMinWidthDom)
  showInputValue(rangeTensionDom)
  showInputValue(rangeOpacityDom)
  showColor()
})()
;(function initConnection() {
  let ws: Socket | null = null
  const pcs: Map<string, CustomSimplePeerInstance> = new Map()

  const onSignal = ({ from, data }: { from: string; data: string }) => {
    pcs.get(from)?.signal(data)
  }

  function onPeerMessage(e: any) {
    console.log('onPeerMessage', e)
  }

  const onNeedConnect = (clientId: string) => {
    const pc = new SimplePeer({ initiator: true }) as CustomSimplePeerInstance
    pc.remoteId = clientId
    pc.on('signal', (signalData) => {
      console.log('signal', signalData)
      ws?.emit('signal', { target: clientId, data: signalData })
    })
    pc.on('data', onPeerMessage)
    pc.on('connect', () => {
      console.log('connect')
      pcs.set(clientId, pc)
    })
    pc.on('disconnect', () => {
      pc.removeAllListeners()
      pcs.delete(pc.remoteId)
    })
  }

  createSocket('main').then(({ socket, id }) => {
    ws = socket
    const clientUrl = `${window.location.href.replace('main', 'client')}?id=${id}`
    btnCopyUrl.style.display = 'inline-block'
    btnCopyUrl.setAttribute('data-clipboard-text', clientUrl)
    // eslint-disable-next-line no-new
    new ClipboardJS('#btnCopyUrl')
    QRCode.toDataURL(clientUrl, { margin: 0, errorCorrectionLevel: 'L' }).then((qrcodeDataUrl) => {
      imgQrCode.style.display = 'block'
      imgQrCode.style.backgroundImage = `url(${qrcodeDataUrl})`
    })
    ws.on('signal', onSignal)
    ws.on('needConnect', onNeedConnect)
  })
})()
