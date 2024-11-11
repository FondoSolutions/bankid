/// <reference types="node" />
import type { AxiosInstance } from "axios";
import { QrGenerator, QrGeneratorOptions } from "./qrgenerator";
export interface AuthRequestV5 {
    endUserIp: string;
    personalNumber?: string;
    requirement?: AuthOptionalRequirements;
    userVisibleData?: string;
    userVisibleDataFormat?: "simpleMarkdownV1";
    userNonVisibleData?: string;
}
export interface AuthResponse {
    /**
     * Use in deeplink to start BankId on same device.
     * @example `bankid:///?autostarttoken=[TOKEN]&redirect=[RETURNURL]`
     */
    autoStartToken: string;
    qrStartSecret: string;
    qrStartToken: string;
    orderRef: string;
}
interface AuthOptionalRequirements {
    cardReader?: "class1" | "class2";
    certificatePolicies?: string[];
    issuerCn?: string[];
    autoStartTokenRequired?: boolean;
    allowFingerprint?: boolean;
}
export interface SignRequest extends AuthRequestV5 {
    userVisibleData: string;
}
export interface SignResponse extends AuthResponse {
}
export interface CollectRequest {
    orderRef: string;
}
type CollectResponse = CollectResponseV5 | CollectResponseV6;
export interface CollectResponseV5 {
    orderRef: string;
    status: "pending" | "failed" | "complete";
    hintCode?: FailedHintCode | PendingHintCode;
    completionData?: CompletionData;
}
export interface CompletionData {
    user: {
        personalNumber: string;
        name: string;
        givenName: string;
        surname: string;
    };
    device: {
        ipAddress: string;
    };
    cert: {
        notBefore: string;
        notAfter: string;
    };
    signature: string;
    ocspResponse: string;
}
export type FailedHintCode = "expiredTransaction" | "certificateErr" | "userCancel" | "cancelled" | "startFailed";
export type PendingHintCode = "outstandingTransaction" | "noClient" | "started" | "userSign";
export interface CancelRequest extends CollectRequest {
}
export interface CancelResponse {
}
export interface ErrorResponse {
    errorCode: BankIdErrorCode;
    details: string;
}
export declare enum BankIdErrorCode {
    ALREADY_IN_PROGRESS = "alreadyInProgress",
    INVALID_PARAMETERS = "invalidParameters",
    UNAUTHORIZED = "unauthorized",
    NOT_FOUND = "notFound",
    METHOD_NOT_ALLOWED = "methodNotAllowed",
    REQUEST_TIMEOUT = "requestTimeout",
    UNSUPPORTED_MEDIA_TYPE = "unsupportedMediaType",
    INTERNAL_ERROR = "internalError",
    MAINTENANCE = "maintenance"
}
export declare const REQUEST_FAILED_ERROR = "BANKID_NO_RESPONSE";
export declare enum BankIdMethod {
    auth = "auth",
    sign = "sign",
    collect = "collect",
    cancel = "cancel"
}
export type BankIdRequest = AuthRequestV5 | SignRequest | CollectRequest | CancelRequest;
export type BankIdResponse = CancelResponse | AuthResponse | SignResponse | CollectResponseV5 | CollectResponseV6;
interface BankIdClientSettings {
    demo: boolean;
    production: boolean;
    refreshInterval?: number;
    pfx?: string | Buffer;
    passphrase?: string;
    ca?: string | Buffer;
}
export declare class BankIdError extends Error {
    readonly code: BankIdErrorCode;
    readonly details?: string;
    constructor(code: BankIdErrorCode, details?: string);
}
export declare class RequestError extends Error {
    readonly request?: any;
    constructor(request?: any);
}
export declare class BankIdClient {
    #private;
    readonly options: Required<BankIdClientSettings>;
    axios: AxiosInstance;
    version: string;
    constructor(options?: BankIdClientSettings);
    authenticate(parameters: AuthRequestV5): Promise<AuthResponse>;
    sign(parameters: SignRequest): Promise<SignResponse>;
    collect(parameters: CollectRequest): Promise<CollectResponse>;
    cancel(parameters: CollectRequest): Promise<CancelResponse>;
    _awaitPendingCollect(orderRef: string): Promise<CollectResponse>;
    authenticateAndCollect(parameters: AuthRequestV5): Promise<CollectResponse>;
    signAndCollect(parameters: SignRequest): Promise<CollectResponse>;
    awaitPendingCollect(orderRef: string): Promise<CollectResponse>;
    getHostName(): string;
    createAxiosInstance(): AxiosInstance;
}
interface AuthOptionalRequirementsV6 {
    pinCode: boolean;
    cardReader?: "class1" | "class2";
    mrtd: boolean;
    certificatePolicies?: string[];
    personalNumber: string;
}
export interface AuthRequestV6 {
    endUserIp: string;
    requirement?: AuthOptionalRequirementsV6;
}
interface AuthResponseV6 extends AuthResponse {
    qr?: QrGenerator;
}
interface SignResponseV6 extends SignResponse {
    qr?: QrGenerator;
}
export interface CompletionDataV6 {
    user: {
        personalNumber: string;
        name: string;
        givenName: string;
        surname: string;
    };
    device: {
        ipAddress: string;
        uhi?: string;
    };
    /** ISO 8601 date format YYYY-MM-DD with a UTC time zone offset. */
    bankIdIssueDate: string;
    stepUp: boolean;
    signature: string;
    ocspResponse: string;
}
export interface CollectResponseV6 extends Omit<CollectResponseV5, "completionData"> {
    completionData?: CompletionDataV6;
}
interface BankIdClientSettingsV6 extends BankIdClientSettings {
    /** Controls whether to attach an instance of {@link QrGenerator} to BankID responses  */
    qrEnabled?: boolean;
    qrOptions?: QrGeneratorOptions;
}
/**
 * A class for creating a BankId Client based on v6.0 api, extending from BankIdClient
 * @see https://www.bankid.com/en/utvecklare/guider/teknisk-integrationsguide/webbservice-api
 */
export declare class BankIdClientV6 extends BankIdClient {
    version: string;
    options: Required<BankIdClientSettingsV6>;
    constructor(options: BankIdClientSettingsV6);
    authenticate(parameters: AuthRequestV6): Promise<AuthResponseV6>;
    sign(parameters: SignRequest): Promise<SignResponseV6>;
    collect(parameters: CollectRequest): Promise<CollectResponseV6>;
}
export {};
