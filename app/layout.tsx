import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { ConnectionProvider2 } from "@/context/ConnectionContext2";

const itim = Itim({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-itim",
});

export const metadata: Metadata = {
  title: "Juswap",
  description: "Crypto Payment Gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={itim.className + ` antialiased remove-scrollbar`}>
        {children}
      </body>
    </html>
  );
}
