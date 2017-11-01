import 'typings-global';
export interface IResolve<T> {
    (value?: T | Promise<T>): void;
}
export interface IReject {
    (reason?: any): void;
}
export declare class Deferred<T> {
    promise: Promise<T>;
    resolve: IResolve<T>;
    reject: IReject;
    constructor();
}
export declare let defer: <T>() => Deferred<T>;
/**
 * Creates a new resolved promise for the provided value.
 */
export declare let resolvedPromise: <T>(value?: T) => Promise<T>;
/**
 * Creates a new rejected promise for the provided reason.
 */
export declare let rejectedPromise: (err: any) => Promise<never>;
export declare let promisify: {
    (fn: Function): Function;
    custom: symbol;
};
export declare let map: <T>(inputArg: T[], functionArg: any) => Promise<any[]>;
