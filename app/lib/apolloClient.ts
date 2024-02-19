import { ApolloNextAppProvider, NextSSRApolloClient, NextSSRInMemoryCache, SSRMultipartLink } from "@apollo/experimental-nextjs-app-support/ssr";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import { FetchResult, HttpLink, NextLink, Observable, Operation, split } from "@apollo/client";
import { getAccessTokenFromAuth0 } from "./actions";
import { ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

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

const adminLink = new ApolloLink((operation: Operation, forward: NextLink) => {
  operation.setContext({
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_SECRET,
    }
  });
  return forward(operation);
})

const authLink2 = setContext(async () => {
  const accessToken = await getAccessTokenFromAuth0();
  return {
    headers: {
      authorization: accessToken ? `Bearer ${accessToken}` : ""
    }
  };
})

export const apolloClientAccessToken = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: authLink.concat(httpLink),
  });
});

export const apolloClientAdmin = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: authLink2.concat(httpLink),
  });
});




