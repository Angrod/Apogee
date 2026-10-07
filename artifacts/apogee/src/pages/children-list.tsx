import { useState } from "react";
import { Link } from "wouter";
import { useListChildren } from "@workspace/api-client-react";
import type { Child } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusIcon, ClockIcon, TabletSmartphoneIcon, SparklesIcon } from "lucide-react";
import { formatHours } from "@/lib/screen-time";

function InterestBadge({ tag }: { tag: string }) {
  return (
    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
      {tag}
    </Badge>
  );
}

function ChildCard({ child }: { child: Child }) {
  return (
    <Card className={`border-stone-200 hover:border-amber-300 transition-colors ${child.archived ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-stone-900">{child.name}</CardTitle>
            <p className="text-sm text-stone-500 mt-0.5">
              Age {child.age}
              {child.archived && (
                <Badge variant="outline" className="ml-2 text-xs bg-stone-100 text-stone-500 border-stone-200">
                  Archived
                </Badge>
              )}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-stone-600 hover:text-amber-800 hover:border-amber-300">
            <Link href={`/children/${child.id}`}>Edit</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <TabletSmartphoneIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span>{child.deviceName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-stone-600">
          <ClockIcon className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span>
            {formatHours(child.screenTimeWeekday)} weekdays · {formatHours(child.screenTimeWeekend)} weekends
          </span>
        </div>

        {child.appleArcade && (
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <SparklesIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Apple Arcade</span>
          </div>
        )}

        {child.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {child.interests.map((tag) => (
              <InterestBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChildCardSkeleton() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-14" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-44" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChildrenList() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: allChildren, isLoading, isError } = useListChildren({ includeArchived: true });
  const archivedCount = allChildren?.filter((c) => c.archived).length ?? 0;
  const children = allChildren?.filter((c) => showArchived || !c.archived);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Children</h1>
          <p className="text-sm text-stone-500 mt-1">Manage profiles for each child's iPad.</p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
          <Link href="/children/new">
            <PlusIcon className="h-4 w-4" />
            Add Child
          </Link>
        </Button>
      </div>

      {archivedCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
            className="data-[state=checked]:bg-stone-500"
          />
          <Label htmlFor="show-archived" className="text-sm text-stone-600 cursor-pointer">
            Show archived ({archivedCount})
          </Label>
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load children. Make sure the API server is running.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <ChildCardSkeleton key={i} />)}
        </div>
      )}

      {children && children.length === 0 && archivedCount > 0 && (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg font-medium mb-1">All profiles are archived</p>
          <p className="text-sm">Turn on "Show archived" to see them.</p>
        </div>
      )}

      {allChildren && allChildren.length === 0 && (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg font-medium mb-1">No children yet</p>
          <p className="text-sm mb-4">Add your first child profile to get started.</p>
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/children/new">
              <PlusIcon className="h-4 w-4" />
              Add Child
            </Link>
          </Button>
        </div>
      )}

      {children && children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
