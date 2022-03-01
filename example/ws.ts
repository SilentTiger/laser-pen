import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

const SOCKET_HOST = 'laser-pen-lite.azurewebsites.net'

export function createSocket(type: 'main' | 'client'): Promise<{ socket: Socket; id: string }> {
  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      reject(new Error('connect socket timeout'))
    }, 10000)

    fetch(`https://${SOCKET_HOST}/create`, {
      method: 'POST',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
      .then((res) => {
        return res.text()
      })
      .then((createdId) => {
        const socket = io(`wss://${SOCKET_HOST}`, {
          extraHeaders: {
            id: createdId,
          },
        })
        socket.once('connect', () => {
          clearTimeout(timeoutTimer)
          resolve({ socket, id: createdId })
        })
      })
  })
}
