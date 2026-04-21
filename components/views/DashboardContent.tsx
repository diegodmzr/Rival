"use client";

import { useStore, selectRivalUser, selectCurrentUser } from "@/lib/store";
import { todayHours, weekHours, monthHours } from "@/lib/compute";
import { InsightBanner } from "@/components/desktop/InsightBanner";
import { Metric } from "@/components/desktop/Metric";
import { VersusCard } from "@/components/desktop/VersusCard";
import { ChartCard } from "@/components/desktop/ChartCard";
import { ProjectsCard } from "@/components/desktop/ProjectsCard";
import { GoalsCard } from "@/components/desktop/GoalsCard";
import { StreakCard } from "@/components/desktop/StreakCard";
import { RecentCard } from "@/components/desktop/RecentCard";
import { BadgesCard } from "@/components/desktop/BadgesCard";
import { MobileInsight } from "@/components/mobile/MobileInsight";
import { MobileMetricRow } from "@/components/mobile/MobileMetricRow";
import { MobileVersus } from "@/components/mobile/MobileVersus";
import { MobileChart } from "@/components/mobile/MobileChart";
import { MobileStreak } from "@/components/mobile/MobileStreak";
import { MobileRecent } from "@/components/mobile/MobileRecent";

export function DashboardContent() {
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const myToday = todayHours(entries, me.id);
  const rivalToday = todayHours(entries, rival.id);
  const myWeek = weekHours(entries, me.id);
  const rivalWeek = weekHours(entries, rival.id);
  const myMonth = monthHours(entries, me.id);
  const rivalMonth = monthHours(entries, rival.id);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <InsightBanner />
        <div className="p-6">
          <div className="grid grid-cols-4 gap-[14px] mb-[14px]">
            <Metric
              label="Aujourd'hui"
              value={myToday}
              rivalValue={rivalToday}
              rivalId={rival.id}
            />
            <Metric
              label="Cette semaine"
              value={myWeek}
              rivalValue={rivalWeek}
              rivalId={rival.id}
            />
            <VersusCard />
          </div>
          <div className="grid grid-cols-4 gap-[14px] mb-[14px]">
            <Metric
              label="Ce mois"
              value={myMonth}
              rivalValue={rivalMonth}
              rivalId={rival.id}
            />
            <GoalsCard />
            <ProjectsCard />
            <BadgesCard />
          </div>
          <div className="grid grid-cols-[1.5fr_1fr] gap-[14px] mb-[14px]">
            <ChartCard />
            <StreakCard />
          </div>
          <RecentCard />
          <div className="h-6" />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileInsight />
        <MobileMetricRow />
        <MobileVersus />
        <MobileChart />
        <MobileStreak />
        <MobileRecent />
      </div>
    </>
  );
}
