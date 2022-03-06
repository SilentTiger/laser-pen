import type { Socket } from 'socket.io-client';
export declare function createSocket(type: 'main' | 'client'): Promise<{
    socket: Socket;
    id: string;
}>;
