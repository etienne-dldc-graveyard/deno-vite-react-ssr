import React from "react";
import { GetServerSideProps } from "~pages";

type Props = {
  now: Date;
};

export const getServerSideProps: GetServerSideProps<Props> = () => {
  return {
    props: { now: new Date() },
  };
};

export default function Home({ now }: Props) {
  return <div>Homepage: {now.toDateString()} YAY</div>;
}
