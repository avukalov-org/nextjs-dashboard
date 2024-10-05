import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',

    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      // screen_hint: 'signup',
      prompt: 'login', // Ovo će spriječiti automatski login
    },
  }),
});
