export interface PlatformStats {
  totalUsers?: number;
  totalAuctions?: number;
  liveAuctions?: number;
  [key: string]: unknown;
}

interface AdminStatsCardsProps {
  stats: PlatformStats;
}

export const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      <div className="panel p-6 relative bg-surface border border-border">
        <div className="absolute top-1 left-1 right-1 bottom-1 border border-border pointer-events-none"></div>
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3 relative z-10">
          Total Users
        </p>
        <p className="text-4xl font-serif text-text-primary tabular-nums relative z-10">
          {stats.totalUsers ?? 0}
        </p>
      </div>
      <div className="panel p-6 relative bg-surface border border-border">
        <div className="absolute top-1 left-1 right-1 bottom-1 border border-border pointer-events-none"></div>
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3 relative z-10">
          Total Auctions
        </p>
        <p className="text-4xl font-serif text-text-primary tabular-nums relative z-10">
          {stats.totalAuctions ?? 0}
        </p>
      </div>
      <div className="panel p-6 relative bg-surface border border-border overflow-hidden">
        <div className="absolute top-1 left-1 right-1 bottom-1 border border-border pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1.5 h-full bg-live animate-pulse"></div>
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3 relative z-10">
          Live Auctions
        </p>
        <p className="text-4xl font-serif text-text-primary tabular-nums relative z-10">
          {stats.liveAuctions ?? 0}
        </p>
      </div>
    </div>
  );
};
