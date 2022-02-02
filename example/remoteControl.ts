declare class Peer {
  public on(eventName: string, callback: (...args: any[]) => void): void
  public connect(id: string, arg?: { reliable: boolean }): PeerConnection
}
declare class PeerConnection {
  public on(eventName: string, callback: (...args: any[]) => void): void
  public send(msg: string): void
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
      conn.on('data', (data: string | number[]) => {
        console.log(data)

        if (typeof data === 'string') {
          alert(data)
        } else {
          console.log(data)
        }
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
    })
  })
}
