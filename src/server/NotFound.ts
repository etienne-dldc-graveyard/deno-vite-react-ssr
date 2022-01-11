import { httpErrors } from "oak/mod.ts";
import { Middleware } from "src/server/types.ts";

export const NotFound: Middleware = () => {
  throw new httpErrors.NotFound();
};
