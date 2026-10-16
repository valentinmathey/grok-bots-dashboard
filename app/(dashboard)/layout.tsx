import { AppNav } from "@/components/AppNav";
import { AppBadgeSync } from "@/components/AppBadgeSync";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { NavProvider } from "@/components/nav-context";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ResumeRefresh } from "@/components/ResumeRefresh";
import { ToastHost } from "@/components/Toast";
import { requireOwnerEmail } from "@/lib/auth";
import { listRequests } from "@/lib/requests";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireOwnerEmail();
  const requests = await listRequests({}).catch(() => []);
  const unreadPedidos = requests.filter(
    (row) => row.unread || row.status === "pendiente",
  ).length;

  return (
    <div className="flex min-h-full min-h-dvh flex-1 flex-col lg:pl-60">
      <FavoritesProvider>
        <NavProvider unreadPedidos={unreadPedidos}>
          <ResumeRefresh />
          <AppBadgeSync />
          <PullToRefresh />
          <AppNav email={email} />
          <main className="safe-px safe-pb mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-clip pt-4 sm:pt-8">
            {children}
          </main>
          <ToastHost />
        </NavProvider>
      </FavoritesProvider>
    </div>
  );
}
