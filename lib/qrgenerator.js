"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _QrGenerator_generateQr;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrGenerator = void 0;
const node_crypto_1 = require("node:crypto");
/**
 * Default in-memory cache for storing qr payloads
 * based on `orderRef`.
 */
const _defaultCacheMap = new Map();
const defaultCache = {
    get: (key) => Promise.resolve(_defaultCacheMap.get(key)),
    set: (key, value) => Promise.resolve(_defaultCacheMap.set(key, value)).then(() => void 0),
    delete: (key) => Promise.resolve(_defaultCacheMap.delete(key)),
};
/** seconds */
const TIMEOUT = 60;
/**
 * QrGenerator is an optional class responsible for generating QR codes based
 * on bankID responses and caching them with its custom cache store.
 * It has functionalities to generate and retrieve the latest QR code
 * from cache and cycle through a new QR code value.
 */
class QrGenerator {
    constructor(resp, options = QrGenerator.defaultOptions) {
        this.cache = defaultCache;
        /**
         * Private method `#generateQr` generates a new QR code
         */
        _QrGenerator_generateQr.set(this, (qrStartSecret, qrStartToken, time) => {
            const qrAuthCode = (0, node_crypto_1.createHmac)("sha256", qrStartSecret)
                .update(`${time}`)
                .digest("hex");
            return `bankid.${qrStartToken}.${time}.${qrAuthCode}`;
        });
        if ("customCache" in options && Boolean(options.customCache)) {
            this.cache = options.customCache;
        }
        this.orderRef = (resp === null || resp === void 0 ? void 0 : resp.orderRef) || null;
        // If constructed with a response, set the cache
        if (resp) {
            const { qrStartSecret, qrStartToken, orderRef } = resp;
            const now = Date.now();
            const qrCacheEntry = {
                startTime: now,
                qrStartSecret,
                qrStartToken,
            };
            this.cache.set(orderRef, qrCacheEntry);
        }
        // local in-memory cache will auto-clean keys after set TTL
        if ("orderTTL" in options) {
            setTimeout(() => {
                if (this.orderRef) {
                    this.cache.delete(this.orderRef);
                }
            }, options.orderTTL * 1000);
        }
        return this;
    }
    /**
     * latestQrFromCache is a static asynchronous method that generates the latest QR code from cache.
     *
     * @param {string} orderRef - The order reference to be used for generating QR code.
     * @param {QrGeneratorCache} [customCache=defaultCache] - Optional parameter, the cache store to be used for generating QR code.
     * If no customCache is provided, the defaultCache is used.
     *
     * @returns {Promise<string>} - It returns a Promise that resolves with the latest QR code for the provided order reference.
     **/
    static async latestQrFromCache(orderRef, customCache = defaultCache) {
        const instance = new QrGenerator(null, { customCache });
        return (await instance.nextQr(orderRef, { maxCycles: 1 }).next()).value;
    }
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
    async *nextQr(orderRef, { maxCycles, timeout } = { timeout: TIMEOUT }) {
        const qr = await this.cache.get(orderRef);
        if (!qr)
            return;
        for (let i = 0; i >= 0; i++) {
            const secondsSinceStart = Math.floor((Date.now() - qr.startTime) / 1000);
            // Stop cycle if maxCycles is reached or timeout has occurred
            if (maxCycles && i >= maxCycles)
                return;
            if (timeout && timeout < secondsSinceStart)
                return;
            yield __classPrivateFieldGet(this, _QrGenerator_generateQr, "f").call(this, qr.qrStartSecret, qr.qrStartToken, secondsSinceStart);
        }
    }
}
exports.QrGenerator = QrGenerator;
_QrGenerator_generateQr = new WeakMap();
QrGenerator.defaultOptions = { orderTTL: TIMEOUT };
//# sourceMappingURL=qrgenerator.js.map