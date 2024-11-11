import type { AuthResponse } from "./bankid";
export interface QrCacheEntry {
    startTime: number;
    qrStartToken: string;
    qrStartSecret: string;
}
interface QRGenerateOptions {
    /** max cycles */
    maxCycles?: number;
    /** in seconds  */
    timeout?: number;
}
export type QrGeneratorOptions = {
    /** Provide your own caching layer */
    customCache: QrGeneratorCache;
} | {
    orderTTL: number;
};
declare const defaultCache: {
    get: (key: string) => Promise<QrCacheEntry | undefined>;
    set: (key: string, value: QrCacheEntry) => Promise<undefined>;
    delete: (key: string) => Promise<boolean>;
};
export type QrGeneratorCache = typeof defaultCache;
/**
 * QrGenerator is an optional class responsible for generating QR codes based
 * on bankID responses and caching them with its custom cache store.
 * It has functionalities to generate and retrieve the latest QR code
 * from cache and cycle through a new QR code value.
 */
export declare class QrGenerator {
    #private;
    cache: QrGeneratorCache;
    orderRef: string | null;
    static defaultOptions: {
        readonly orderTTL: 60;
    };
    constructor(resp: AuthResponse | null, options?: QrGeneratorOptions);
    /**
     * latestQrFromCache is a static asynchronous method that generates the latest QR code from cache.
     *
     * @param {string} orderRef - The order reference to be used for generating QR code.
     * @param {QrGeneratorCache} [customCache=defaultCache] - Optional parameter, the cache store to be used for generating QR code.
     * If no customCache is provided, the defaultCache is used.
     *
     * @returns {Promise<string>} - It returns a Promise that resolves with the latest QR code for the provided order reference.
     **/
    static latestQrFromCache(orderRef: string, customCache?: QrGeneratorCache): Promise<string | void>;
    /**
     * Generator yielding a new value for the qrcode within
     * the specified limits.
     * @example
     * ```
     * for await (const qr of qrInstance?.nextQr(orderRef, { timeout: 60 })) {
     *  // Put value from qr in a cache
     *  await sleep(2000)
     * }
     * ```
     **/
    nextQr(orderRef: string, { maxCycles, timeout }?: QRGenerateOptions): AsyncGenerator<string, void, unknown>;
}
export {};
