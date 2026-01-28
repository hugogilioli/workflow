import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
  title: "WorkFlow",
  description: "Materials & Requests Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
