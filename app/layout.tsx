import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getSpeedInsightsConfig } from "@/lib/observability";
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
  const settings = await getOrganizationSettings();
  const themeStyle = getThemeCssVariables(settings) as CSSProperties;
  const speedInsights = getSpeedInsightsConfig();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground flex flex-col" style={themeStyle}>
        {children}
        {speedInsights.enabled ? (
          <SpeedInsights sampleRate={speedInsights.sampleRate} />
        ) : null}
      </body>
    </html>
  );
}
