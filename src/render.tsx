import React from "react";
import { Render } from "src/logic/Bridge.ts";
import { Root } from "./views/Root.tsx";

export const render: Render = (router, Component, props) => {
  return (
    <Root router={router}>
      <Component {...props} />
    </Root>
  );
};
