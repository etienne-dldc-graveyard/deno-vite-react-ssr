import React from "react";
import { GetServerSideProps } from "entx";

type Params = {
  pid: string;
};

type Props = {
  pid: string;
};

export const getServerSideProps: GetServerSideProps<Props, Params> = ({
  query,
}) => {
  return {
    props: {
      pid: query.pid,
    },
  };
};

export default function PostByPid({ pid }: Props) {
  return <div>/post/[pid] : {pid}</div>;
}
