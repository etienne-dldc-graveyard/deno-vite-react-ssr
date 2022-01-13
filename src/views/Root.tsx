/**
 * This file is the entry point of the Vite SSR build
 */
import React, { useState } from "react";
import { Router } from "src/logic/Router.ts";
import { RouterContext } from "src/hooks/useRouter.ts";
import { useIsomorphicLayoutEffect } from "src/hooks/useIsomorphicLayoutEffect.ts";
import { ActiveRoute } from "src/logic/Router.ts";
import pages from "~pages";

// export to make them available on the ssr build
export { pages };

type Props = {
  router: Router;
};

export function Root({ router }: Props): JSX.Element {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>(
    () => router.route
  );

  useIsomorphicLayoutEffect(() => {
    return router.subscribe(setActiveRoute);
  }, []);

  const { Component, props } = activeRoute;

  return (
    <React.StrictMode>
      <RouterContext.Provider value={router}>
        <Component {...props} />
      </RouterContext.Provider>
    </React.StrictMode>
  );
}
