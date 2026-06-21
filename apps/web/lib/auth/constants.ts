export const ACCESS_TOKEN_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? 'storix_access_token';
export const REFRESH_TOKEN_COOKIE = process.env.REFRESH_TOKEN_COOKIE ?? 'storix_refresh_token';

/** Matches API JWT_EXPIRES_IN default (15m). */
export const ACCESS_TOKEN_MAX_AGE = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

/** Cookie name the NestJS API expects when forwarding refresh requests. */
export const API_REFRESH_COOKIE = 'refresh_token';

/** Set by middleware after refresh; stripped from incoming client requests. */
export const INTERNAL_ACCESS_TOKEN_HEADER = 'x-valid-access-token';
