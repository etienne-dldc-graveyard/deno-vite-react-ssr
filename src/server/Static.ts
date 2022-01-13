import { Status, ContextSendOptions } from "oak/mod.ts";
import { Chemin, CheminParam as P } from "chemin";
import { notNil } from "src/logic/Utils.ts";
import { Middleware } from "src/server/types.ts";

export const STATIC_PATH = Chemin.create(P.multiple(P.string("path")));

export function Static(options: ContextSendOptions): Middleware {
  return async (ctx) => {
    const router = notNil(ctx.state.router);
    const { path } = router.getOrFail(STATIC_PATH);
    await ctx.send({
      path: path.join("/"),
      ...options,
    });
    if (ctx.response.status === Status.NotFound) {
      return router.didNotMatch();
    }
    return;
  };
}
