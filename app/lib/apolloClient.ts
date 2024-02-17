import { NextSSRApolloClient, NextSSRInMemoryCache } from "@apollo/experimental-nextjs-app-support/ssr";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import { FetchResult, HttpLink, NextLink, Observable, Operation } from "@apollo/client";
import { getAccessTokenFromAuth0 } from "./actions";
import { ApolloLink } from "@apollo/client";

export const { getClient } = registerApolloClient(() => {
  const httpLink = new HttpLink({
    uri: process.env.HASURA_URL,
  });

  const authLink = new ApolloLink((operation: Operation, forward: NextLink) => {
    return new Observable<FetchResult>((observer) => {
      getAccessTokenFromAuth0().then((accessToken) => {
        console.log(accessToken);

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

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: authLink.concat(httpLink),
  });
});


