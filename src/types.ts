import * as oak from "oak/mod.ts";
import { RouterContext } from "./router/Router.ts";

export type State = {
  router: RouterContext | null;
  // database: typeof import("./database.ts");
  // database: any;
};

export type Context = oak.Context<State>;

export type Middleware = oak.Middleware<State, Context>;
