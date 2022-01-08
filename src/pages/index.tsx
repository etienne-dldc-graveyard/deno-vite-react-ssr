import React from "react";
import { SSROptions } from "~pages";

type Props = {
  now: Date;
};

export const ssr: SSROptions<Props> = {
  props() {
    return {
      props: {
        now: new Date(),
      },
    };
  },
};

export default function Home({ now }: Props) {
  return <div>Homepage: {now.toDateString()}</div>;
}
