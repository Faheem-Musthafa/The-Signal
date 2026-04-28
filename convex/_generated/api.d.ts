/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as digests from "../digests.js";
import type * as internal_cleanup from "../internal/cleanup.js";
import type * as internal_subscribers from "../internal/subscribers.js";
import type * as lib_emailTemplate from "../lib/emailTemplate.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_resend from "../lib/resend.js";
import type * as lib_unsubToken from "../lib/unsubToken.js";
import type * as rateLimits from "../rateLimits.js";
import type * as subscribers from "../subscribers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  digests: typeof digests;
  "internal/cleanup": typeof internal_cleanup;
  "internal/subscribers": typeof internal_subscribers;
  "lib/emailTemplate": typeof lib_emailTemplate;
  "lib/llm": typeof lib_llm;
  "lib/resend": typeof lib_resend;
  "lib/unsubToken": typeof lib_unsubToken;
  rateLimits: typeof rateLimits;
  subscribers: typeof subscribers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
