import { Header } from "@/components/Header";
import { requireOwnerEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireOwnerEmail();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header email={email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
