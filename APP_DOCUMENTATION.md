# AI Friction Pomodoro: Technical Documentation

## Project Overview
AI Friction Pomodoro is a sophisticated Chrome Extension and Dashboard system designed to combat digital addiction—specifically "brainrot" content like Reels, Shorts, and TikToks. It uses **Adaptive Friction** and **AI-Powered Coaching** to help users regain control over their attention.

---

## 1. Core Features

### 🧠 AI Focus Coach
The central interface for behavioral change. It's not just a chatbot; it's a data-aware mentor.
- **Personalized Advice**: The coach analyzes your specific browsing patterns, time spent, and brainrot scores to provide firm but empathetic guidance.
- **Data Visualization**: Integrated directly into the coach view, showing real-time Focus Vitals (Focus Score, Brainrot %, Reel Time).
- **Actionable Settings**: The AI can automatically update your settings (like increasing friction levels or changing goals) based on your conversation.
- **Block Bypass Context**: The coach sees which blocked sites you've accessed and why, allowing more targeted coaching.
- **Gemini Integration**: Powered by Gemini 1.5 Flash with refined prompts for high-impact, concise coaching.

### ⚡ Study Friction Engine (`friction.js`)
A collection of psychological interventions that make distracting content "harder" to consume.
- **Heavy Scrolling**: Accumulates wheel/touch delta. You must "fill a bar" by scrolling physically more than usual to advance to the next reel.
- **Dopamine Desaturation**: Gradually turns the page grayscale as you spend more time on a distracting site, making it visually less rewarding.
- **Intent Intercept**: After 10 consecutive reels, a popup appears asking for your "Intent." This breaks the "doomscrolling trance."
- **Conscious Preview**: Shows the title of the *next* reel while you're still fighting the current friction bar, helping you decide if it's worth the effort.
- **Transparency Timer**: A persistent, un-closable clock showing exactly how long you've been in the "void."
- **Dynamic Friction Escalation**: Friction level automatically increases based on session time (+1 every 5 mins), scroll count (+1 every 10 reels), and time of day (+1 during 10pm-2am peak hours).
- **Soft Blocking**: Blocked sites show a popup with reason buttons ("Productive Task", "Quick Check", "Add 10 mins", "Take a Break") instead of hard-blocking.

### 📊 Analytics Dashboard
A full Vue 3 application for long-term behavioral tracking.
- **Focus Score**: A composite metric (100 - Brainrot Score) representing your daily success.
- **Brainrot Chart**: Visualizes the intensity of distractions throughout the day.
- **Interest Mind Map**: An AI-generated visualization of what you've actually been looking at, categorized by interest.
- **Categorized History**: Automatically groups 150+ browser history items into logical categories using AI batch classification.
- **Settings Tab**: Configure friction tolerance (1-5), AI personality, daily goals, and blocked domains.
- **Block Bypass Chart**: Visualizes which blocked sites you've accessed, reasons chosen, and time patterns.
- **Insights View**: AI-generated behavioral analysis with personalization recommendations.

---

## 2. Technical Architecture

### 🛠️ Frontend Stack
- **Framework**: Vue 3 (SFC) with Vite.
- **State Management**: Pinia (Stores for Activity, Profile, and Chat).
- **Styling**: Vanilla CSS with custom Glassmorphism tokens.
- **Charts**: Chart.js for data visualization.

### 🧩 Chrome Extension
- **Content Scripts**: 
    - `detector.js`: Monitors scrolling and time to calculate real-time "Brainrot Scores."
    - `friction.js`: Implements the UI/UX interventions (Grayscale, Fill-bars, Overlays).
- **Background Script**: Orchestrates data flow between the content scripts and the dashboard storage.
- **Storage Adapter**: A unified layer wrapping `chrome.storage.local` and `localStorage` to provide consistent data access. It uses an automated synchronization bridge to ensure the Dashboard (Vue app) always has the most recent data from the background script.

### 🤖 AI Logic Layer (`services/`)
- **`aiPrompts.js`**: Centralized, highly-engineered system prompts for:
    - **Classification**: Identifying if a URL is "Productivity" or "Brainrot."
    - **Summarization**: Generating a 2-sentence overview of a browsing category.
    - **Coaching**: The logic behind the personalized coach's personality and data usage.
- **`aiChat.js`**: Manages the chat loop, injects user stats (last 10 sessions, aggregate averages) into the prompt context, and handles AI-triggered actions.

---

## 3. The Logic Flow

### A. Brainrot Detection
1. The **Detector** monitors `scroll` and `wheel` events on specific domains (Instagram, YouTube, etc.).
2. It calculates a **Brainrot Score** based on:
    - `Scroll Density`: How many scrolls per minute.
    - `Time Factor`: Total duration on the site.
    - `Domain Context`: Pre-categorized sites start with a higher base score.
3. If the score exceeds 50, it triggers the **Friction Engine**.

### B. Adaptive Friction
1. The engine checks the user's **Friction Tolerance** (1 to 5).
2. Level 1 might only show the timer.
3. Level 5 applies heavy scroll resistance, fast grayscale desaturation, and frequent intent checks.
4. **Scrolling logic**: Instead of blocking scroll, we intercept the event, calculate the "effort" required, and only allow the browser to `scrollBy` once the required delta is met.

### C. AI Categorization
1. When history is synced, URLs are sent to Gemini in batches (40 URLs per batch, up to 100 per sync).
2. The AI returns a JSON map of `URL -> Category`.
3. Classified results are cached to reduce API calls on future syncs.
4. Rule-based classification handles 80+ common sites instantly; AI classifies unknown sites.
5. **New Categories**: Productivity, Learning, Entertainment, Time Waste, Brainrot, Mixed, Communication, Gaming, Shopping, News, Unknown.

### D. Personalized Coaching
1. Every time a message is sent, the system pulls:
   - The User Profile (Goal, Tone, Tolerance).
   - The last 10 sessions (Duration, Score).
   - Aggregate Stats (Total time in brainrot today).
   - **Block Bypass Logs** (which blocked sites were accessed and reasons used).
2. These are injected into the **System Instruction** as "Ground Truth."
3. The AI is instructed to use these specific numbers to back up its advice, preventing generic "AI talk" and providing real, data-driven coaching.
4. The coach can reference block bypasses to provide targeted feedback (e.g., "I noticed you bypassed Reddit 3 times today...").

---

## 4. Key Design Decisions
- **Local-First & Private**: All browsing data stays in `chrome.storage.local` and `localStorage`. No external database is used, ensuring your browsing history and coaching conversations never leave your device.
- **High-End Aesthetics**: Use of vibrant gradients, subtle micro-animations (float, pulse), and backdrop-blur effects to make the app feel "Premium" and worth using.
- **Non-Destructive Blocking**: We never hard-lock the browser. Instead, we use "Friction"—making the bad habit harder to do, rather than impossible. This builds self-regulation rather than just reliance on a block-list.

---

## 5. New Features (Latest Updates)

### A. Dynamic Scroll Friction
Automatic friction escalation based on user behavior:
- **Time-based**: +1 friction level every 5 minutes on brainrot sites
- **Scroll-based**: +1 level every 10 consecutive reels watched
- **Peak hours**: +1 level additional during 10pm-2am (late-night hours)
- Max level capped at 5

### B. Soft Blocking System
Instead of hard-blocking sites, users get a choice:
- **Productive Task**: Allow unlimited access (no bypass logging)
- **Quick Check**: 2-minute bypass
- **Add 10 mins**: 10-minute temporary bypass
- **Take a Break**: Closes the tab
- **Cooldown**: Block re-triggers if user returns within 15 minutes
- **Logging**: All bypasses logged to `sf_block_logs` for dashboard display

### C. Extended Site Categories
New classification system with 10 categories:
- **Productivity** (GitHub, Slack, Notion, Jira, Figma, etc.)
- **Learning** (Coursera, LeetCode, Wikipedia, MDN, etc.)
- **Entertainment** (Netflix, Spotify, Twitch, IMDb, etc.)
- **Time Waste** (Twitter/X, Reddit, Instagram, Facebook, etc.)
- **Brainrot** (TikTok, YouTube Shorts, Instagram Reels, 9GAG, etc.)
- **Mixed** (YouTube, LinkedIn, Medium)
- **Communication** (WhatsApp Web, Telegram, Discord)
- **Gaming** (Steam, Roblox, Epic Games, itch.io)
- **Shopping** (Amazon, eBay, Etsy)
- **News** (CNN, BBC, NYTimes, Reuters)

### D. Block Bypass Logging
All block bypass events are logged with:
- Domain
- Reason selected (productive_task, quick_check, add_time, take_break)
- Timestamp
- Viewable in Dashboard under block event analytics

---

## 5. Project Structure & File Reference

### 📂 Root Directory
- `APP_DOCUMENTATION.md`: This file; the definitive technical guide.
- `package.json`: Project dependencies and scripts for the Dashboard.
- `vite.config.js`: Configuration for the Vite-powered Dashboard.

### 🧩 `extension/` (The Engine)
The heart of the browser intervention system.
- `manifest.json`: Defines extension permissions, content scripts, and the background service worker.
- `background.js`: The **Orchestrator**. It listens for URL changes, triggers AI classification, and manages data sync between the extension and the dashboard.
- **`content/`**: Scripts injected into distracting sites.
    - `detector.js`: Monitors scrolling behavior and time to calculate real-time "Brainrot Scores."
    - `friction.js`: Implements the physical and visual interventions (grayscale, scroll-resistance).
    - `friction.css`: Styling for the fill-bars and intent overlays.
- **`popup/`**: The small UI that appears when clicking the extension icon.
- **`logic/`**: Internal business logic for the extension (e.g., `adaptiveFriction.js`).

### 💻 `src/` (The Dashboard)
The Vue 3 application used for long-term tracking and coaching.
- `App.vue`: The main entry point and root layout.
- **`views/`**: Page components.
    - `DashboardView.vue`: Unified analytics overview with Intelligence, History, and Sessions tabs.
    - `ChatView.vue`: The premium AI Coach interface with data-vitals sidebar.
    - `LoginView.vue`: A simplified local access portal (session-based).
- **`components/`**: Reusable UI blocks.
    - `BrainrotChart.vue`: Daily brainrot intensity visualization.
    - `BlockBypassChart.vue`: Block bypass analytics (which sites were accessed, reasons, time patterns).
    - `FrictionProfile.vue`: User's friction preferences display.
- **`stores/`**: Pinia state management.
    - `activityStore.js`: Handles real-time session tracking and history data.
    - `chatStore.js`: Manages AI coach conversation state.
    - `profileStore.js`: Stores user goals, friction levels, and persona.

### 🧠 `services/` (The Brain)
Shared logic for AI interactions and data processing.
- `aiPrompts.js`: Contains all the system prompts that define the AI's "intelligence" and classification rules. Includes **Block Bypass Context** in coaching prompts.
- `aiChat.js`: Manages the communication loop with Gemini 1.5 Flash for the coach. Fetches `sf_block_logs` for context.
- `aiClassifier.js`: Handles the batch-processing logic for classifying large amounts of browser history.

### 💾 `storage/` & `profile/`
Data persistence and user identity.
- `storageAdapter.js`: The bridge ensuring both the Extension and the Dashboard read from the same `chrome.storage.local` instance via a sync bridge.
- `profileManager.js`: Logic for managing the "User Persona" (Goal, Tone, Tolerance).

### 🛠️ `logic/` (Shared Logic)
- `categorizer.js`: Rule-based classification for 80+ common sites with 10 categories.
- `adaptiveFriction.js`: Dynamic friction calculation including time/scroll-aware escalation.
- `brainrotScorer.js`: Sophisticated brainrot score calculation.
- `learningLoop.js`: Profile-based friction level optimization.

