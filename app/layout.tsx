import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { getOrganizationSettings, getThemeCssVariables } from "@/lib/organization-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrganizationSettings();

  return {
    description: settings.product_subtitle,
    icons: settings.favicon_url
      ? {
          icon: settings.favicon_url,
          shortcut: settings.favicon_url,
        }
      : undefined,
    title: {
      default: settings.organization_name,
      template: `%s | ${settings.organization_name}`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, locale, messages] = await Promise.all([
    getOrganizationSettings(),
    getLocale(),
    getMessages(),
  ]);
  const themeStyle = getThemeCssVariables(settings) as CSSProperties;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground flex flex-col" style={themeStyle}>
        <a className="skip-to-content" href="#main-content">Skip to main content</a>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
