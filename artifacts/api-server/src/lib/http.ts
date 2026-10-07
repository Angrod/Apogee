import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ZodType, ZodTypeDef } from "zod";
import { logger } from "./logger";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found`);
export const badRequest = (message: string, details?: string[]) =>
  new HttpError(400, message, details);

// Validate untrusted input against a schema generated from openapi.yaml.
export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw badRequest(
      "Invalid request",
      result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)),
    );
  }
  return result.data;
}

// Postgres foreign_key_violation; drizzle wraps the driver error in `cause`.
export function isForeignKeyViolation(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23503";
}

export const apiNotFound: RequestHandler = (_req, _res, next) => {
  next(notFound("Route"));
};

// Every API error is JSON. Unexpected errors are logged, never sent to the client.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // express.json() rejects malformed bodies with a SyntaxError carrying status 400.
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  (req.log ?? logger).error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
