import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChild,
  useCreateChild,
  useUpdateChild,
  getListChildrenQueryKey,
  getGetChildQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import type { Child } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { minutesToHours, hoursToMinutes } from "@/lib/screen-time";

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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int("Age must be a whole number")
    .min(1, "Age must be at least 1")
    .max(17, "Age must be 17 or under"),
  deviceName: z.string().min(1, "Device name is required"),
  interests: z.array(z.string()).default([]),
  screenTimeWeekday: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(24, "Cannot exceed 24 hours"),
  screenTimeWeekend: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(24, "Cannot exceed 24 hours"),
  appleArcade: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

function InterestToggle({
  tag,
  selected,
  onToggle,
}: {
  tag: string;
  selected: boolean;
  onToggle: (tag: string) => void;
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

function ChildFormContent({ childId }: { childId?: number }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = childId !== undefined;

  const {
    data: existingChild,
    isError: isChildError,
  } = useGetChild(childId ?? 0, {
    query: { enabled: isEditing, queryKey: getGetChildQueryKey(childId ?? 0) },
  });

  // Keep every view of children in sync after a save. Writing the saved record
  // into its own cache entry stops a reopened form from showing pre-save values.
  function syncAfterSave(saved: Child) {
    queryClient.setQueryData(getGetChildQueryKey(saved.id), saved);
    queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  }

  const createMutation = useCreateChild({
    mutation: {
      onSuccess: (saved) => {
        syncAfterSave(saved);
        toast({ title: "Child profile created" });
        navigate("/children");
      },
      onError: () => {
        toast({ title: "Failed to create profile", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateChild({
    mutation: {
      onSuccess: (saved) => {
        syncAfterSave(saved);
        toast({ title: "Profile saved" });
        navigate("/children");
      },
      onError: () => {
        toast({ title: "Failed to save profile", variant: "destructive" });
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
      age: undefined,
      deviceName: "",
      interests: [],
      screenTimeWeekday: 2,
      screenTimeWeekend: 3,
      appleArcade: false,
    },
  });

  useEffect(() => {
    if (existingChild) {
      reset({
        name: existingChild.name,
        age: existingChild.age,
        deviceName: existingChild.deviceName,
        interests: (existingChild.interests as string[]) ?? [],
        screenTimeWeekday: minutesToHours(existingChild.screenTimeWeekday),
        screenTimeWeekend: minutesToHours(existingChild.screenTimeWeekend),
        appleArcade: existingChild.appleArcade,
      });
    }
  }, [existingChild, reset]);

  const interests = watch("interests") ?? [];
  const appleArcade = watch("appleArcade");

  function toggleInterest(tag: string) {
    const current = interests;
    if (current.includes(tag)) {
      setValue("interests", current.filter((t) => t !== tag));
    } else {
      setValue("interests", [...current, tag]);
    }
  }

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      age: values.age,
      deviceName: values.deviceName,
      interests: values.interests,
      screenTimeWeekday: hoursToMinutes(values.screenTimeWeekday),
      screenTimeWeekend: hoursToMinutes(values.screenTimeWeekend),
      appleArcade: values.appleArcade,
    };

    if (childId !== undefined) {
      updateMutation.mutate({ id: childId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  if (isEditing && isChildError) {
    return <MissingRecord />;
  }

  // Only show the edit form once the record has loaded, so it never opens empty.
  if (isEditing && !existingChild) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="Name" error={errors.name?.message}>
          <Input
            {...register("name")}
            placeholder="e.g. Olivia"
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>

        <FormField label="Age" error={errors.age?.message}>
          <Input
            {...register("age", { valueAsNumber: true })}
            type="number"
            min={1}
            max={17}
            placeholder="e.g. 9"
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>
      </div>

      <FormField label="Device Name" error={errors.deviceName?.message}>
        <Input
          {...register("deviceName")}
          placeholder="e.g. Olivia's iPad"
          className="border-stone-200 focus-visible:ring-amber-400"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          label="Weekday Screen Time"
          error={errors.screenTimeWeekday?.message}
          hint="Hours per day (e.g. 1.5)"
        >
          <Input
            {...register("screenTimeWeekday", { valueAsNumber: true })}
            type="number"
            step="any"
            min={0}
            max={24}
            placeholder="2"
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>

        <FormField
          label="Weekend Screen Time"
          error={errors.screenTimeWeekend?.message}
          hint="Hours per day (e.g. 3)"
        >
          <Input
            {...register("screenTimeWeekend", { valueAsNumber: true })}
            type="number"
            step="any"
            min={0}
            max={24}
            placeholder="3"
            className="border-stone-200 focus-visible:ring-amber-400"
          />
        </FormField>
      </div>

      <FormField label="Interests">
        <div className="flex flex-wrap gap-2 pt-1">
          {INTEREST_TAGS.map((tag) => (
            <InterestToggle
              key={tag}
              tag={tag}
              selected={interests.includes(tag)}
              onToggle={toggleInterest}
            />
          ))}
        </div>
        {errors.interests && (
          <p className="text-xs text-red-600 mt-1">{errors.interests.message}</p>
        )}
      </FormField>

      <div className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
        <div>
          <p className="text-sm font-medium text-stone-700">Apple Arcade</p>
          <p className="text-xs text-stone-400 mt-0.5">This child has access to Apple Arcade games</p>
        </div>
        <Switch
          checked={appleArcade}
          onCheckedChange={(val) => setValue("appleArcade", val)}
          className="data-[state=checked]:bg-amber-600"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isBusy}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isBusy ? "Saving…" : isEditing ? "Save Changes" : "Create Profile"}
        </Button>
        <Link href="/children">
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
      <p className="font-medium mb-1">This profile doesn't exist.</p>
      <Link href="/children" className="text-sm text-amber-700 hover:text-amber-900">
        Back to Children
      </Link>
    </div>
  );
}

export default function ChildFormPage() {
  const params = useParams<{ id?: string }>();
  const isNew = !params.id || params.id === "new";
  const childId = isNew ? undefined : Number(params.id);
  const isValidId = isNew || (Number.isInteger(childId) && childId! > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/children" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to Children
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">
          {isNew ? "Add Child" : "Edit Child"}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {isNew ? "Set up a new child profile." : "Update this child's profile."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        {isValidId ? <ChildFormContent childId={childId} /> : <MissingRecord />}
      </div>
    </div>
  );
}
