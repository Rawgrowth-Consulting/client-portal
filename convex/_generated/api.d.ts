/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityFeed from "../activityFeed.js";
import type * as apiIntegrations from "../apiIntegrations.js";
import type * as brandIntake from "../brandIntake.js";
import type * as brandProfile from "../brandProfile.js";
import type * as clients from "../clients.js";
import type * as deliverables from "../deliverables.js";
import type * as documents from "../documents.js";
import type * as magicLinks from "../magicLinks.js";
import type * as onboardingSteps from "../onboardingSteps.js";
import type * as resources from "../resources.js";
import type * as scheduledCalls from "../scheduledCalls.js";
import type * as softwareAccess from "../softwareAccess.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityFeed: typeof activityFeed;
  apiIntegrations: typeof apiIntegrations;
  brandIntake: typeof brandIntake;
  brandProfile: typeof brandProfile;
  clients: typeof clients;
  deliverables: typeof deliverables;
  documents: typeof documents;
  magicLinks: typeof magicLinks;
  onboardingSteps: typeof onboardingSteps;
  resources: typeof resources;
  scheduledCalls: typeof scheduledCalls;
  softwareAccess: typeof softwareAccess;
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
