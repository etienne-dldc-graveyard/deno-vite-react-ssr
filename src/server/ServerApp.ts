// deno-lint-ignore-file no-explicit-any
import { Render } from "../logic/Bridge.ts";
import ReactDOMServer from "react-dom/server";
import { Router } from "../logic/Router.ts";

export type ServerAppOptions = {
  render: Render;
};

export class ServerApp {
  private readonly render: Render;

  constructor({ render }: ServerAppOptions) {
    this.render = render;
  }

  renderToString(
    router: Router,
    Component: React.ComponentType<any>,
    props: any
  ) {
    return ReactDOMServer.renderToString(this.render(router, Component, props));
  }
}
