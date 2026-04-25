# 🏛 Study Friction AI — System Architecture & Design Document

This document provides a comprehensive overview of the **Study Friction AI** system design, detailing its modular architecture, core engines, AI integrations, data flow, and file-by-file breakdowns. It synthesizes the original blueprints (`plan.md`, `architecture_part1.md`, `architecture_part2.md`) and maps them to the implemented MVP.

---

## 🚀 1. System Overview

**Study Friction AI** is a local-first Pomodoro Attention OS designed to actively reshape user attention through adaptive "friction." Rather than simply hard-blocking websites, the system introduces measured resistance (e.g., scroll delays, intention popups) when users enter "brainrot" patterns. The system adapts its strictness based on the user's ongoing behavior and feedback via an AI Coach.

### 🧩 Core Components Architecture Diagram

```mermaid
graph TD
    subgraph Browser["Google Chrome"]
        Extension[Manifest V3 Extension]
        ContentScripts[Content Scripts]
        Popup[Extension Popup UI]
    end

    subgraph LogicLayer["Core Logic (Vanilla JS)"]
        FrictionEngine[Adaptive Friction Engine]
        BrainrotScorer[Brainrot Scorer]
        PomodoroEngine[Pomodoro Tracker]
        LearningLoop[Learning Loop]
        Categorizer[Categorizer]
    end

    subgraph AILayer["AI Integrations"]
        AIChat[AI Chat Engine]
        AIClassifier[AI Classifier Engine]
    end

    subgraph DataLayer["Storage & Memory"]
        StorageAdapter[(Unified Storage)]
        ProfileManager[(User Profile Memory)]
    end

    subgraph VueApp["Vue 3 Dashboard"]
        Dashboard[Insights Dashboard]
        SessionView[Pomodoro Sessions]
        ChatView[AI Coach Interface]
    end

    %% Connections
    Browser --> LogicLayer
    LogicLayer --> DataLayer
    VueApp --> DataLayer
    LogicLayer --> AILayer
    AILayer -.->|Calls| GeminiAPI((Gemini 2.5 API))
```

---

## 🔄 2. Data Flow & Lifecycle

The data lifecycle connects the user's browsing behavior directly to the intervention overlays and finally to the dashboard analytics.

```mermaid
sequenceDiagram
    participant User
    participant Browser as Content Script
    participant BG as Background Worker
    participant Scorer as Brainrot Scorer
    participant Friction as Friction Engine
    participant Store as Storage Adapter

    User->>Browser: Opens Instagram Reels
    Browser->>Browser: Track DOM & Scroll Velocity
    Browser->>BG: Send raw telemetry
    BG->>Scorer: Calculate Base Score
    Scorer-->>BG: Return 85/100 (High Risk)
    BG->>Friction: Determine Friction Level
    Friction-->>BG: Return Level 4 (Popup Overlay)
    BG->>Browser: Inject Friction UI
    Browser->>User: "Why are you here?" Prompt
    User->>Browser: Interacts with Friction
    Browser->>BG: Log Interaction Result
    BG->>Store: Persist Event Data
```

---

## 📂 3. Directory & File Breakdown

The project is strictly modular, allowing the core logic to be agnostic of the UI framework.

### 📌 Extension Core (`extension/`)
Handles all browser-level integrations (Manifest V3).

*   `manifest.json`: Defines permissions (`storage`, `tabs`), background worker, and content scripts targeting specific domains.
*   `background.js`: The central message bus. Monitors tab URLs, matches them against patterns, and coordinates configurations.
*   `content/detector.js`: Monitors DOM mutations, scroll velocity, and time spent.
*   `content/friction.js`: Receives friction levels and applies interventions (CSS delays, blocking overlays).
*   `content/friction.css`: Contains the CSS for the injected friction overlays.
*   `popup/popup.html` & `popup.js`: The mini-UI accessible via the extension icon.

### 📌 UI Framework & Dashboard (`src/`)
Built with Vue 3, Vite, Tailwind CSS v4, and Pinia.

*   `main.js`: Initializes Vue, Pinia, and Vue Router (using `createWebHashHistory`).
*   `App.vue`: The root component containing the application layout.
*   `style.css`: The global CSS containing the Tailwind v4 `@theme` definitions.
*   **Views (`src/views/`)**: `LandingView.vue`, `DashboardView.vue`, `SessionsView.vue`, `InsightsView.vue`, `ChatView.vue`.
*   **Stores (`src/stores/`)**: `sessionStore.js`, `profileStore.js`, `chatStore.js`.
*   **Components (`src/components/`)**: `PomodoroTimer.vue`, `BrainrotChart.vue`.

### 📌 Core Logic (`logic/`)
Pure, framework-agnostic business logic.

*   `brainrotScorer.js`: Calculates a "Brainrot Score" (0-100) based on raw metrics.
*   `categorizer.js`: Rule-based system mapping known URLs to categories. Defers to AI if unknown.
*   `adaptiveFriction.js`: Maps Brainrot Scores to a "Friction Level" (1: None, 2: Delay, 3: Warning, 4: Hard Prompt, 5: Lockout).
*   `pomodoroEngine.js`: Manages the lifecycle of a focus session.
*   `learningLoop.js`: Evaluates completed sessions to determine if the baseline friction settings should be adjusted.

### 📌 Storage & Memory (`storage/` & `profile/`)
*   `storageAdapter.js`: A unified key-value interface wrapping `localStorage` (syncs with `chrome.storage`).
*   `profileManager.js`: Manages the persistent AI User Profile (`sf_profile`).

### 📌 AI Integration (`services/`)
Handles all external LLM processing via the **Google Gemini API**.

*   `aiPrompts.js`: Contains JSON-structured prompt templates (`classifyPrompt`, `summarizePrompt`, `chatPrompt`).
*   `aiClassifier.js`: A hybrid classification tool (Cache -> Rules -> AI Fallback).
*   `aiChat.js`: Orchestrates the chat with the AI Coach and parses Action outputs.

---

## 🧠 4. AI Learning Loop & Adaptive Friction Flow

The system's standout feature is that it continuously learns from the user's responses to interventions.

```mermaid
graph LR
    subgraph Step 1: Detect
    Behavior[High Scroll Velocity] --> Score[Score Spike]
    end
    
    subgraph Step 2: Intervene
    Score --> |Tolerance Check| Intervention[Level 4 Overlay]
    Intervention --> Ignore[User Ignores/Bypasses]
    Intervention --> Stop[User Closes Tab]
    end
    
    subgraph Step 3: Learn
    Ignore --> |Penalize| LowerTol[Decrease Tolerance]
    Stop --> |Reward| KeepTol[Maintain Settings]
    end
    
    subgraph Step 4: Adapt
    LowerTol --> UpdateProf[Update User Profile]
    KeepTol --> UpdateProf
    UpdateProf -.-> |Next Session| Behavior
    end
```

---

## 💬 5. AI Coach Chat Interaction Flow

The chat engine doesn't just talk; it alters system behavior using embedded Action Tags.

```mermaid
sequenceDiagram
    participant User
    participant Chat UI
    participant aiChatService as AI Chat Service
    participant Gemini as Gemini API
    participant Profile as Profile Manager

    User->>Chat UI: "Make the friction less annoying"
    Chat UI->>aiChatService: send message
    aiChatService->>Profile: get current memory state
    Profile-->>aiChatService: returns {tolerance: 2, tone: "strict"}
    aiChatService->>Gemini: construct Prompt + Profile Context
    Gemini-->>aiChatService: "Okay, relaxing settings. [ACTION: UPDATE_TOLERANCE_HIGHER]"
    aiChatService->>aiChatService: Parse [ACTION] Tags
    aiChatService->>Profile: updateTolerance(+1)
    aiChatService-->>Chat UI: return response
    Chat UI->>User: Display response
```

---

## ⏱️ 6. Pomodoro Session Lifecycle

How focus and break sessions track data internally.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> FocusSession: Start Work
    
    state FocusSession {
        [*] --> Tracking
        Tracking --> LoggingBehavior
        LoggingBehavior --> Distracted: Brainrot Detected
        LoggingBehavior --> Focused: Clean Browsing
        Distracted --> Tracking
        Focused --> Tracking
    }
    
    FocusSession --> BreakSession: Time's Up
    
    state BreakSession {
        [*] --> Relaxing
        Relaxing --> ResettingFocus
    }
    
    BreakSession --> Idle: End
    BreakSession --> FocusSession: Next Pomodoro
    
    FocusSession --> SummaryCalculated: End Session Early
    SummaryCalculated --> [*]
```

---

## 🛠️ 7. Scalability & Future Roadmap

* **Database Swap:** Because all data operations route through `storageAdapter.js`, migrating to Supabase or Firebase simply requires writing a new adapter class.
* **Cross-Device Sync:** The `profileManager.js` data object can easily be synced to the cloud, allowing the AI's understanding of the user to persist across desktop and mobile browsers.
* **Advanced Metrics:** `detector.js` can be expanded to monitor DOM elements specific to new addiction-engineered platforms.

---
*Document generated for the Study Friction AI Hackathon MVP.*
