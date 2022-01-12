import { createBrowserHistory } from "history";
import React from "react";
import { hydrate } from "react-dom";
import { notNil } from "./Utils.ts";
import pages from "~pages";
import { pagesToRoutes } from "./Route.ts";
import { restore } from "zenjson";
import { Root } from "../views/Root.tsx";
import { ClientRouter } from "./ClientRouter.tsx";
import { getBridgeData } from "./Bridge.ts";

class ClientApp {
  private readonly router = new ClientRouter();
  private readonly bridge = getBridgeData();
  private readonly routes = pagesToRoutes(pages);

  async hydrate(rootEl: HTMLElement) {
    const route = notNil(this.routes.find((r) => r.id === this.bridge.route));
    const params = restore(this.bridge.params);

    const module = await route.module();
    const PageComponent = module.default;

    const restoredProps = restore(this.bridge.props);

    hydrate(
      <Root router={this.router}>
        <PageComponent {...restoredProps} />
      </Root>,
      rootEl
    );
  }
}

export const clientApp = new ClientApp();
