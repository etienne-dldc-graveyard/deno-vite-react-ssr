import "./style/index.css";
import { ClientApp } from "entx";
import { notNil } from "src/logic/Utils.ts";
import pages from "./pages.ts";

const app = new ClientApp({
  onServerSideProps: (location, props) => {},
  rootEl: notNil(document.getElementById("root")),
  pages,
});

// TODO: handle error
app.hydrate().catch(console.error);
