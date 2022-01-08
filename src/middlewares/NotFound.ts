import { httpErrors } from "oak/mod.ts";
import { Middleware } from "../types.ts";

export const NotFound: Middleware = () => {
  throw new httpErrors.NotFound();
};
