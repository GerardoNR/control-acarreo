import { Icon, type IconName } from "@/components/admin/icons";

type StatVariant = "primary" | "info" | "success" | "danger";

const variantStyles: Record<StatVariant, string> = {
  primary: "bg-blue-50 text-[#2563EB]",
  info: "bg-sky-50 text-sky-600",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-red-50 text-red-600",
};

export function StatCard({ label, value, icon, variant }: { label: string; value: string; icon: IconName; variant: StatVariant }) {
  return (
    <article className="min-w-0 rounded-xl border border-[#CBD5E1] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#475569]">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${variantStyles[variant]}`}>
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
      </div>
    </article>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#CBD5E1] bg-white p-4" aria-hidden="true">
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-7 w-16 rounded bg-slate-200" />
    </div>
  );
}
