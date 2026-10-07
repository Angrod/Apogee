Apogee — Stage 1 Replit Prompt (Plan Mode)

Paste everything below into a new Replit project with Plan mode checked.


I want to build a web app called "Apogee" — a personal family app management tool for tracking and curating apps for my 3 children's iPads. This is currently for personal/family use, but is also the seed of a future commercial product, so please build it cleanly rather than as a throwaway prototype.

Core Concept

Parent (me) creates child profiles, maintains a curated catalog of vetted apps, and gets age/interest-matched recommendations per child. The app tracks what's been pushed/installed on each child's device. No real MDM yet — "push" is just a status tracker for now, actual installation is still manual on my end.

Build Process

Please build incrementally and pause for my review after each major section (database schema, child profiles, app catalog, dashboard) rather than attempting the entire app in one continuous pass. I'd rather catch issues early than debug a large finished build.

Before building, please propose your planned file/folder structure and database schema so I can review it first.

Tech Stack Preference


React frontend
Simple backend (Node/Express is fine)
SQLite for now — this is single-user personal use at small scale. Please use an ORM (Prisma or Drizzle) rather than raw SQL queries, so a future migration to PostgreSQL is straightforward if/when this expands beyond personal use.
No authentication needed yet — this is personal use only right now
Mobile responsive — I'll be using this from my phone often


Database Design Notes


Use a proper junction/relationship table for app status — status (Not Installed/Pushed/Installed/Removed) must be tracked PER CHILD PER APP, not as a single field on the Apps table. A child_app_status table linking children and apps is the right pattern here.
Seed data should be inserted as actual database rows via a seed script, not hardcoded into frontend components — I'll be adding new apps through the Add App form regularly and want seed apps to be indistinguishable from ones added later.
When an app is "Removed" from the catalog, keep the record (soft delete / status flag) rather than actually deleting the row — I want to preserve my notes on why I removed something.
Each app should have a "last verified" date field, set when I add or edit the app, so I can see at a glance which catalog entries haven't been checked in a while.


Child Profiles

3 children, each with:


Name
Age
Interests (multi-select): Engineering, Baking/Food, Music, Drawing, Reading, Math, Science, Gaming, Language Learning
Assigned device name (e.g. "Sam's iPad")
Screen time goal (weekday/weekend hours)
Apple Arcade subscription active (boolean — when true, games category should show a note like "via Arcade" instead of catalog games; this is just a display flag for now, not real integration)


App Catalog

Each app entry needs:


App name
App Store URL
Category (Games, Education, Creative, Music, Reading)
Age range (min/max)
Interest tags (same list as above)
Cost model (Free / One-time purchase / Subscription)
Ad status (No Ads / Minimal / Has Ads)
Notes (why I picked this app)
Last verified date
Status flag (Active / Removed — soft delete, see above)
Status PER CHILD (separate status for each of my 3 kids via the junction table): Not Installed / Pushed / Installed / Removed


Main Dashboard


Three columns, one per child
Each shows their matched apps (filtered by age + interest), grouped by status
Each app card: name, cost badge, App Store link, status dropdown, "Mark as Pushed" button


Add/Edit App Flow

Simple form to add new apps to the catalog as I discover them. Saves and immediately appears in matching kids' recommended lists. Sets "last verified" date automatically on save.

Data Export

Add a simple "Export Data" button that downloads all catalog + child profile data as JSON. No need for import yet — just a safety net so I can back this up periodically.

Seed Data

Please seed the catalog with these 10 apps to start: Khan Academy Kids, GarageBand, Aqua by Adobe, Cargo-Bot, Duolingo ABC, PBS Kids Games, Toca Boca Jr, Simple Machines by Tinybop, Sketchbook, Endless Alphabet — use reasonable age ranges, interest tags, and cost models for each based on what you know about them. Insert via seed script as real rows, not hardcoded.

UI Direction

UI should feel warm and approachable, not clinical/enterprise — avoid the default blue-and-white SaaS dashboard look.

What NOT To Build Yet


No authentication/login system
No actual MDM or device push capability
No mobile native app
No billing/subscription system
No multi-family support — this is just for my 3 kids
No "Modes" system (Homework/Educational/Free Play) — that requires real device enforcement that doesn't exist yet
No real Apple Arcade/Epic catalog integration — just the simple boolean flag described above