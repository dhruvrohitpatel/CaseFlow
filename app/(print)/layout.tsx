import { requireCurrentSession } from "@/lib/auth";

type PrintLayoutProps = {
  children: React.ReactNode;
};

export default async function PrintLayout({
  children,
}: PrintLayoutProps) {
  await requireCurrentSession();

  return <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-10">{children}</div>;
}
