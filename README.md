# 🎯 Tarkov Manager

Tarkov Manager is a web-based companion app for Escape from Tarkov built to help players manage wipe progression more efficiently. It brings together tools like quest tracking, raid planning and profit analysis in one convenient platform, so players can spend less time switching between resources and more time focusing on their objectives.

---

## ✨ Features

### 🗺️ Interactive Raid Map
- Explore detailed maps with interactive markers.
- Generate optimized routes based on your selected quests.
- Reduce unnecessary backtracking and complete objectives more efficiently.

### 📋 Quest Tracker
- Track completed and active quests.
- Monitor progression across traders.
- Stay organized throughout your wipe.

### 🛣️ Progression Routes
- Follow curated quest paths for major progression goals.
- Includes routes for:
  - **Kappa Container**
  - **Mark of the Unheard**
- View quest order and dependencies in a structured format.

### 💰 Raid Calculator
- Compare raid investment against extracted value.
- Track:
  - Gear cost
  - Consumable expenses
  - Loot value
  - Overall profit or loss

### 🏠 Hideout Planner
- Receive reminders for upcoming hideout upgrades.
- Track required materials before upgrades become available.
- Plan resource collection more effectively.

### 🔫 Ammo Tier List
- Browse and compare ammunition effectiveness.
- Quickly identify the best rounds for penetration and damage.
- Make informed loadout decisions before each raid.

### 🔧 Weapon Meta Builds
- Browse effective and popular weapon builds.
- Reference optimized attachments and configurations.
- Experiment with builds before investing in expensive parts.

---

## 🎯 Project Goal

Escape from Tarkov often requires players to switch between multiple websites for quests, maps, ballistics, hideout planning, and progression tracking.

Tarkov Manager aims to eliminate that friction by combining the most commonly used Tarkov utilities into one cohesive web application. The goal is to help players spend less time searching for information and more time playing the game.

---

## 🚀 Vision

Tarkov Manager is designed to become an all-in-one companion for every stage of a Tarkov wipe by continuously expanding its toolkit with features that improve planning, efficiency, and decision-making.

---

## 🛠️ Running locally

```bash
npm install
npm run dev
```

The app works without any setup: progress is saved in your browser. To add accounts and cloud sync, connect a Supabase project.

### Connecting Supabase

1. Copy `.env.example` to `.env.local` and fill in the **Project URL** and **publishable key** from *Project Settings → API Keys* in the Supabase dashboard. Restart `npm run dev` after changing it.
2. In *Authentication → URL Configuration*, set **Site URL** to your site (for example `http://localhost:3000`) and add `http://localhost:3000/**` under **Redirect URLs**. Add your production URL the same way when you deploy.
3. In *Authentication → Sign In / Providers*:
   - **Email**: Supabase's built-in email service only delivers to members of your Supabase team, at 2 emails per hour. Either turn off **Confirm email**, or set up custom SMTP under *Authentication → Emails* before inviting other players.
   - **Discord**: create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add `https://<project-ref>.supabase.co/auth/v1/callback` as an OAuth2 redirect, then paste the client ID and secret into the Discord provider.
   - **Google**: create an OAuth client (type *Web application*) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add the same callback URL as an authorized redirect URI, then paste the client ID and secret into the Google provider.

Signed-out visitors keep using browser storage. When someone signs in, any progress saved in that browser is merged into their account and removed from the browser.

---

## 🤝 Contributing

Contributions, suggestions, and feature requests are welcome. Feel free to open an issue or submit a pull request to help improve Tarkov Manager.

---
