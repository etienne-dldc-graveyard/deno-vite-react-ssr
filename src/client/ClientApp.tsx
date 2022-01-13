import type { Pages } from "~pages";
import React from "react";
import { hydrate } from "react-dom";
import { ClientRouter, OnServerSideProps } from "./ClientRouter.tsx";
import { getBridgeData } from "src/logic/Bridge.ts";
import { Router } from "../logic/Router.ts";

export type ClientAppOptions = {
  rootEl: HTMLElement;
  onServerSideProps?: OnServerSideProps;
  Root: React.ComponentType<{ router: Router }>;
  pages: Pages;
};

export class ClientApp {
  private readonly router: ClientRouter;
  private readonly bridge = getBridgeData();
  private readonly rootEl: HTMLElement;
  private readonly Root: React.ComponentType<{ router: Router }>;

  constructor({ onServerSideProps, rootEl, Root, pages }: ClientAppOptions) {
    this.router = new ClientRouter({ onServerSideProps, pages });
    this.rootEl = rootEl;
    this.Root = Root;
  }

  async hydrate() {
    await this.router.initialize(
      this.bridge.routeId,
      this.bridge.location,
      this.bridge.isNotFound,
      this.bridge.params,
      this.bridge.props
    );
    const Root = this.Root;

    hydrate(<Root router={this.router} />, this.rootEl);
  }
}
