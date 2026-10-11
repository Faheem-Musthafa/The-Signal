import type { Instrumentation } from "next";

// Called by Next.js for every uncaught server error (RSC render, route handler,
// server action, proxy). This is the single hook to forward errors to Sentry or
// another error tracker; for now it emits one structured JSON line for log drains.
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const digest =
    typeof (error as { digest?: unknown })?.digest === "string"
      ? (error as { digest: string }).digest
      : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      message: err.message,
      name: err.name,
      digest,
      path: request.path,
      method: request.method,
      routeType: context.routeType,
      routePath: context.routePath,
      routerKind: context.routerKind,
      renderSource: context.renderSource,
      timestamp: new Date().toISOString(),
    }),
  );
};
