import React from "react";
import { GetServerSideProps } from "entx";

type Props = {
  now: Date;
};

export const getServerSideProps: GetServerSideProps<Props> = () => {
  return {
    props: { now: new Date() },
  };
};

export default function Hello({ now }: Props) {
  return <div>Youpi: {now.getTime()}</div>;
}
