// deno-lint-ignore-file ban-types
import * as oak from "oak/mod.ts";

export type State = {
  // database: typeof import("./database.ts");
  // database: any;
};

export type Context = oak.Context<State>;

export type Middleware = oak.Middleware<State, Context>;
