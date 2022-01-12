import "./style/index.css";
import { clientApp } from "src/logic/ClientApp.tsx";
import { notNil } from "src/logic/Utils.ts";

// TODO: handle error
clientApp.hydrate(notNil(document.getElementById("root"))).catch(console.error);
