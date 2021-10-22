import { Bezier } from 'bezier-js'

let maxWidth = 10
let minWidth = 0
let delay = 300
let tension = 0.3
let opacity = 0
let colorRed = 255
let colorGreen = 0
let colorBlue = 0
let roundCap = false

export const setDelay = (millisecond: number) => {
  delay = millisecond
}

export const setMaxWidth = (width: number) => {
  maxWidth = width
}

export const setMinWidth = (width: number) => {
  minWidth = width
}

export const setTension = (t: number) => {
  tension = t
}

export const setOpacity = (o: number) => {
  opacity = o
}

export const setColor = (r: number, g: number, b: number) => {
  colorRed = r
  colorGreen = g
  colorBlue = b
}

export const setRoundCap = (r: boolean) => {
  roundCap = r
}

export interface IPoint {
  x: number
  y: number
}

export interface IControlPoint {
  cp: IPoint
  cn: IPoint
}

export interface IOriginalPointData extends IPoint {
  time: number
}

export interface IDrawingBezierData {
  bezier: Bezier
  opacity: number
  width: number
}

/**
 * remove some unnessesary points
 */
export const drainPoints = (originalPoints: IOriginalPointData[]): IOriginalPointData[] => {
  const timeThreshold = Date.now() - delay
  let sliceIndex: number | undefined
  // remove timeout points
  for (let index = 0; index < originalPoints.length; index++) {
    const point = originalPoints[index]
    if (point.time >= timeThreshold) {
      sliceIndex = index
      break
    }
  }
  const newPoints = sliceIndex === 0 ? originalPoints : sliceIndex === undefined ? [] : originalPoints.slice(sliceIndex)
  for (let index = newPoints.length - 1; index > 0; index--) {
    const p = newPoints[index]
    // if point[n - 1] and point[n] has the same coordinate, remove point[n]
    if (p.x === newPoints[index - 1].x && p.y === newPoints[index - 1].y) {
      newPoints.splice(index, 1)
    }
  }
  for (let index = newPoints.length - 1; index > 1; index--) {
    // if point[n - 1] and point[n + 1] has the same coordinate, remove point[n] and point[n + 1]
    const p = newPoints[index]
    if (p.x === newPoints[index - 2].x && p.y === newPoints[index - 2].y) {
      newPoints.splice(index - 1, 2)
      index--
    }
  }
  return newPoints
}

/**
 * calculate control points
 */
export const calControlPoints = (points: IPoint[]): IControlPoint[] => {
  if (points.length < 3) {
    throw new Error('to calculate control points, the point counts should be larger than 3')
  }
  const controlPoints: IControlPoint[] = Array(points.length)
  const l = points.length
  let i = l - 2
  for (; i > 0; i--) {
    const pi = points[i] // current point
    const pp = points[i + 1] // previous point
    const pn = points[i - 1] // next point;

    /* First, we calculate the normalized tangent slope vector (dx,dy).
     * We intentionally don't work with the derivative so we don't have
     * to handle the vertical line edge cases separately. */
    const rdx = pn.x - pp.x // actual delta-x between previous and next points
    const rdy = pn.y - pp.y // actual delta-y between previous and next points
    const rd = hypotenuse(rdx, rdy) // actual distance between previous and next points
    const dx = rdx / rd // normalized delta-x (so the total distance is 1)
    const dy = rdy / rd // normalized delta-y (so the total distance is 1)

    /* Next we calculate distances to previous and next points, so we
     * know how far out to put the control points on the tangents (tension).
     */
    const dp = hypotenuse(pi.x - pp.x, pi.y - pp.y) // distance to previous point
    const dn = hypotenuse(pi.x - pn.x, pi.y - pn.y) // distance to next point

    /* Now we can calculate control points. Previous control point is
     * located on the tangent of the curve, with the distance between it
     * and the current point being a fraction of the distance between the
     * current point and the previous point. Analogous to next point. */
    const cpx = pi.x - dx * dp * tension
    const cpy = pi.y - dy * dp * tension
    const cnx = pi.x + dx * dn * tension
    const cny = pi.y + dy * dn * tension

    controlPoints[i] = {
      cn: { x: cpx, y: cpy }, // previous control point
      cp: { x: cnx, y: cny }, // next control point
    }
    if (isNaN(cpx) || isNaN(cpy) || isNaN(cnx) || isNaN(cny)) {
      console.log('a')
    }
  }
  controlPoints[l - 1] = {
    cn: { x: points[l - 1].x, y: points[l - 1].y },
    cp: { x: (points[l - 1].x + controlPoints[l - 2].cp.x) / 2, y: (points[l - 1].y + controlPoints[l - 2].cp.y) / 2 },
  }
  controlPoints[0] = {
    cn: { x: (points[0].x + controlPoints[i + 1].cn.x) / 2, y: (points[0].y + controlPoints[i + 1].cn.y) / 2 },
    cp: { x: points[0].x, y: points[0].y },
  }

  return controlPoints
}

/**
 * construct bezier curve from points
 */
export const transformPointToBezier = (points: IPoint[], controlPoints: IControlPoint[]): Bezier[] => {
  const bzArray: Bezier[] = []
  for (let i = 1; i < points.length; i++) {
    const pp = points[i - 1]
    const p = points[i]
    const { cn: ppn } = controlPoints[i - 1]
    const { cp } = controlPoints[i]
    const bz = new Bezier(pp.x, pp.y, ppn.x, ppn.y, cp.x, cp.y, p.x, p.y)
    bzArray.push(bz)
  }
  return bzArray
}

/**
 * calculate drawing data from bezier
 */
export const calDrawingData = (bzArray: Bezier[], totalLength: number): IDrawingBezierData[] => {
  const drawingData: IDrawingBezierData[] = []
  const opacityDistance = 1 - opacity
  const widthDistance = maxWidth - minWidth
  let pastLength = 0
  for (let index = 0; index < bzArray.length; index++) {
    const bz = bzArray[index]
    const currentBezierLength = bz.length()
    pastLength += currentBezierLength
    const currentOpacity = opacity + (pastLength / totalLength) * opacityDistance
    const currentWidth = minWidth + (pastLength / totalLength) * widthDistance
    drawingData.push({
      bezier: bz,
      opacity: currentOpacity,
      width: currentWidth,
    })
  }
  return drawingData
}

export const drawDrawingBezierData = (ctx: CanvasRenderingContext2D, data: IDrawingBezierData[]) => {
  ctx.save()
  ctx.lineCap = 'butt'
  for (let i = 0; i < data.length; i++) {
    ctx.beginPath()
    const { bezier: bz, width, opacity } = data[i]
    ctx.lineWidth = width
    ctx.strokeStyle = `rgba(${colorRed},${colorGreen},${colorBlue},${opacity})`
    ctx.moveTo(bz.points[0].x, bz.points[0].y)
    ctx.bezierCurveTo(bz.points[1].x, bz.points[1].y, bz.points[2].x, bz.points[2].y, bz.points[3].x, bz.points[3].y)
    ctx.stroke()
    ctx.closePath()
  }
  ctx.restore()
}

export const drawRoundCap = (ctx: CanvasRenderingContext2D, lastData: IDrawingBezierData) => {
  const centerPoint = lastData.bezier.points[3]
  ctx.save()
  ctx.beginPath()
  ctx.fillStyle = `rgba(${colorRed},${colorGreen},${colorBlue},${lastData.opacity})`
  ctx.arc(centerPoint.x, centerPoint.y, lastData.width / 2, 0, Math.PI * 2, false)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export const drawLaserPen = (ctx: CanvasRenderingContext2D, points: IPoint[]) => {
  if (points.length < 3) {
    throw new Error('too less points')
  }
  const originalControlPoints = calControlPoints(points)
  const originalBezierArray = transformPointToBezier(points, originalControlPoints)
  const totalLength = originalBezierArray.reduce((sum, bz) => sum + bz.length(), 0)
  const step = totalLength / 50
  const splittedPoints: IPoint[] = []
  originalBezierArray.forEach((bz, index) => {
    const length = bz.length()
    const splitCount = Math.ceil(length / step) + 2
    const lut = bz.getLUT(splitCount)
    if (index < originalBezierArray.length - 1) {
      lut.pop()
    }
    splittedPoints.push(...lut)
  })
  const splittedControlPoints = calControlPoints(splittedPoints)
  const splittedBezierArray = transformPointToBezier(splittedPoints, splittedControlPoints)
  const drawingData = calDrawingData(splittedBezierArray, totalLength)
  drawDrawingBezierData(ctx, drawingData)
  if (roundCap) {
    drawRoundCap(ctx, drawingData[drawingData.length - 1])
  }
}

/**
 * calculate distance between two points
 */
function hypotenuse(x: number, y: number) {
  return Math.sqrt(x * x + y * y)
}
