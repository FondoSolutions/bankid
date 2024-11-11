"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BankIdClient_instances, _BankIdClient_call;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankIdClientV6 = exports.BankIdClient = exports.RequestError = exports.BankIdError = exports.BankIdMethod = exports.REQUEST_FAILED_ERROR = exports.BankIdErrorCode = void 0;
const fs = require("fs");
const https = require("https");
const path = require("path");
const axios_1 = require("axios");
const qrgenerator_1 = require("./qrgenerator");
var BankIdErrorCode;
(function (BankIdErrorCode) {
    BankIdErrorCode["ALREADY_IN_PROGRESS"] = "alreadyInProgress";
    BankIdErrorCode["INVALID_PARAMETERS"] = "invalidParameters";
    BankIdErrorCode["UNAUTHORIZED"] = "unauthorized";
    BankIdErrorCode["NOT_FOUND"] = "notFound";
    BankIdErrorCode["METHOD_NOT_ALLOWED"] = "methodNotAllowed";
    BankIdErrorCode["REQUEST_TIMEOUT"] = "requestTimeout";
    BankIdErrorCode["UNSUPPORTED_MEDIA_TYPE"] = "unsupportedMediaType";
    BankIdErrorCode["INTERNAL_ERROR"] = "internalError";
    BankIdErrorCode["MAINTENANCE"] = "maintenance";
})(BankIdErrorCode = exports.BankIdErrorCode || (exports.BankIdErrorCode = {}));
exports.REQUEST_FAILED_ERROR = "BANKID_NO_RESPONSE";
//
// Collection of overarching types
//
var BankIdMethod;
(function (BankIdMethod) {
    BankIdMethod["auth"] = "auth";
    BankIdMethod["sign"] = "sign";
    BankIdMethod["collect"] = "collect";
    BankIdMethod["cancel"] = "cancel";
})(BankIdMethod = exports.BankIdMethod || (exports.BankIdMethod = {}));
//
// Error types
//
class BankIdError extends Error {
    constructor(code, details) {
        super(code);
        Error.captureStackTrace(this, this.constructor);
        this.name = "BankIdError";
        this.code = code;
        this.details = details;
    }
}
exports.BankIdError = BankIdError;
class RequestError extends Error {
    constructor(request) {
        super(exports.REQUEST_FAILED_ERROR);
        Error.captureStackTrace(this, this.constructor);
        this.name = "RequestError";
        this.request = request;
    }
}
exports.RequestError = RequestError;
//
// Client implementation
//
class BankIdClient {
    constructor(options) {
        _BankIdClient_instances.add(this);
        this.version = "v5.1";
        this.options = {
            production: false,
            refreshInterval: 2000,
            ...options,
        };
        if (this.options.production) {
            if (!(options === null || options === void 0 ? void 0 : options.pfx) || !(options === null || options === void 0 ? void 0 : options.passphrase)) {
                throw new Error("BankId requires the pfx and passphrase in production mode");
            }
        }
        else {
            // Provide default PFX & passphrase in test
            if (this.options.pfx === undefined) {
                this.options.pfx = path.resolve(__dirname, "../cert/", "FPTestcert5_20240610.p12");
            }
            if (this.options.passphrase === undefined) {
                this.options.passphrase = "qwerty123";
            }
        }
        // Provide certificate by default
        if (this.options.ca === undefined) {
            this.options.ca = this.options.production
                ? path.resolve(__dirname, "../cert/", "prod.ca")
                : path.resolve(__dirname, "../cert/", "test.ca");
        }
        this.axios = this.createAxiosInstance();
        return this;
    }
    authenticate(parameters) {
        if (!parameters.endUserIp) {
            throw new Error("Missing required argument endUserIp.");
        }
        if (parameters.userVisibleDataFormat != null &&
            parameters.userVisibleDataFormat !== "simpleMarkdownV1") {
            throw new Error("userVisibleDataFormat can only be simpleMarkdownV1.");
        }
        parameters = {
            ...parameters,
            userVisibleData: parameters.userVisibleData
                ? Buffer.from(parameters.userVisibleData).toString("base64")
                : undefined,
            userNonVisibleData: parameters.userNonVisibleData
                ? Buffer.from(parameters.userNonVisibleData).toString("base64")
                : undefined,
        };
        return __classPrivateFieldGet(this, _BankIdClient_instances, "m", _BankIdClient_call).call(this, BankIdMethod.auth, parameters);
    }
    sign(parameters) {
        if (!parameters.endUserIp || !parameters.userVisibleData) {
            throw new Error("Missing required arguments: endUserIp, userVisibleData.");
        }
        if (parameters.userVisibleDataFormat != null &&
            parameters.userVisibleDataFormat !== "simpleMarkdownV1") {
            throw new Error("userVisibleDataFormat can only be simpleMarkdownV1.");
        }
        parameters = {
            ...parameters,
            userVisibleData: Buffer.from(parameters.userVisibleData).toString("base64"),
            userNonVisibleData: parameters.userNonVisibleData
                ? Buffer.from(parameters.userNonVisibleData).toString("base64")
                : undefined,
        };
        return __classPrivateFieldGet(this, _BankIdClient_instances, "m", _BankIdClient_call).call(this, BankIdMethod.sign, parameters);
    }
    collect(parameters) {
        return __classPrivateFieldGet(this, _BankIdClient_instances, "m", _BankIdClient_call).call(this, BankIdMethod.collect, parameters);
    }
    cancel(parameters) {
        return __classPrivateFieldGet(this, _BankIdClient_instances, "m", _BankIdClient_call).call(this, BankIdMethod.cancel, parameters);
    }
    _awaitPendingCollect(orderRef) {
        console.warn("This method has been renamed to 'awaitPendingCollect");
        return this.awaitPendingCollect(orderRef);
    }
    async authenticateAndCollect(parameters) {
        const authResponse = await this.authenticate(parameters);
        return this.awaitPendingCollect(authResponse.orderRef);
    }
    async signAndCollect(parameters) {
        const signResponse = await this.sign(parameters);
        return this.awaitPendingCollect(signResponse.orderRef);
    }
    awaitPendingCollect(orderRef) {
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                this.collect({ orderRef })
                    .then(response => {
                    if (response.status === "complete") {
                        clearInterval(timer);
                        resolve(response);
                    }
                    else if (response.status === "failed") {
                        clearInterval(timer);
                        reject(response);
                    }
                })
                    .catch(error => {
                    clearInterval(timer);
                    reject(error);
                });
            }, this.options.refreshInterval);
        });
    }
    getHostName() {
        if (this.options.demo) {
            return `https://appapi2.demo.bankid.com/rp/${this.version}/`;
        }
        if (this.options.production) {
            return `https://appapi2.bankid.com/rp/${this.version}/`;
        }
        return `https://appapi2.test.bankid.com/rp/${this.version}/`;
    }
    createAxiosInstance() {
        const baseURL = this.getHostName();
        const ca = Buffer.isBuffer(this.options.ca)
            ? this.options.ca
            : fs.readFileSync(this.options.ca, "utf-8");
        const pfx = Buffer.isBuffer(this.options.pfx)
            ? this.options.pfx
            : fs.readFileSync(this.options.pfx);
        const passphrase = this.options.passphrase;
        return axios_1.default.create({
            baseURL,
            httpsAgent: new https.Agent({ pfx, passphrase, ca }),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
exports.BankIdClient = BankIdClient;
_BankIdClient_instances = new WeakSet(), _BankIdClient_call = function _BankIdClient_call(method, payload) {
    return new Promise((resolve, reject) => {
        this.axios
            .post(method, payload)
            .then(response => {
            resolve(response.data);
        })
            .catch((error) => {
            let thrownError = error;
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    thrownError = new BankIdError(error.response.data.errorCode, error.response.data.details);
                }
                else if (error.request) {
                    thrownError = new RequestError(error.request);
                }
            }
            reject(thrownError);
        });
    });
};
/**
 * A class for creating a BankId Client based on v6.0 api, extending from BankIdClient
 * @see https://www.bankid.com/en/utvecklare/guider/teknisk-integrationsguide/webbservice-api
 */
class BankIdClientV6 extends BankIdClient {
    constructor(options) {
        var _a, _b;
        super(options);
        this.version = "v6.0";
        this.axios = this.createAxiosInstance();
        this.options = {
            // @ts-expect-error this.options not typed after super() call.
            ...this.options,
            qrEnabled: (_a = options.qrEnabled) !== null && _a !== void 0 ? _a : true,
            qrOptions: (_b = options.qrOptions) !== null && _b !== void 0 ? _b : qrgenerator_1.QrGenerator.defaultOptions,
        };
    }
    async authenticate(parameters) {
        const resp = await super.authenticate(parameters);
        const qr = this.options.qrEnabled
            ? new qrgenerator_1.QrGenerator(resp, this.options.qrOptions)
            : undefined;
        return { ...resp, qr };
    }
    async sign(parameters) {
        const resp = await super.sign(parameters);
        const qr = this.options.qrEnabled
            ? new qrgenerator_1.QrGenerator(resp, this.options.qrOptions)
            : undefined;
        return { ...resp, qr };
    }
    async collect(parameters) {
        return super.collect(parameters);
    }
}
exports.BankIdClientV6 = BankIdClientV6;
//# sourceMappingURL=bankid.js.map