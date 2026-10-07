import { db, pool } from "./index";
import { appsTable } from "./schema/apps";
import { childrenTable } from "./schema/children";
import { eq } from "drizzle-orm";

type NewApp = typeof appsTable.$inferInsert;
type NewChild = typeof childrenTable.$inferInsert;

// Starter catalog. Pricing, ad, and listing details were checked on
// 2026-10-07; re-verify before relying on them. Age ranges are the parent's
// picks, not App Store ratings.
const seedApps: NewApp[] = [
  {
    name: "Khan Academy Kids",
    appStoreUrl: "https://apps.apple.com/us/app/khan-academy-kids/id1378467277",
    category: "Education",
    ageMin: 2,
    ageMax: 8,
    interestTags: ["Math", "Reading", "Science"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Adaptive early-learning curriculum. Free, no ads, no in-app purchases.",
  },
  {
    name: "GarageBand",
    appStoreUrl: "https://apps.apple.com/us/app/garageband/id408709785",
    category: "Music",
    ageMin: 3,
    ageMax: 17,
    interestTags: ["Music"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Apple's music studio. Smart Drums works for toddlers who just tap. Apple rates it 4+; set to 3 on purpose.",
  },
  {
    name: "Aqua by Adobe",
    appStoreUrl: "https://apps.apple.com/app/id6751648936",
    category: "Creative",
    ageMin: 5,
    ageMax: 12,
    interestTags: ["Drawing"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Adobe's drawing and coloring app built for kids 5–12. Ad-free. Listed as \"Project Aqua: Adobe for Kids\".",
  },
  {
    name: "Cargo-Bot",
    appStoreUrl: "https://apps.apple.com/us/app/cargo-bot/id519690913",
    category: "Education",
    ageMin: 7,
    ageMax: 14,
    interestTags: ["Engineering", "Math"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Programming puzzles: teaches logic and sequencing through robot commands.",
  },
  {
    name: "Duolingo ABC",
    appStoreUrl: "https://apps.apple.com/us/app/duolingo-abc-kids-reading/id1440502568",
    category: "Reading",
    ageMin: 3,
    ageMax: 6,
    interestTags: ["Reading", "Language Learning"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Phonics and early reading for young learners.",
  },
  {
    name: "PBS Kids Games",
    appStoreUrl: "https://apps.apple.com/us/app/pbs-kids-games/id1050773989",
    category: "Education",
    ageMin: 2,
    ageMax: 8,
    interestTags: ["Math", "Science", "Reading"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Games with Curious George, Daniel Tiger, and more.",
  },
  {
    name: "Toca Boca Jr",
    appStoreUrl: "https://apps.apple.com/us/app/toca-boca-jr/id1576695716",
    category: "Games",
    ageMin: 2,
    ageMax: 6,
    interestTags: ["Drawing", "Gaming"],
    costModel: "Subscription",
    adStatus: "No Ads",
    notes: "Bundles Toca Boca's classic apps (the standalone ones were pulled in 2024). About $7.99/month, or part of the Piknik plan.",
  },
  {
    name: "Simple Machines by Tinybop",
    appStoreUrl: "https://apps.apple.com/us/app/simple-machines-by-tinybop/id823226965",
    category: "Education",
    ageMin: 4,
    ageMax: 10,
    interestTags: ["Engineering", "Science"],
    costModel: "One-time purchase",
    adStatus: "No Ads",
    notes: "Levers, wheels, pulleys, inclined planes. Hands-on STEM.",
  },
  {
    name: "Sketchbook",
    appStoreUrl: "https://apps.apple.com/us/app/sketchbook-draw-paint-doodle/id883738213",
    category: "Creative",
    ageMin: 6,
    ageMax: 17,
    interestTags: ["Drawing"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Full drawing app with layers and brushes; better for older kids.",
  },
  {
    name: "Endless Alphabet",
    appStoreUrl: "https://apps.apple.com/us/app/endless-alphabet/id591626572",
    category: "Reading",
    ageMin: 2,
    ageMax: 6,
    interestTags: ["Reading", "Language Learning"],
    costModel: "One-time purchase",
    adStatus: "No Ads",
    notes: "Vocabulary through animated puzzles. About $8.99, no in-app purchases.",
  },
];

// Placeholder profiles for development. The repo is public: never put real
// family details here. Ages and interests are chosen so every profile matches
// several starter apps.
const seedChildren: NewChild[] = [
  {
    name: "Sample Child A",
    age: 3,
    interests: ["Music", "Drawing"],
    deviceName: "iPad A",
    screenTimeWeekday: 45,
    screenTimeWeekend: 60,
    appleArcade: false,
  },
  {
    name: "Sample Child B",
    age: 6,
    interests: ["Reading", "Baking/Food", "Drawing"],
    deviceName: "iPad B",
    screenTimeWeekday: 60,
    screenTimeWeekend: 90,
    appleArcade: false,
  },
  {
    name: "Sample Child C",
    age: 9,
    interests: ["Engineering", "Math", "Science", "Gaming"],
    deviceName: "iPad C",
    screenTimeWeekday: 90,
    screenTimeWeekend: 120,
    appleArcade: true,
  },
];

// Inserts rows whose name doesn't exist yet. Never overwrites existing rows,
// so it's safe to re-run; it is not a way to update catalog entries.
// Sample children are opt-in (`--with-sample-children`): children can't be
// deleted through the app, so they shouldn't land in a real database by default.
const withSampleChildren = process.argv.includes("--with-sample-children");

async function seed() {
  for (const app of seedApps) {
    const existing = await db.select().from(appsTable).where(eq(appsTable.name, app.name));
    if (existing.length === 0) {
      await db.insert(appsTable).values(app);
      console.log(`  app inserted: ${app.name}`);
    } else {
      console.log(`  app skipped (exists): ${app.name}`);
    }
  }

  if (!withSampleChildren) {
    console.log("  sample children skipped (pass --with-sample-children to add them)");
    return;
  }
  for (const child of seedChildren) {
    const existing = await db.select().from(childrenTable).where(eq(childrenTable.name, child.name));
    if (existing.length === 0) {
      await db.insert(childrenTable).values(child);
      console.log(`  child inserted: ${child.name}`);
    } else {
      console.log(`  child skipped (exists): ${child.name}`);
    }
  }
}

seed()
  .then(() => console.log("Seeding complete."))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
