import "./style/index.css";
import { ClientApp } from "src/client/ClientApp.tsx";
import { notNil } from "src/logic/Utils.ts";
import { Root, pages } from "src/views/Root.tsx";
import React from "react";

const app = new ClientApp({
  onServerSideProps: (location, props) => {},
  rootEl: notNil(document.getElementById("root")),
  Root: Root,
  pages,
});

// TODO: handle error
app.hydrate().catch(console.error);
