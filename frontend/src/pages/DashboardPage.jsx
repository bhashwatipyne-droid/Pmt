import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getDashboardAttentionItems, getDashboardSummary, getDashboardTeamSummary } from "@/services/api";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import { TeamWorkloadTable } from "@/components/dashboard/TeamWorkloadTable";
import { AttentionPanel } from "@/components/dashboard/AttentionPanel";
import { DASHBOARD } from "@/constants/testIds";

export default function DashboardPage() {
  const { currentUser, loading: userLoading } = useUser();
  const [summary, setSummary] = useState(null);
  const [team, setTeam] = useState([]);
  const [attention, setAttention] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    setLoading(true);
    Promise.all([
      getDashboardSummary(currentUser.id),
      getDashboardTeamSummary(currentUser.id),
      getDashboardAttentionItems(currentUser.id),
    ])
      .then(([s, t, a]) => {
        setSummary(s);
        setTeam(t);
        setAttention(a);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (userLoading || !currentUser) return null;

  if (currentUser.role !== "admin") {
    return (
      <div data-testid={DASHBOARD.adminOnlyNotice} className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium text-foreground">The dashboard is available to Admins only</p>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
          Go to Work Sheet <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div data-testid={DASHBOARD.loadingState} className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Overview across all work items and team members</p>
        <Link
          to="/"
          data-testid={DASHBOARD.viewSheetLink}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          View Work Sheet <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard testId={DASHBOARD.metricTotalItems} label="Total Work Items" value={summary.total_items} accent="teal" icon={Briefcase} />
        <MetricCard testId={DASHBOARD.metricActiveMembers} label="Active Members" value={summary.active_members} accent="blue" icon={Users} />
        <MetricCard testId={DASHBOARD.metricHoursLogged} label="Hours Logged" value={`${summary.total_hours_logged}h`} sublabel={`${summary.items_this_month} items this month`} accent="amber" icon={Clock} />
        <MetricCard testId={DASHBOARD.metricNeedsAttention} label="Needs Attention" value={summary.needs_attention_count} accent="rose" icon={AlertTriangle} />
      </div>

      <div className="mb-5">
        <StatusBreakdown statusCounts={summary.status_counts} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamWorkloadTable team={team} />
        </div>
        <AttentionPanel items={attention} />
      </div>
    </div>
  );
}
