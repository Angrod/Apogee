import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboard,
  useUpdateChildAppStatus,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import type { DashboardAppEntry, DashboardEntry } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon, RocketIcon, GamepadIcon } from "lucide-react";

const STATUS_ORDER = ["Pushed", "Installed", "Not Installed", "Removed"] as const;
type AppStatus = (typeof STATUS_ORDER)[number];

const STATUS_LABELS: Record<AppStatus, string> = {
  Pushed: "Pushed",
  Installed: "Installed",
  "Not Installed": "Not Installed",
  Removed: "Removed",
};

const STATUS_COLORS: Record<AppStatus, string> = {
  Pushed: "text-blue-700 bg-blue-50 border-blue-200",
  Installed: "text-green-700 bg-green-50 border-green-200",
  "Not Installed": "text-stone-600 bg-stone-50 border-stone-200",
  Removed: "text-red-700 bg-red-50 border-red-200",
};

const GROUP_HEADER_COLORS: Record<string, string> = {
  Pushed: "text-blue-700",
  Installed: "text-green-700",
  "Not Installed": "text-stone-500",
};

function costColor(cost: string) {
  if (cost === "Free") return "bg-green-100 text-green-800 border-green-200";
  if (cost === "Subscription") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-sky-100 text-sky-800 border-sky-200";
}

type StatusKey = string;

interface AppCardProps {
  entry: DashboardAppEntry;
  childId: number;
  localStatus: AppStatus;
  onStatusChange: (key: StatusKey, status: AppStatus) => void;
  isMutating: boolean;
}

function AppCard({ entry, childId, localStatus, onStatusChange, isMutating }: AppCardProps) {
  const { app } = entry;
  const key = `${childId}-${app.id}`;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 leading-tight truncate">{app.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className={`text-xs ${costColor(app.costModel)}`}>
              {app.costModel}
            </Badge>
            <a
              href={app.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-xs text-amber-700 hover:text-amber-900"
            >
              App Store
              <ExternalLinkIcon className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={localStatus}
          disabled={isMutating}
          onChange={(e) => onStatusChange(key, e.target.value as AppStatus)}
          className={`flex-1 h-7 rounded-md border text-xs px-2 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-60 ${STATUS_COLORS[localStatus]}`}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {localStatus !== "Pushed" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isMutating}
            onClick={() => onStatusChange(key, "Pushed")}
            className="h-7 px-2 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 shrink-0"
          >
            <RocketIcon className="h-3 w-3 mr-1" />
            Push
          </Button>
        )}
      </div>
    </div>
  );
}

function ChildColumn({ entry, statusOverrides, onStatusChange, mutatingKeys }: {
  entry: DashboardEntry;
  statusOverrides: Map<string, AppStatus>;
  onStatusChange: (key: string, status: AppStatus) => void;
  mutatingKeys: Set<string>;
}) {
  const { child, matchedApps } = entry;

  const grouped = useMemo(() => {
    const groups: Record<string, DashboardAppEntry[]> = {
      Pushed: [],
      Installed: [],
      "Not Installed": [],
    };

    for (const appEntry of matchedApps) {
      const key = `${child.id}-${appEntry.app.id}`;
      const localStatus = statusOverrides.get(key) ?? (appEntry.childStatus as AppStatus);

      if (localStatus === "Removed") continue;
      if (child.appleArcade && appEntry.app.category === "Games") continue;

      const group = groups[localStatus] ?? groups["Not Installed"];
      group.push(appEntry);
    }

    return groups;
  }, [matchedApps, statusOverrides, child]);

  const hasAnyApps = child.appleArcade
    ? matchedApps.some(a => a.app.category !== "Games")
    : matchedApps.length > 0;

  return (
    <div className="flex flex-col min-w-0">
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
        <h2 className="text-base font-bold text-stone-900">{child.name}</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Age {child.age} · {child.deviceName}
        </p>
        {child.appleArcade && (
          <Badge className="mt-2 bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
            🎮 Apple Arcade
          </Badge>
        )}
      </div>

      {!hasAnyApps && (
        <div className="text-center py-8 text-stone-400 text-sm">
          No matching apps yet.<br />
          <span className="text-xs">Check interests &amp; age in the child's profile.</span>
        </div>
      )}

      {child.appleArcade && matchedApps.some(a => a.app.category === "Games") && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 mb-3 flex items-center gap-2">
          <GamepadIcon className="h-4 w-4 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-700">
            <span className="font-medium">Games via Apple Arcade</span> — catalog games replaced by Apple Arcade subscription.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {(["Pushed", "Installed", "Not Installed"] as const).map((groupName) => {
          const apps = grouped[groupName];
          if (!apps || apps.length === 0) return null;
          return (
            <div key={groupName}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${GROUP_HEADER_COLORS[groupName]}`}>
                {groupName} ({apps.length})
              </p>
              <div className="space-y-2">
                {apps.map((appEntry) => {
                  const key = `${child.id}-${appEntry.app.id}`;
                  const localStatus = statusOverrides.get(key) ?? (appEntry.childStatus as AppStatus);
                  return (
                    <AppCard
                      key={key}
                      entry={appEntry}
                      childId={child.id}
                      localStatus={localStatus}
                      onStatusChange={onStatusChange}
                      isMutating={mutatingKeys.has(key)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [statusOverrides, setStatusOverrides] = useState<Map<string, AppStatus>>(new Map());
  const [mutatingKeys, setMutatingKeys] = useState<Set<string>>(new Set());

  const { data: dashboardData, isLoading, isError } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() },
  });

  const updateStatus = useUpdateChildAppStatus();

  const handleStatusChange = useCallback(
    (key: string, newStatus: AppStatus) => {
      const [childIdStr, appIdStr] = key.split("-");
      const childId = parseInt(childIdStr, 10);
      const appId = parseInt(appIdStr, 10);

      setStatusOverrides((prev) => {
        const next = new Map(prev);
        next.set(key, newStatus);
        return next;
      });
      setMutatingKeys((prev) => new Set(prev).add(key));

      updateStatus.mutate(
        { childId, appId, data: { status: newStatus } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          },
          onSettled: () => {
            setMutatingKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          },
        }
      );
    },
    [updateStatus, queryClient]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">
            Apps matched to each child by age and interests.
          </p>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load dashboard. Make sure the API server is running.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ColumnSkeleton />
          <ColumnSkeleton />
          <ColumnSkeleton />
        </div>
      )}

      {!isLoading && dashboardData && dashboardData.length === 0 && (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg font-medium mb-1">No children yet</p>
          <p className="text-sm">Add a child profile to get started.</p>
        </div>
      )}

      {!isLoading && dashboardData && dashboardData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.map((entry) => (
            <ChildColumn
              key={entry.child.id}
              entry={entry}
              statusOverrides={statusOverrides}
              onStatusChange={handleStatusChange}
              mutatingKeys={mutatingKeys}
            />
          ))}
        </div>
      )}
    </div>
  );
}
