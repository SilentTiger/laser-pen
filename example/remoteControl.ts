import type { IOriginalPointData } from '../src'

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
  })
}

class RemoteController {
  private conn: PeerConnection
  private currentAngle: [number, number] = [0, 0]
  private resetAngle: [number, number] = [0, 0]
  constructor(conn: PeerConnection) {
    this.conn = conn
    window.addEventListener(
      'deviceorientation',
      (event) => {
        const alpha = event.alpha ?? 0
        const beta = event.beta ?? 0
        this.currentAngle[0] = alpha > 180 ? alpha - 360 : alpha
        this.currentAngle[1] = beta
        this.conn.send([
          ((this.currentAngle[0] - this.resetAngle[0]) / 15) * 180,
          ((this.currentAngle[1] - this.resetAngle[1]) / 15) * 180,
        ])
      },
      false,
    )
  }
  public reset() {
    this.conn.send('reset')
    this.resetAngle[0] = this.currentAngle[0]
    this.resetAngle[1] = this.currentAngle[1]
  }
}

class Server {
  private cvsDom = document.querySelector('#cvs') as HTMLCanvasElement
  private currentPos: [number, number] = [0, 0]
  private mouseTrack: IOriginalPointData[] = []
  constructor() {
    this.reset()
  }
  public processData(data: string | number[]) {
    if (typeof data === 'string') {
      if (data === 'reset') {
        this.reset()
      } else {
        alert(data)
      }
    } else {
      console.log(data)
    }
  }

  private reset() {
    this.currentPos[0] = this.cvsDom.width / 2
    this.currentPos[1] = this.cvsDom.height / 2
    this.mouseTrack.length = 0
  }
}
