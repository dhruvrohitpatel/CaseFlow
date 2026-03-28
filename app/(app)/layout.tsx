import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentSession } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const { profile } = await requireCurrentSession();

  return (
    <AppShell profile={profile}>
      {children}
    </AppShell>
  );
}
