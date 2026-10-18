import type { ErrorResponse } from './types';

/** Backend error codes (from api/errors.py). */
export type ApiErrorCode =
  | 'STOP_NOT_FOUND'
  | 'ROUTE_NOT_FOUND'
  | 'INVALID_PARAMETER'
  | 'INVALID_COORDINATES'
  | 'INVALID_RADIUS'
  | 'INVALID_DATE'
  | 'DATA_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** Error from the API server (non-2xx with a parseable body). */
export class ApiError extends Error {
  readonly httpStatus: number;
  readonly code: ApiErrorCode | string;
  readonly details?: unknown;

  constructor(httpStatus: number, code: ApiErrorCode | string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
  }
}

/** Network-level failure (no response, DNS, timeout, etc.). */
export class NetworkError extends Error {
  readonly kind: 'network' | 'timeout';

  constructor(kind: 'network' | 'timeout', message: string) {
    super(message);
    this.name = 'NetworkError';
    this.kind = kind;
  }
}

/** Response body could not be parsed as JSON or did not match expected shape. */
export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

/** Parse a non-2xx Response into an ApiError, preserving backend codes. */
export async function parseApiError(response: Response): Promise<ApiError> {
  const httpStatus = response.status;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiError(httpStatus, 'INTERNAL_ERROR', `HTTP ${httpStatus}`);
  }

  const errorResponse = body as ErrorResponse | undefined;
  if (errorResponse?.error?.code && errorResponse?.error?.message) {
    return new ApiError(
      httpStatus,
      errorResponse.error.code,
      errorResponse.error.message,
    );
  }

  return new ApiError(httpStatus, 'INTERNAL_ERROR', `HTTP ${httpStatus}`);
}