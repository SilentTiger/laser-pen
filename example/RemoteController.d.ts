import type { SimplePeerInstance } from './interface';
export declare class RemoteController {
    private conn;
    private currentAngle;
    private resetAngle;
    constructor(conn: SimplePeerInstance);
    private listenDeviceOrientation;
    private listenColorChange;
    private listenReset;
    private readColor;
}
