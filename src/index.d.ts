import { Bezier } from 'bezier-js';
export declare const setDelay: (millisecond: number) => void;
export declare const setMaxWidth: (width: number) => void;
export declare const setMinWidth: (width: number) => void;
export declare const setTension: (t: number) => void;
export declare const setOpacity: (o: number) => void;
export declare const setColor: (r: number, g: number, b: number) => void;
export declare const setRoundCap: (r: boolean) => void;
export interface IPoint {
    x: number;
    y: number;
}
export interface IControlPoint {
    cp: IPoint;
    cn: IPoint;
}
export interface IOriginalPointData extends IPoint {
    time: number;
}
export interface IDrawingBezierData {
    bezier: Bezier;
    opacity: number;
    width: number;
}
/**
 * remove some unnessesary points
 */
export declare const drainPoints: (originalPoints: IOriginalPointData[]) => IOriginalPointData[];
/**
 * calculate control points
 */
export declare const calControlPoints: (points: IPoint[]) => IControlPoint[];
/**
 * construct bezier curve from points
 */
export declare const transformPointToBezier: (points: IPoint[], controlPoints: IControlPoint[]) => Bezier[];
/**
 * calculate drawing data from bezier
 */
export declare const calDrawingData: (bzArray: Bezier[], totalLength: number) => IDrawingBezierData[];
export declare const drawDrawingBezierData: (ctx: CanvasRenderingContext2D, data: IDrawingBezierData[]) => void;
export declare const drawRoundCap: (ctx: CanvasRenderingContext2D, lastData: IDrawingBezierData) => void;
export declare const drawLaserPen: (ctx: CanvasRenderingContext2D, points: IPoint[]) => void;
