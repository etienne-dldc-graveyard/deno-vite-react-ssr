// deno-lint-ignore-file no-explicit-any
import "raf/polyfill";
import React from "react";
import ReactDOMServer from "react-dom/server";
import pages from "~pages";

export { pages };

export function render(
  Component: React.ComponentType<any>,
  props: any
): string {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <Component {...props} />
    </React.StrictMode>
  );
}
