import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListApps, getListAppsQueryKey } from "@workspace/api-client-react";
import type { CatalogApp } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusIcon, ExternalLinkIcon, CalendarIcon } from "lucide-react";

const CATEGORIES = ["All", "Games", "Education", "Creative", "Music", "Reading"] as const;
const INTEREST_TAGS = [
  "All",
  "Engineering",
  "Baking/Food",
  "Music",
  "Drawing",
  "Reading",
  "Math",
  "Science",
  "Gaming",
  "Language Learning",
] as const;

function categoryColor(cat: string) {
  switch (cat) {
    case "Games": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Education": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Creative": return "bg-pink-100 text-pink-800 border-pink-200";
    case "Music": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Reading": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default: return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

function costColor(cost: string) {
  if (cost === "Free") return "bg-green-100 text-green-800 border-green-200";
  if (cost === "Subscription") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-sky-100 text-sky-800 border-sky-200";
}

function adColor(ad: string) {
  if (ad === "No Ads") return "bg-green-100 text-green-800 border-green-200";
  if (ad === "Has Ads") return "bg-red-100 text-red-800 border-red-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function AppCard({ app }: { app: CatalogApp }) {
  const isRemoved = app.status === "Removed";
  return (
    <Card className={`border-stone-200 hover:border-amber-300 transition-colors ${isRemoved ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base text-stone-900 leading-tight truncate">{app.name}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Badge variant="outline" className={`text-xs ${categoryColor(app.category)}`}>
                {app.category}
              </Badge>
              {isRemoved && (
                <Badge variant="outline" className="text-xs bg-stone-100 text-stone-500 border-stone-200">
                  Removed
                </Badge>
              )}
            </div>
          </div>
          <Link href={`/catalog/${app.id}`}>
            <Button variant="outline" size="sm" className="shrink-0 text-stone-600 hover:text-amber-800 hover:border-amber-300">
              Edit
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-xs ${costColor(app.costModel)}`}>
            {app.costModel}
          </Badge>
          <Badge variant="outline" className={`text-xs ${adColor(app.adStatus)}`}>
            {app.adStatus}
          </Badge>
          <Badge variant="outline" className="text-xs bg-stone-50 text-stone-600 border-stone-200">
            Ages {app.ageMin}–{app.ageMax}
          </Badge>
        </div>
        {app.notes && (
          <p className="text-xs text-stone-500 line-clamp-2">{app.notes}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <CalendarIcon className="h-3 w-3" />
            <span>Verified {app.lastVerified}</span>
          </div>
          <a
            href={app.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-amber-700 hover:text-amber-900"
          >
            App Store
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function AppCardSkeleton() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-14 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export default function Catalog() {
  const [showRemoved, setShowRemoved] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [tagFilter, setTagFilter] = useState<string>("All");

  const { data: allApps, isLoading, isError } = useListApps({ includeRemoved: true });

  const filtered = useMemo(() => {
    if (!allApps) return [];
    return allApps.filter((app) => {
      if (!showRemoved && app.status === "Removed") return false;
      if (categoryFilter !== "All" && app.category !== categoryFilter) return false;
      if (tagFilter !== "All" && !app.interestTags.includes(tagFilter)) return false;
      return true;
    });
  }, [allApps, showRemoved, categoryFilter, tagFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">App Catalog</h1>
          <p className="text-sm text-stone-500 mt-1">Your vetted collection of iPad apps.</p>
        </div>
        <Link href="/catalog/new">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Add App
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? "bg-amber-100 border-amber-400 text-amber-900"
                      : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-stone-500 mb-2">Interest Tag</p>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  tagFilter === tag
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          <Switch
            id="show-removed"
            checked={showRemoved}
            onCheckedChange={setShowRemoved}
            className="data-[state=checked]:bg-stone-500"
          />
          <Label htmlFor="show-removed" className="text-sm text-stone-600 cursor-pointer">
            Show removed apps
          </Label>
          {allApps && (
            <span className="text-xs text-stone-400 ml-auto">
              {filtered.length} of {allApps.length} app{allApps.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load apps. Make sure the API server is running.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <AppCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg font-medium mb-1">No apps match your filters</p>
          <p className="text-sm mb-4">Try adjusting the category or interest tag filter.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
