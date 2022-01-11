import "./style/index.css";
import React from "react";
import ReactDOM from "react-dom";
import pages from "~pages";
import { pagesToRoutes } from "src/logic/Route.ts";
import { createBrowserHistory } from "history";
import { restore } from "zenjson";
import { getBridgeData } from "src/logic/Bridge.ts";
import { notNil } from "src/logic/Utils.ts";

main().catch(console.error);

async function main() {
  const routes = pagesToRoutes(pages);

  const bridge = getBridgeData();
  const history = createBrowserHistory();

  const rootEl = notNil(document.getElementById("root"));
  const route = notNil(routes.find((r) => r.id === bridge.route));
  const params = restore(bridge.params);

  const module = await route.module();
  const PageComponent = module.default;

  const restoredProps = restore(bridge.props);
  ReactDOM.hydrate(
    <React.StrictMode>
      <PageComponent {...restoredProps} />
    </React.StrictMode>,
    rootEl
  );
}
