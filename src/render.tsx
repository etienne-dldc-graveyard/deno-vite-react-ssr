// deno-lint-ignore-file no-explicit-any
import "raf/polyfill";
import React from "react";
import ReactDOMServer from "react-dom/server";
import pages from "~pages";
import { Router } from "src/logic/Router.ts";
import { Root } from "src/views/Root.tsx";

export { pages };

export function render(
  router: Router,
  Component: React.ComponentType<any>,
  props: any
): string {
  return ReactDOMServer.renderToString(
    <Root router={router}>
      <Component {...props} />
    </Root>
  );
}
