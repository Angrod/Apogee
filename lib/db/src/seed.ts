import { db } from "./index";
import { appsTable } from "./schema/apps";
import { eq } from "drizzle-orm";

const seedApps = [
  {
    name: "Khan Academy Kids",
    appStoreUrl: "https://apps.apple.com/us/app/khan-academy-kids/id1378467277",
    category: "Education",
    ageMin: 2,
    ageMax: 8,
    interestTags: ["Math", "Reading", "Science"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Comprehensive early learning with adaptive curriculum. No ads, fully free.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  },
  {
    name: "GarageBand",
    appStoreUrl: "https://apps.apple.com/us/app/garageband/id408709785",
    category: "Music",
    ageMin: 6,
    ageMax: 17,
    interestTags: ["Music"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Apple's full-featured music creation app. Excellent for music interest.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  },
  {
    name: "Aqua by Adobe",
    appStoreUrl: "https://apps.apple.com/us/app/adobe-photoshop-sketch/id528542440",
    category: "Creative",
    ageMin: 8,
    ageMax: 17,
    interestTags: ["Drawing"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Adobe watercolor painting app with natural media brushes. Great for creative expression.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
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
    notes: "Programming puzzle game. Teaches logic and sequencing through robot commands.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
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
    notes: "Learn to read with phonics. Designed for young learners, no ads.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
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
    notes: "Games featuring Curious George, Daniel Tiger, and more. Safe and educational.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  },
  {
    name: "Toca Boca Jr",
    appStoreUrl: "https://apps.apple.com/us/app/toca-boca-jr/id1576695716",
    category: "Games",
    ageMin: 2,
    ageMax: 6,
    interestTags: ["Drawing"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Open-ended creative play worlds from Toca Boca. No ads, no in-app pressure.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
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
    notes: "Explore levers, wheels, pulleys, inclined planes. Hands-on STEM learning.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
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
    notes: "Full-featured drawing app with layers and brushes. Autodesk made this free.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  },
  {
    name: "Endless Alphabet",
    appStoreUrl: "https://apps.apple.com/us/app/endless-alphabet/id741853767",
    category: "Reading",
    ageMin: 2,
    ageMax: 6,
    interestTags: ["Reading", "Language Learning"],
    costModel: "Free",
    adStatus: "No Ads",
    notes: "Vocabulary building through animated puzzles. Charming and effective for early learners.",
    status: "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  },
];

async function seed() {
  console.log("Seeding apps...");
  for (const app of seedApps) {
    const existing = await db
      .select()
      .from(appsTable)
      .where(eq(appsTable.name, app.name));
    if (existing.length === 0) {
      await db.insert(appsTable).values(app);
      console.log(`  Inserted: ${app.name}`);
    } else {
      console.log(`  Skipped (already exists): ${app.name}`);
    }
  }
  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
