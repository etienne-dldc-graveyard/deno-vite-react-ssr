import { Pages } from "entx";

const pages: Pages = [
  {
    path: "404.tsx",
    module: () => import("./pages/404.tsx"),
  },
  { path: "demo/hello.tsx", module: () => import("./pages/demo/hello.tsx") },
  { path: "index.tsx", module: () => import("./pages/index.tsx") },
  {
    path: "post/[...slug].tsx",
    module: () => import("./pages/post/[...slug].tsx"),
  },
  { path: "post/[pid].tsx", module: () => import("./pages/post/[pid].tsx") },
  { path: "post/create.tsx", module: () => import("./pages/post/create.tsx") },
  { path: "post/index.tsx", module: () => import("./pages/post/index.tsx") },
];

export default pages;
