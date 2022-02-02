declare class Peer {
    on(eventName: string, callback: (...args: any[]) => void): void;
    connect(id: string, arg?: {
        reliable: boolean;
    }): PeerConnection;
}
declare class PeerConnection {
    on(eventName: string, callback: (...args: any[]) => void): void;
    send(msg: string): void;
}
declare function acceptRemoteControl(): void;
declare function startRemoteControl(): void;
