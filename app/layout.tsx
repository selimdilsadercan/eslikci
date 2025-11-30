import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexProvider";
import { FirebaseAuthProvider } from "@/components/FirebaseAuthProvider";
import { ProProvider } from "@/components/ProProvider";
import { UserSyncWrapper } from "@/components/UserSyncWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import StatusBarComponent from "@/components/StatusBar";
import BackButtonHandler from "@/components/BackButtonHandler";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eşlikçi - Board Games Companion",
  description: "Your companion app for table games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <StatusBarComponent overlay={false} />
        <BackButtonHandler />
        <ThemeProvider>
          <FirebaseAuthProvider>
            <ConvexClientProvider>
              <ProProvider>
                <UserSyncWrapper>{children}</UserSyncWrapper>
              </ProProvider>
            </ConvexClientProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 1500,
              style: {
                background: "#10B981",
                color: "#fff",
              },
            },
            error: {
              duration: 2500,
              style: {
                background: "#EF4444",
                color: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
