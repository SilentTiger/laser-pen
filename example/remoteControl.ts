import type { IOriginalPointData } from '../src'
import { drawLaserPen, drainPoints } from '../src'

declare class Peer {
  public on(eventName: string, callback: (...args: any[]) => void): void
  public connect(id: string, arg?: { reliable: boolean }): PeerConnection
}
declare class PeerConnection {
  public on(eventName: string, callback: (...args: any[]) => void): void
  public send(msg: any): void
}

;(() => {
  const accept = location.href.indexOf('?accept') > -1
  if (accept) {
    acceptRemoteControl()
  }

  const isClient = location.href.indexOf('?id') > -1
  if (isClient) {
    startRemoteControl()
  }
})()

function acceptRemoteControl() {
  const peer = new Peer()
  peer.on('open', (id) => {
    history.replaceState(null, '', `?id=${id}`)
    peer.on('connection', (conn) => {
      const server = new Server()
      conn.on('data', (data: string | number[]) => {
        server.processData(data)
      })
    })
  })
}

function startRemoteControl() {
  const peer = new Peer()
  peer.on('open', () => {
    const remoteId = location.href.split('?id=')[1]
    const conn = peer.connect(remoteId, {
      reliable: true,
    })
    conn.on('open', () => {
      conn.send('start remote control')
      const controller = new RemoteController(conn)
      const btnReset = document.getElementById('btnReset')
      if (btnReset) {
        btnReset.style.display = 'block'
        btnReset.addEventListener('click', () => {
          controller.reset()
        })
      }
    })
    conn.on('error', (err) => {
      console.log('error', err)
    })
    conn.on('connection', () => {
      console.log('connection')
    })
    conn.on('call', () => {
      console.log('call')
    })
    conn.on('close', () => {
      console.log('close')
    })
    conn.on('disconnected', () => {
      console.log('disconnected')
    })
  })
}

const maxAngleTan = Math.tan((25 * Math.PI) / 180)

class RemoteController {
  private conn: PeerConnection
  private currentAngle: [number, number] = [0, 0]
  private resetAngle: [number, number] = [0, 0]
  constructor(conn: PeerConnection) {
    this.conn = conn
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      const btnReset = document.getElementById('btnReset')
      if (btnReset) {
        btnReset.innerText = 'request permission'
        btnReset.addEventListener('click', () => {
          ;(DeviceMotionEvent as any).requestPermission().then((response: string) => {
            if (response === 'granted') {
              this.listenDeviceOrientation()
              btnReset.innerText = 'reset'
            }
          })
        })
      }
    } else {
      this.listenDeviceOrientation()
    }
  }

  public reset() {
    this.conn.send('reset')
    this.resetAngle[0] = this.currentAngle[0]
    this.resetAngle[1] = this.currentAngle[1]
  }

  private listenDeviceOrientation() {
    window.addEventListener(
      'deviceorientation',
      (event) => {
        const alpha = event.alpha ?? 0
        const beta = event.beta ?? 0
        this.currentAngle[0] = alpha > 180 ? alpha - 360 : alpha
        this.currentAngle[1] = beta
        this.conn.send([
          Math.tan(((this.currentAngle[0] - this.resetAngle[0]) * Math.PI) / 180) / maxAngleTan,
          Math.tan(((this.currentAngle[1] - this.resetAngle[1]) * Math.PI) / 180) / maxAngleTan,
        ])
      },
      false,
    )
  }
}

class Server {
  private cvsDom = document.querySelector('#cvs') as HTMLCanvasElement
  private ctx = this.cvsDom.getContext('2d') as CanvasRenderingContext2D
  private cvsWidth = this.cvsDom.width
  private cvsHeight = this.cvsDom.height
  private mouseTrack: IOriginalPointData[] = []
  private pixelRadio = getPixelRatio(this.ctx)
  constructor() {
    this.reset()
    this.draw()
  }
  public processData(data: string | number[]) {
    if (typeof data === 'string') {
      if (data === 'reset') {
        this.reset()
      } else {
        alert(data)
      }
    } else {
      const currentTrackData: IOriginalPointData = {
        x: (this.cvsWidth / 2 / this.pixelRadio) * (1 - data[0]),
        y: (this.cvsHeight / 2 / this.pixelRadio) * (1 - data[1] + 0.25),
        time: Date.now(),
      }
      this.mouseTrack.push(currentTrackData)
    }
  }

  private reset() {
    this.mouseTrack.length = 0
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.cvsWidth, this.cvsHeight)
    this.mouseTrack = drainPoints(this.mouseTrack)
    if (this.mouseTrack.length >= 3) {
      drawLaserPen(this.ctx, this.mouseTrack)
    }
    requestAnimationFrame(() => {
      this.draw()
    })
  }
}

const getPixelRatio = (context: any): number => {
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1

  return (window.devicePixelRatio || 1) / backingStore
}
