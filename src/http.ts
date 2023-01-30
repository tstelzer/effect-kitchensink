/* eslint-disable @typescript-eslint/no-empty-interface */
import * as E from '@effect/io/Effect';
import {pipe} from '@fp-ts/core/Function';
import * as Data from '@fp-ts/data/Data';
import type {RequestInfo, RequestInit, Response} from 'undici';

import {rootKey} from './constants.js';

// node typescript types are missing fetch, even though it is part of the runtime already
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
declare function fetch(
    input: RequestInfo,
    init?: RequestInit,
): Promise<Response>;

// =============================================================================
// Error
// =============================================================================

export type HttpErrorT<T extends string> = Data.Case & {
    _tag: T;
    statusText: string;
    status: number;
    body: string;
};

function createTagged<T extends Data.Case & {_tag: string}>(tag: T['_tag']) {
    return {
        create: Data.tagged<T>(tag),
        tag,
    };
}
export interface BadRequestError
    extends HttpErrorT<typeof BadRequestErrorTag> {}

const BadRequestErrorTag = `${rootKey}/http/BadRequestError` as const;
export const BadRequestError =
    createTagged<BadRequestError>(BadRequestErrorTag);

export interface UnauthorizedError
    extends HttpErrorT<typeof UnauthorizedErrorTag> {}
const UnauthorizedErrorTag = `${rootKey}/http/UnauthorizedError` as const;
export const UnauthorizedError =
    createTagged<UnauthorizedError>(UnauthorizedErrorTag);

export interface PaymentRequiredError
    extends HttpErrorT<typeof PaymentRequiredErrorTag> {}
const PaymentRequiredErrorTag = `${rootKey}/http/PaymentRequiredError` as const;
export const PaymentRequiredError = createTagged<PaymentRequiredError>(
    PaymentRequiredErrorTag,
);

export interface ForbiddenError extends HttpErrorT<typeof ForbiddenErrorTag> {}
const ForbiddenErrorTag = `${rootKey}/http/ForbiddenError` as const;
export const ForbiddenError = createTagged<ForbiddenError>(ForbiddenErrorTag);

export interface NotFoundError extends HttpErrorT<typeof NotFoundErrorTag> {}
const NotFoundErrorTag = `${rootKey}/http/NotFoundError` as const;
export const NotFoundError = createTagged<NotFoundError>(NotFoundErrorTag);

export interface MethodNotAllowedError
    extends HttpErrorT<typeof MethodNotAllowedErrorTag> {}
const MethodNotAllowedErrorTag =
    `${rootKey}/http/MethodNotAllowedError` as const;
export const MethodNotAllowedError = createTagged<MethodNotAllowedError>(
    MethodNotAllowedErrorTag,
);

export interface NotAcceptableError
    extends HttpErrorT<typeof NotAcceptableErrorTag> {}
const NotAcceptableErrorTag = `${rootKey}/http/NotAcceptableError` as const;
export const NotAcceptableError = createTagged<NotAcceptableError>(
    NotAcceptableErrorTag,
);

export interface ProxyAuthenticationRequiredError
    extends HttpErrorT<typeof ProxyAuthenticationRequiredErrorTag> {}
const ProxyAuthenticationRequiredErrorTag =
    `${rootKey}/http/ProxyAuthenticationRequiredError` as const;
export const ProxyAuthenticationRequiredError =
    createTagged<ProxyAuthenticationRequiredError>(
        ProxyAuthenticationRequiredErrorTag,
    );

export interface RequestTimeoutError
    extends HttpErrorT<typeof RequestTimeoutErrorTag> {}
const RequestTimeoutErrorTag = `${rootKey}/http/RequestTimeoutError` as const;
export const RequestTimeoutError = createTagged<RequestTimeoutError>(
    RequestTimeoutErrorTag,
);

export interface ConflictError extends HttpErrorT<typeof ConflictErrorTag> {}
const ConflictErrorTag = `${rootKey}/http/ConflictError` as const;
export const ConflictError = createTagged<ConflictError>(ConflictErrorTag);

export interface GoneError extends HttpErrorT<typeof GoneErrorTag> {}
const GoneErrorTag = `${rootKey}/http/GoneError` as const;
export const GoneError = createTagged<GoneError>(GoneErrorTag);

export interface PayloadTooLargeError
    extends HttpErrorT<typeof PayloadTooLargeErrorTag> {}
const PayloadTooLargeErrorTag = `${rootKey}/http/PayloadTooLargeError` as const;
export const PayloadTooLargeError = createTagged<PayloadTooLargeError>(
    PayloadTooLargeErrorTag,
);

export interface TooManyRequestsError
    extends HttpErrorT<typeof TooManyRequestsErrorTag> {}
const TooManyRequestsErrorTag = `${rootKey}/http/TooManyRequestsError` as const;
export const TooManyRequestsError = createTagged<TooManyRequestsError>(
    TooManyRequestsErrorTag,
);

export interface InternalServerError
    extends HttpErrorT<typeof InternalServerErrorTag> {}
const InternalServerErrorTag = `${rootKey}/http/InternalServerError` as const;
export const InternalServerError = createTagged<InternalServerError>(
    InternalServerErrorTag,
);

export interface NotImplementedError
    extends HttpErrorT<typeof NotImplementedErrorTag> {}
const NotImplementedErrorTag = `${rootKey}/http/NotImplementedError` as const;
export const NotImplementedError = createTagged<NotImplementedError>(
    NotImplementedErrorTag,
);

export interface BadGatewayError
    extends HttpErrorT<typeof BadGatewayErrorTag> {}
const BadGatewayErrorTag = `${rootKey}/http/BadGatewayError` as const;
export const BadGatewayError =
    createTagged<BadGatewayError>(BadGatewayErrorTag);

export interface ServiceUnavailableError
    extends HttpErrorT<typeof ServiceUnavailableErrorTag> {}
const ServiceUnavailableErrorTag =
    `${rootKey}/http/ServiceUnavailableError` as const;
export const ServiceUnavailableError = createTagged<ServiceUnavailableError>(
    ServiceUnavailableErrorTag,
);

export interface GatewayTimeoutError
    extends HttpErrorT<typeof GatewayTimeoutErrorTag> {}
const GatewayTimeoutErrorTag = `${rootKey}/http/GatewayTimeoutError` as const;
export const GatewayTimeoutError = createTagged<GatewayTimeoutError>(
    GatewayTimeoutErrorTag,
);

export interface UnknownError extends HttpErrorT<typeof UnknownErrorTag> {}
const UnknownErrorTag = `${rootKey}/http/UnknownError` as const;
export const UnknownError = createTagged<UnknownError>(UnknownErrorTag);

export interface NetworkError extends Data.Case {
    _tag: typeof NetworkErrorTag;
    error: unknown;
}
const NetworkErrorTag = `${rootKey}/http/NetworkError` as const;
export const NetworkError = Data.tagged<NetworkError>(NetworkErrorTag);

export type HttpError =
    | BadRequestError
    | UnauthorizedError
    | PaymentRequiredError
    | ForbiddenError
    | NotFoundError
    | MethodNotAllowedError
    | NotAcceptableError
    | ProxyAuthenticationRequiredError
    | RequestTimeoutError
    | ConflictError
    | GoneError
    | PayloadTooLargeError
    | TooManyRequestsError
    | InternalServerError
    | NotImplementedError
    | BadGatewayError
    | ServiceUnavailableError
    | GatewayTimeoutError
    | UnknownError;

// =============================================================================
// Util
// =============================================================================

type Data = {status: number; data: unknown};

/**
 * Wrapper around native `fetch`, defaulting to unwrapping JSON, and mapping to
 * Effect with tagged Errors.
 */
export function fetchJson(
    input: RequestInfo,
    options?: RequestInit,
): E.Effect<unknown, HttpError | NetworkError, Data> {
    return pipe(
        E.tryPromise(() => fetch(input, options)),
        E.catchAll(error => E.fail(NetworkError({error}))),
        E.flatMap<Response, unknown, HttpError, Data>(response => {
            const {ok, statusText, status} = response;

            if (ok && status >= 200 && status <= 299) {
                return E.promise(() =>
                    response.json().then(data => ({data, status})),
                );
            }

            if (ok && status >= 300 && status <= 399) {
                return E.succeed({status, data: undefined});
            }

            return pipe(
                E.promise(() => response.text()),
                E.flatMap<string, unknown, HttpError, never>(body => {
                    const r = {statusText, status, body};
                    switch (status) {
                        case 400:
                            return E.fail(BadRequestError.create(r));
                        case 401:
                            return E.fail(UnauthorizedError.create(r));
                        case 402:
                            return E.fail(PaymentRequiredError.create(r));
                        case 403:
                            return E.fail(ForbiddenError.create(r));
                        case 404:
                            return E.fail(NotFoundError.create(r));
                        case 405:
                            return E.fail(MethodNotAllowedError.create(r));
                        case 406:
                            return E.fail(NotAcceptableError.create(r));
                        case 407:
                            return E.fail(
                                ProxyAuthenticationRequiredError.create(r),
                            );
                        case 408:
                            return E.fail(RequestTimeoutError.create(r));
                        case 409:
                            return E.fail(ConflictError.create(r));
                        case 410:
                            return E.fail(GoneError.create(r));
                        case 413:
                            return E.fail(PayloadTooLargeError.create(r));
                        case 429:
                            return E.fail(TooManyRequestsError.create(r));
                        case 500:
                            return E.fail(InternalServerError.create(r));
                        case 501:
                            return E.fail(NotImplementedError.create(r));
                        case 502:
                            return E.fail(BadGatewayError.create(r));
                        case 503:
                            return E.fail(ServiceUnavailableError.create(r));
                        case 504:
                            return E.fail(GatewayTimeoutError.create(r));
                        default:
                            return E.die(UnknownError.create(r));
                    }
                }),
            );
        }),
    );
}
