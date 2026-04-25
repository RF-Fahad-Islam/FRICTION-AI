# 🚀 Study Friction AI — Attention OS

Study Friction AI is a local-first browser extension and AI-powered dashboard designed to actively reshape user attention through **Adaptive Friction** and intelligent behavioral coaching. Unlike typical site blockers that just block websites, this system implements dynamic interventions—like scroll delays, dopamine desaturation, and intent popups—that build self-regulation rather than just reliance on a blocklist.

---

## ✨ Core Features

### ⚡ Study Friction Engine
A collection of psychological interventions that make distracting content "harder" to consume.
- **Dynamic Scroll Resistance**: Intercepts scrolling on addictive sites, requiring physical effort (measured delta) to move to the next piece of content.
- **Grayscale Desaturation**: Gradually turns the page black-and-white as you linger on distracting sites, reducing visual dopamine rewards.
- **Intent Intercepts**: Periodic popups that break the "doomscrolling trance" by asking for your current intention.
- **Soft Blocking**: Instead of hard-locking, it offers timed bypasses with required justification (e.g., "Productive Task", "Quick Check").

### 📊 Intelligence Dashboard
A sleek, glassmorphic Vue 3 application for long-term behavioral tracking.
- **Focus Score**: A composite metric representing your daily success.
- **Interest Mind Map**: An AI-generated visualization of your browsing interests.
- **Categorized History**: Automatically groups 150+ sites into logical categories (Learning, Time Waste, Brainrot, etc.) using AI batch classification.
- **Block Analytics**: Visualizes which blocked sites you've accessed and the reasons you gave.

---

## 🛠️ Setup & Installation

### 1. Run the Dashboard (Vue.js)
The dashboard is built with Vue 3 and Vite.
```bash
# Navigate to the project root
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 2. Install the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked**.
4. Select the `extension/` folder from this repository.
5. Pin the extension for easy access to the popup and dashboard.

### 3. Enable AI Features
1. Obtain a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
2. Open the **Dashboard** -> **Settings**.
3. Enter your API Key to unlock AI-powered categorization and coaching.

---

## 📁 Project Structure

| Directory | Purpose |
| :--- | :--- |
| `extension/` | **The Engine**: Content scripts (`friction.js`), detector, and manifest. |
| `src/` | **The Dashboard**: Vue 3 application, stores, and UI components. |
| `storage/` | **The Bridge**: `storageAdapter.js` for real-time sync between Extension and Dashboard. |
| `services/` | **The Brain**: AI Prompts, Gemini integration, and batch classifiers. |
| `logic/` | **The Logic**: Scoring algorithms, categorizers, and friction calculators. |

---

## 🎨 Tech Stack
- **Frontend**: Vue 3, Pinia, Vite, Tailwind CSS v4
- **Charts**: Chart.js, Vue-ECharts
- **AI**: Google Gemini 1.5 Flash
- **Extension**: Manifest V3 (Service Workers, Content Scripts)

---

## 📄 Documentation
For a deep dive into the architecture and algorithms, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and data flow.
- [FRICTION_ENGINE.md](./FRICTION_ENGINE.md) - Details on the psychological intervention logic.

---
*Built for the Friction Hackathon — Reclaiming attention, one scroll at a time.*
