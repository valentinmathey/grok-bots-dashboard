import Link from "next/link";
import { Star, TrendingDown } from "lucide-react";
import { asAlojamiento, hasPriceDrop } from "@/lib/details";
import { formatMoney } from "@/lib/format";
import type { Post } from "@/lib/types";

export function AlojamientoTable({
  posts,
  postHref,
}: {
  posts: Post[];
  postHref?: (post: Post) => string;
}) {
  return (
    <div className="surface overflow-hidden rounded-3xl">
      <ul className="divide-y divide-line lg:hidden">
        {posts.map((post) => {
          const details = asAlojamiento(post.details);
          const currency = details?.currency || "BRL";
          const drop = hasPriceDrop(details);
          const zona = [details?.neighborhood, details?.city].filter(Boolean).join(" · ") || "—";
          const title = postHref ? (
            <Link href={postHref(post)} className="font-medium leading-snug hover:underline">
              {post.title}
            </Link>
          ) : (
            <span className="font-medium leading-snug">{post.title}</span>
          );
          return (
            <li key={post.id} className="px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2">{title}</p>
                  <p className="mt-1 text-xs text-muted">{zona}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {details?.price_per_person != null
                    ? formatMoney(details.price_per_person, currency)
                    : "—"}
                  <span className="block text-[11px] font-normal text-muted">/ pers.</span>
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {details?.score != null ? <span>Score {details.score.toFixed(1)}</span> : null}
                {details?.rating != null ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Star size={11} strokeWidth={1.75} className="text-amber-500" />
                    {details.rating.toFixed(2)}
                  </span>
                ) : null}
                <span>
                  {details?.bedrooms ?? "—"}/{details?.beds ?? "—"}/{details?.bathrooms ?? "—"}
                </span>
                {drop ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                    <TrendingDown size={10} strokeWidth={1.75} />
                    Bajó
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-max min-w-full text-left text-[13px]">
          <thead className="bg-raised text-[11px] uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-raised px-3 py-2.5 font-semibold">Lugar</th>
              <th className="px-3 py-2.5 font-semibold">Zona</th>
              <th className="px-3 py-2.5 font-semibold">/ pers.</th>
              <th className="px-3 py-2.5 font-semibold">Total</th>
              <th className="px-3 py-2.5 font-semibold">Score</th>
              <th className="px-3 py-2.5 font-semibold">Nota</th>
              <th className="px-3 py-2.5 font-semibold">Hab.</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const details = asAlojamiento(post.details);
              const currency = details?.currency || "BRL";
              const drop = hasPriceDrop(details);
              return (
                <tr key={post.id} className="border-t border-line">
                  <td className="sticky left-0 z-10 max-w-[9.5rem] bg-card px-3 py-2.5 font-medium leading-snug">
                    {postHref ? (
                      <Link href={postHref(post)} className="line-clamp-2 hover:underline">
                        {post.title}
                      </Link>
                    ) : (
                      <span className="line-clamp-2">{post.title}</span>
                    )}
                    {drop ? (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <TrendingDown size={10} strokeWidth={1.75} />
                        Bajó
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {[details?.neighborhood, details?.city].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold tabular-nums">
                    {details?.price_per_person != null
                      ? formatMoney(details.price_per_person, currency)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">
                    {details?.price_total != null
                      ? formatMoney(details.price_total, currency)
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">
                    {details?.score != null ? details.score.toFixed(1) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {details?.rating != null ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Star size={11} strokeWidth={1.75} className="text-amber-500" />
                        {details.rating.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {details?.bedrooms ?? "—"}/{details?.beds ?? "—"}/{details?.bathrooms ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
