import { ContextSendOptions } from "oak/mod.ts";
import { Middleware } from "../types.ts";

export function Static(options: ContextSendOptions): Middleware {
  return (ctx, _next) => {
    return ctx.send(options);
  };
}
