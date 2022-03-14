import type { SimplePeerInstance } from './interface'

const maxAngleTan = Math.tan((25 * Math.PI) / 180)

export class RemoteController {
  private conn: SimplePeerInstance
  private currentAngle: [number, number] = [0, 0]
  private resetAngle: [number, number] = [0, 0]

  constructor(conn: SimplePeerInstance) {
    this.conn = conn
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      const btnPermission = document.getElementById('btnRequestPermission')
      if (btnPermission) {
        btnPermission.style.display = 'block'
        btnPermission.addEventListener('click', () => {
          ;(DeviceMotionEvent as any).requestPermission().then((response: string) => {
            if (response === 'granted') {
              this.listenDeviceOrientation()
              btnPermission.style.display = 'none'
            }
          })
        })
      }
    } else {
      this.listenDeviceOrientation()
    }
    this.listenColorChange()
    this.listenReset()
  }

  private listenDeviceOrientation() {
    window.addEventListener(
      'deviceorientation',
      (event) => {
        const alpha = event.alpha ?? 0
        const beta = event.beta ?? 0
        this.currentAngle[0] = alpha > 180 ? alpha - 360 : alpha
        this.currentAngle[1] = beta
        this.conn.send(
          JSON.stringify({
            type: 'point',
            point: [
              Math.tan(((this.currentAngle[0] - this.resetAngle[0]) * Math.PI) / 180) / maxAngleTan,
              Math.tan(((this.currentAngle[1] - this.resetAngle[1]) * Math.PI) / 180) / maxAngleTan,
            ],
          }),
        )
      },
      false,
    )
  }

  private listenColorChange() {
    document.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        const color = this.readColor()
        this.conn.send(JSON.stringify({ type: 'color', color }))
      })
    })
  }

  private listenReset() {
    document.getElementById('btnReset')?.addEventListener('click', () => {
      this.conn.send(JSON.stringify({ type: 'reset' }))
      this.resetAngle[0] = this.currentAngle[0]
      this.resetAngle[1] = this.currentAngle[1]
    })
  }

  private readColor(): [number, number, number] {
    const rangeColorRed = parseInt((document.getElementById('rangeColorRed') as HTMLInputElement).value, 10)
    const rangeColorGreen = parseInt((document.getElementById('rangeColorGreen') as HTMLInputElement).value, 10)
    const rangeColorBlue = parseInt((document.getElementById('rangeColorBlue') as HTMLInputElement).value, 10)
    const color = `rgb(${rangeColorRed}, ${rangeColorGreen}, ${rangeColorBlue})`
    ;(document.querySelector('#colorBox') as HTMLDivElement).style.backgroundColor = color
    return [rangeColorRed, rangeColorGreen, rangeColorBlue]
  }
}
