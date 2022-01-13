import React from "react";
import { hydrate } from "react-dom";
import { notNil } from "src/logic/Utils.ts";
import pages from "~pages";
import { pagesToRoutes } from "src/logic/Route.ts";
import { restore } from "zenjson";
import { ClientRouter, OnServerSideProps } from "./ClientRouter.tsx";
import { getBridgeData, Render } from "src/logic/Bridge.ts";

export type ClientAppOptions = {
  rootEl: HTMLElement;
  onServerSideProps?: OnServerSideProps;
  render: Render;
};

export class ClientApp {
  private readonly router: ClientRouter;
  private readonly bridge = getBridgeData();
  private readonly routes = pagesToRoutes(pages);
  private readonly rootEl: HTMLElement;
  private readonly render: Render;

  constructor({ onServerSideProps, rootEl, render }: ClientAppOptions) {
    this.router = new ClientRouter({ onServerSideProps });
    this.rootEl = rootEl;
    this.render = render;
  }

  async hydrate() {
    const route = notNil(this.routes.find((r) => r.id === this.bridge.route));
    const params = restore(this.bridge.params);

    const module = await route.module();
    const PageComponent = module.default;

    const restoredProps = restore(this.bridge.props);

    hydrate(
      this.render(this.router, PageComponent, restoredProps),
      this.rootEl
    );
  }
}
