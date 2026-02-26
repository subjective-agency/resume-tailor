import type { Metadata } from "next";
import "./globals.css"; // Global styles
import Script from "next/script";

export const metadata: Metadata = {
  title: "Denis Shvetsov ::: Systems Architect",
  description: "Denis Shvetsov ::: Systems Architect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Script src="//cdn.credly.com/assets/utilities/embed.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
