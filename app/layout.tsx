import '@/app/ui/global.css';
import { inter } from "./ui/fonts";
import { Metadata } from "next";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { ApolloWrapper } from "./ui/ApolloWrapper";


export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Course Dashboard, built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UserProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
