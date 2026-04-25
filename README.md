# 🚀 Study Friction AI — Pomodoro Attention OS

Study Friction AI is a local-first browser extension and Vue 3 dashboard designed to actively reshape user attention through adaptive "friction" and intelligent Pomodoro tracking. Unlike typical site blockers that just block websites, this system implements dynamic interventions—like scroll delays, warning overlays, and intent popups—that adapt based on your focus history and AI-driven insights.

## ✨ Core Features
*   **Adaptive Friction Engine:** Instead of hard-blocking, it introduces measured resistance (e.g., scroll delays or popups) when you enter "brainrot" patterns on social media. The friction scales from 1 to 5 based on your profile and recent distraction metrics.
*   **AI Coach & Classification:** Integrates with the Google Gemini API to intelligently classify unknown URLs and provide personalized coaching via the chat interface. (Configurable in the UI settings with your API key).
*   **Pomodoro OS:** Built-in Pomodoro timers that sync your browsing behavior to your focus states, assigning "Focus Scores" and "Brainrot Scores" based on actual behavioral data gathered during the session.
*   **Insight Dashboard:** A sleek, glassmorphic dark-themed Vue 3 dashboard tracking your productivity trends over the week.

## 📁 System Architecture
The application is structured into two main parts:
1.  **Vue.js Dashboard (`src/`):** Built with Vue 3, Vite, Pinia, Tailwind CSS v4, and Chart.js. This serves as the "Attention OS" where you manage your sessions, view insights, and chat with the AI coach.
2.  **Chrome Extension (`extension/`):** Built with Manifest V3. Content scripts monitor scrolling and time spent on addictive sites, communicating with a background worker to apply UI overlays (friction).

### Logic & Services (`logic/`, `services/`, `storage/`, `profile/`)
The core engines are cleanly decoupled from the UI:
*   `logic/pomodoroEngine.js` manages session states and focus scoring.
*   `logic/adaptiveFriction.js` and `logic/brainrotScorer.js` determine intervention levels.
*   `services/aiChat.js` and `services/aiClassifier.js` handle requests to the Gemini API (with robust local fallbacks).
*   `storage/storageAdapter.js` provides a unified local storage layer (easily extendable to cloud databases like Supabase).

## 🛠️ Setup & Local Development

### 1. Run the Vue Dashboard
Install dependencies and run the Vite dev server:
```bash
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 2. Install the Chrome Extension
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `extension/` folder from this repository.
5. Click the extension icon in your browser toolbar to view the popup, which links to your local dashboard.

### 3. Enable AI Features
1. Go to Google AI Studio and get a **Gemini API Key**.
2. Open the **AI Coach** tab in the dashboard.
3. Enter your API Key in the settings (gear icon) to unlock smart classification and personalized coaching. If no key is provided, the system gracefully degrades to using local heuristics and fallback templates.

## 🎨 Tech Stack
*   **Frontend:** Vue 3, Vite, Tailwind CSS v4
*   **State Management:** Pinia
*   **Routing:** Vue Router
*   **Charts:** Chart.js
*   **AI Integration:** Google Gemini API (gemini-2.5-flash)
*   **Extension:** Chrome Manifest V3
