import type {
  adStatusEnum,
  catalogStatusEnum,
  categoryEnum,
  costModelEnum,
  installStatusEnum,
  interestTagEnum,
} from "@workspace/db";
import type {
  AdStatus,
  CatalogStatus,
  Category,
  CostModel,
  InstallStatus,
  InterestTag,
} from "@workspace/api-zod";

// Compile-time check that every DB enum (lib/db/src/schema/enums.ts) has
// exactly the values of its counterpart in openapi.yaml. If you add a value
// to one side only, `pnpm run typecheck` fails here.

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Expect<T extends true> = T;
type DbValues<E extends { enumValues: readonly string[] }> = E["enumValues"][number];

export type EnumContract = [
  Expect<Equal<DbValues<typeof interestTagEnum>, InterestTag>>,
  Expect<Equal<DbValues<typeof categoryEnum>, Category>>,
  Expect<Equal<DbValues<typeof costModelEnum>, CostModel>>,
  Expect<Equal<DbValues<typeof adStatusEnum>, AdStatus>>,
  Expect<Equal<DbValues<typeof catalogStatusEnum>, CatalogStatus>>,
  Expect<Equal<DbValues<typeof installStatusEnum>, InstallStatus>>,
];
