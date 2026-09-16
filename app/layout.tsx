import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { getCurrentUser } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { themeInitScript } from "@/lib/theme";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProgressSync from "./components/ProgressSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tarkov Manager: Escape from Tarkov companion",
    template: "%s · Tarkov Manager",
  },
  description:
    "All-in-one companion app for Escape from Tarkov. Manage quests, raid routes, hideout planning, and more in one place.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-text">
        <AuthProvider enabled={isSupabaseConfigured} initialUser={user}>
          <ProgressSync />
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
