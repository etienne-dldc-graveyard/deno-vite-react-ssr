import React from "react";
import { hydrate } from "react-dom";
import { notNil } from "src/logic/Utils.ts";
import type { Pages } from "~pages";
import { pagesToRoutes, Route } from "src/logic/Route.ts";
import { restore } from "zenjson";
import { ClientRouter, OnServerSideProps } from "./ClientRouter.tsx";
import { getBridgeData, Render } from "src/logic/Bridge.ts";

export type ClientAppOptions = {
  rootEl: HTMLElement;
  onServerSideProps?: OnServerSideProps;
  render: Render;
  pages: Pages;
};

export class ClientApp {
  private readonly router: ClientRouter;
  private readonly bridge = getBridgeData();
  private readonly routes: Route[];
  private readonly rootEl: HTMLElement;
  private readonly render: Render;

  constructor({ onServerSideProps, rootEl, render, pages }: ClientAppOptions) {
    this.router = new ClientRouter({ onServerSideProps });
    this.rootEl = rootEl;
    this.render = render;
    this.routes = pagesToRoutes(pages);
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
