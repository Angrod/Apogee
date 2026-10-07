import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetApp,
  useCreateApp,
  useUpdateApp,
  getListAppsQueryKey,
  getGetAppQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import type { CatalogApp } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const INTEREST_TAGS = [
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

const CATEGORIES = ["Games", "Education", "Creative", "Music", "Reading"] as const;
const COST_MODELS = ["Free", "One-time purchase", "Subscription"] as const;
const AD_STATUSES = ["No Ads", "Minimal", "Has Ads"] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  appStoreUrl: z.string().url("Must be a valid URL"),
  category: z.enum(CATEGORIES, { required_error: "Category is required" }),
  ageMin: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0)
    .max(17),
  ageMax: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0)
    .max(17),
  interestTags: z.array(z.enum(INTEREST_TAGS)).default([]),
  costModel: z.enum(COST_MODELS, { required_error: "Cost model is required" }),
  adStatus: z.enum(AD_STATUSES, { required_error: "Ad status is required" }),
  notes: z.string().default(""),
  status: z.enum(["Active", "Removed"]).default("Active"),
}).refine((d) => d.ageMax >= d.ageMin, {
  message: "Max age must be ≥ min age",
  path: ["ageMax"],
});

type FormValues = z.infer<typeof schema>;
type InterestTag = (typeof INTEREST_TAGS)[number];

function InterestToggle({
  tag,
  selected,
  onToggle,
}: {
  tag: InterestTag;
  selected: boolean;
  onToggle: (tag: InterestTag) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        selected
          ? "bg-amber-100 border-amber-400 text-amber-900"
          : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {selected && <CheckIcon className="h-3 w-3" />}
      {tag}
    </button>
  );
}

function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-stone-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  error,
  value,
  onChange,
  options,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <FormField label={label} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </FormField>
  );
}

function AppFormContent({ appId }: { appId?: number }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = appId !== undefined;

  const {
    data: existingApp,
    isError: isAppError,
  } = useGetApp(appId ?? 0, {
    query: { enabled: isEditing, queryKey: getGetAppQueryKey(appId ?? 0) },
  });

  // Keep every view of the catalog in sync after a save. Writing the saved record
  // into its own cache entry stops a reopened form from showing pre-save values.
  // The list key without params is a prefix of every filtered variant.
  function syncAfterSave(saved: CatalogApp) {
    queryClient.setQueryData(getGetAppQueryKey(saved.id), saved);
    queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  }

  const createMutation = useCreateApp({
    mutation: {
      onSuccess: (saved) => {
        syncAfterSave(saved);
        toast({ title: "App added to catalog" });
        navigate("/catalog");
      },
      onError: () => {
        toast({ title: "Failed to add app", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateApp({
    mutation: {
      onSuccess: (saved) => {
        syncAfterSave(saved);
        toast({ title: "App saved" });
        navigate("/catalog");
      },
      onError: () => {
        toast({ title: "Failed to save app", variant: "destructive" });
      },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      appStoreUrl: "",
      category: undefined,
      ageMin: 4,
      ageMax: 12,
      interestTags: [],
      costModel: undefined,
      adStatus: undefined,
      notes: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (existingApp) {
      reset({
        name: existingApp.name,
        appStoreUrl: existingApp.appStoreUrl,
        category: existingApp.category as (typeof CATEGORIES)[number],
        ageMin: existingApp.ageMin,
        ageMax: existingApp.ageMax,
        interestTags: existingApp.interestTags,
        costModel: existingApp.costModel as (typeof COST_MODELS)[number],
        adStatus: existingApp.adStatus as (typeof AD_STATUSES)[number],
        notes: existingApp.notes,
        status: existingApp.status as "Active" | "Removed",
      });
    }
  }, [existingApp, reset]);

  const interestTags = watch("interestTags") ?? [];
  const category = watch("category");
  const costModel = watch("costModel");
  const adStatus = watch("adStatus");
  const status = watch("status");

  function toggleTag(tag: InterestTag) {
    const current = interestTags;
    if (current.includes(tag)) {
      setValue("interestTags", current.filter((t) => t !== tag));
    } else {
      setValue("interestTags", [...current, tag]);
    }
  }

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      appStoreUrl: values.appStoreUrl,
      category: values.category,
      ageMin: values.ageMin,
      ageMax: values.ageMax,
      interestTags: values.interestTags,
      costModel: values.costModel,
      adStatus: values.adStatus,
      notes: values.notes,
      status: values.status,
    };

    if (appId !== undefined) {
      updateMutation.mutate({ id: appId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  if (isEditing && isAppError) {
    return <MissingRecord />;
  }

  // Only show the edit form once the record has loaded, so it never opens empty.
  if (isEditing && !existingApp) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const isBusy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField label="App Name" error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="e.g. Khan Academy Kids"
          className="border-stone-200 focus-visible:ring-amber-400"
        />
      </FormField>

      <FormField label="App Store URL" error={errors.appStoreUrl?.message}>
        <Input
          {...register("appStoreUrl")}
          type="url"
          placeholder="https://apps.apple.com/us/app/…"
          className="border-stone-200 focus-visible:ring-amber-400"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="Category"
          error={errors.category?.message}
          value={category ?? ""}
          onChange={(v) => setValue("category", v as (typeof CATEGORIES)[number])}
          options={CATEGORIES}
        />
        <SelectField
          label="Cost"
          error={errors.costModel?.message}
          value={costModel ?? ""}
          onChange={(v) => setValue("costModel", v as (typeof COST_MODELS)[number])}
          options={COST_MODELS}
        />
        <SelectField
          label="Ads"
          error={errors.adStatus?.message}
          value={adStatus ?? ""}
          onChange={(v) => setValue("adStatus", v as (typeof AD_STATUSES)[number])}
          options={AD_STATUSES}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Min Age" error={errors.ageMin?.message}>
          <Input
            {...register("ageMin", { valueAsNumber: true })}
            type="number"
            min={0}
            max={17}
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>
        <FormField label="Max Age" error={errors.ageMax?.message}>
          <Input
            {...register("ageMax", { valueAsNumber: true })}
            type="number"
            min={0}
            max={17}
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>
      </div>

      <FormField label="Interest Tags">
        <div className="flex flex-wrap gap-2 pt-1">
          {INTEREST_TAGS.map((tag) => (
            <InterestToggle
              key={tag}
              tag={tag}
              selected={interestTags.includes(tag)}
              onToggle={toggleTag}
            />
          ))}
        </div>
      </FormField>

      <FormField label="Notes" error={errors.notes?.message} hint="Anything worth knowing before installing">
        <Textarea
          {...register("notes")}
          rows={3}
          placeholder="e.g. Free tier is very capable. No account required."
          className="border-stone-200 focus-visible:ring-amber-400 resize-none"
        />
      </FormField>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="text-sm font-medium text-stone-700 mb-2">Status</p>
        <div className="flex gap-2">
          {(["Active", "Removed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue("status", s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                status === s
                  ? s === "Active"
                    ? "bg-green-100 border-green-400 text-green-900"
                    : "bg-red-100 border-red-400 text-red-900"
                  : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-1.5">
          Removed apps stay in the database but are hidden from the catalog by default.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isBusy}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isBusy ? "Saving…" : isEditing ? "Save Changes" : "Add to Catalog"}
        </Button>
        <Link href="/catalog">
          <Button type="button" variant="ghost" className="text-stone-500">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

function MissingRecord() {
  return (
    <div className="text-center py-8 text-stone-500">
      <p className="font-medium mb-1">This app isn't in the catalog.</p>
      <Link href="/catalog" className="text-sm text-amber-700 hover:text-amber-900">
        Back to Catalog
      </Link>
    </div>
  );
}

export default function AppFormPage() {
  const params = useParams<{ id?: string }>();
  const isNew = !params.id || params.id === "new";
  const appId = isNew ? undefined : Number(params.id);
  const isValidId = isNew || (Number.isInteger(appId) && appId! > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to Catalog
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">
          {isNew ? "Add App" : "Edit App"}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {isNew
            ? "Add a new app to your vetted catalog. Last verified date will be set to today."
            : "Update this app's details. Last verified date will be updated on save."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        {isValidId ? <AppFormContent appId={appId} /> : <MissingRecord />}
      </div>
    </div>
  );
}
