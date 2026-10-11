/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../../convex/schema";

// Every Convex module (including _generated) so convex-test can resolve function references.
export const modules = import.meta.glob("../../convex/**/*.*s");

export function makeTest() {
  return convexTest(schema, modules);
}
