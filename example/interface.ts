export interface SimplePeerInstance {
  remoteId: string
  on(event: string, cb: (...args: any[]) => void): void
  signal(data: any): void
  send(data: string): void
  removeAllListeners(): void
  destroy(): void
}
