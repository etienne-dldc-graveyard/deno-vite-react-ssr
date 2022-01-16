import React from "react";
import { GetServerSideProps, useCreateLinkProps } from "entx";

type Props = {
  now: Date;
};

export const getServerSideProps: GetServerSideProps<Props> = () => {
  return {
    props: { now: new Date() },
  };
};

export default function Home({ now }: Props) {
  const clp = useCreateLinkProps();

  return (
    <div>
      Homepage: {now.toDateString()} - {now.getSeconds()} !
      <div>
        <a {...clp("/demo/hello")}>/demo/hello</a>
      </div>
    </div>
  );
}
