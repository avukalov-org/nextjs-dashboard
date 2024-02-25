"use client"

import { ApolloNextAppProvider } from "@apollo/experimental-nextjs-app-support/ssr";
import { makeClient } from "@/app/lib/apolloProvider";


export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}