import React from "react";
import { Router } from "src/logic/Router.ts";
import { RouterContext } from "src/hooks/useRouter.ts";

type Props = {
  router: Router;
  children: React.ReactNode;
};

export function Root({ children, router }: Props): JSX.Element {
  return (
    <React.StrictMode>
      <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
    </React.StrictMode>
  );
}
