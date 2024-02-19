"use client"

import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { setContext } from "@apollo/client/link/context";
import { createClient } from "graphql-ws";
import { getAccessTokenFromAuth0 } from "./actions";
import { ApolloLink, FetchResult, HttpLink, NextLink, Operation, split } from "@apollo/client";
import { Observable, getMainDefinition } from "@apollo/client/utilities";
import { NextSSRApolloClient, NextSSRInMemoryCache, SSRMultipartLink } from "@apollo/experimental-nextjs-app-support/ssr";

const httpLink = new HttpLink({
  uri: process.env.HASURA_URL,
});

const authLink = new ApolloLink((operation: Operation, forward: NextLink) => {
  return new Observable<FetchResult>((observer) => {
    getAccessTokenFromAuth0().then((accessToken) => {
      operation.setContext({
        headers: {
          authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
      });

      const subscription = forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    });
  });
});


const authLink2 = setContext(async () => {
  const accessToken = await getAccessTokenFromAuth0();
  return {
    headers: {
      authorization: accessToken ? `Bearer ${accessToken}` : ""
    }
  };
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_HASURA_WS!,
    connectionParams: async () => {
      const accessToken = await getAccessTokenFromAuth0();
      if (!accessToken) return {}

      return {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      };
    },
  })
)


const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  typeof window === "undefined"
    ? ApolloLink.from([
      new SSRMultipartLink({
        stripDefer: true,
      }),
      authLink2.concat(httpLink),
    ])
    : authLink2.concat(httpLink),
);


export function makeClient() {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: splitLink,
  });
}