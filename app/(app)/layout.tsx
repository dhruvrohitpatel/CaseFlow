import { AppShell } from "@/components/layout/app-shell";
import { requireAppSession } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const { profile } = await requireAppSession();

  return (
    <AppShell profile={profile}>
      {children}
    </AppShell>
  );
}
