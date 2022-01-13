import "./style/index.css";
import { ClientApp } from "src/client/ClientApp.tsx";
import { notNil } from "src/logic/Utils.ts";
import { render, pages } from "./render.tsx";

const app = new ClientApp({
  onServerSideProps: (location, props) => {},
  rootEl: notNil(document.getElementById("root")),
  render,
  pages,
});

// TODO: handle error
app.hydrate().catch(console.error);
