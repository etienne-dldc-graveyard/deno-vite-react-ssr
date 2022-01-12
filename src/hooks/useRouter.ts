// deno-lint-ignore-file no-explicit-any
import { createContext, useContext } from "react";
import { Router } from "src/logic/Router.ts";
import { notNil } from "src/logic/Utils.ts";

export const RouterContext = createContext<Router>(null as any);

export function useRouter(): Router {
  return notNil(useContext(RouterContext));
}
