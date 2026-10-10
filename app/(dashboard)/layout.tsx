import { FavoritesProvider } from "@/components/FavoritesProvider";
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
      <FavoritesProvider>
        <Header email={email} />
        <main className="safe-px safe-pb mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-clip pt-5 sm:pt-8">
          {children}
        </main>
      </FavoritesProvider>
    </div>
  );
}
