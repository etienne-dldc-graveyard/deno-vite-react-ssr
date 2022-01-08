import React from "react";
import { SSROptions } from "~pages";

type Params = {
  pid: string;
};

type Props = {
  pid: string;
};

export const ssr: SSROptions<Props, Params> = {
  props({ query }) {
    return {
      props: {
        pid: query.pid,
      },
    };
  },
};

export default function PostByPid({ pid }: Props) {
  return <div>/post/[pid] : {pid}</div>;
}
