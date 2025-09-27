import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "../components/ConvexProvider";
import { ClerkProvider } from '@clerk/nextjs';

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eşkikçi - Table Games Companion",
  description: "Your companion app for table games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${urbanist.variable} antialiased`}
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
