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

;(function initDom() {
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
