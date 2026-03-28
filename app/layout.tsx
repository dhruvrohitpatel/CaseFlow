import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaseFlow",
  description: "Nonprofit client and case management MVP for the WiCS hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-100 text-stone-950 flex flex-col">
        {children}
      </body>
    </html>
  );
}
