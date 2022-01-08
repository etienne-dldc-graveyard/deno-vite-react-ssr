import { isHttpError, Status } from "oak/mod.ts";
import { Middleware } from "../types.ts";

export function ErrorToJson(path: string): Middleware {
  return async (ctx, next) => {
    if (!ctx.request.url.pathname.startsWith(path)) {
      return next();
    }
    try {
      ctx.response.headers.set("Content-Type", "json");
      await next();
    } catch (error) {
      if (isHttpError(error)) {
        ctx.response.status = error.status;
        ctx.response.body = {
          status: error.status,
          message: error.message,
        };
        return;
      }
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        status: Status.InternalServerError,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
