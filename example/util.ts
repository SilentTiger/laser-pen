import type { Bezier, PolyBezier } from "bezier-js";
import type { IControlPoint, IPoint } from "../src";

function drawMouseTrack(ctx: CanvasRenderingContext2D, originalPoints: IPoint[]) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,255,0.5)';
  for (let i = 0; i < originalPoints.length; i++) {
    const point = originalPoints[i]
    ctx.fillRect(point.x - 1, point.y - 1, 2, 2)
  }
  ctx.restore()
}

function drawControlPoint(ctx: CanvasRenderingContext2D, points: IControlPoint[]) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,255,0,0.5)';
  ctx.strokeStyle = 'rgba(0,255,0,0.5)';
  for (let i = 0; i < points.length; i++) {
    const { cp, cn } = points[i]
    ctx.fillRect(cp.x - 1, cp.y - 1, 2, 2)
    ctx.strokeRect(cn.x - 2, cn.y - 2, 4, 4)
  }
  ctx.restore()
}

function drawBezierTrack(ctx: CanvasRenderingContext2D, originalPoints: IPoint[], controlPoints: IControlPoint[]) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,0,0,0.3)';
  ctx.strokeStyle = 'rgba(255,0,0,0.3)';
  ctx.beginPath()
  for (let i = 1; i < originalPoints.length; i++) {
    const pp = originalPoints[i - 1]
    const p = originalPoints[i]
    const { cn: ppn } = controlPoints[i - 1]
    const { cp } = controlPoints[i]
    ctx.moveTo(pp.x, pp.y)
    ctx.bezierCurveTo(ppn.x, ppn.y, cp.x, cp.y, p.x, p.y)
  }
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

function drawBezierArray(ctx: CanvasRenderingContext2D, bzArray: Bezier[], totalLength: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,0,0,0.3)';
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 0; i < bzArray.length; i++) {
    const bz = bzArray[i]
    ctx.moveTo(bz.points[0].x, bz.points[0].y)
    ctx.bezierCurveTo(bz.points[1].x, bz.points[1].y, bz.points[2].x, bz.points[2].y, bz.points[3].x, bz.points[3].y)
  }
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

function drawBezierOutline(ctx: CanvasRenderingContext2D, bzOutlines: PolyBezier[]) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,0,0,0.6)';
  for (let index = 0; index < bzOutlines.length; index++) {
    const outline = bzOutlines[index];
    outline.curves.forEach(curve => {
      const ox = 0;
      const oy = 0;
      ctx.beginPath();
      const p = curve.points;
      ctx.moveTo(p[0].x + ox, p[0].y + oy);
      if (p.length === 3) {
        ctx.quadraticCurveTo(p[1].x + ox, p[1].y + oy, p[2].x + ox, p[2].y + oy);
      }
      if (p.length === 4) {
        ctx.bezierCurveTo(
          p[1].x + ox,
          p[1].y + oy,
          p[2].x + ox,
          p[2].y + oy,
          p[3].x + ox,
          p[3].y + oy
        );
      }
      ctx.stroke();
      ctx.closePath();
    })
  }
  ctx.restore()
}