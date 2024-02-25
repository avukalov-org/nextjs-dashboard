import { NextSSRApolloClient, NextSSRInMemoryCache } from "@apollo/experimental-nextjs-app-support/ssr";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";
import { HttpLink, NextLink, Operation } from "@apollo/client";
import { getAccessTokenFromAuth0 } from "@/app/lib/actions";
import { ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Base Hasura httpLink
const httpLink = new HttpLink({
  uri: process.env.HASURA_URL,
});

// apollo link with hasura admin secret header
const adminLink = new ApolloLink((operation: Operation, forward: NextLink) => {
  operation.setContext({
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_SECRET,
    }
  });
  return forward(operation);
})

// apollo link with authentication header
const authLink = setContext(async () => {
  const accessToken = await getAccessTokenFromAuth0();
  // TODO: Remove this later
  // console.log(accessToken);
  return accessToken ?
    {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    } : {}
})

export function getApolloClient(admin: boolean = false) {
  if (admin)
    return apolloClientAdmin;

  return apolloClientAccessToken;
}

const apolloClientAccessToken = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: authLink.concat(httpLink),
  });
});

const apolloClientAdmin = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: adminLink.concat(httpLink),
  });
});




