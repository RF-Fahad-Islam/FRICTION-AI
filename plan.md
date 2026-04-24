You are a senior software architect, AI systems designer, and Vue.js expert.

Your task is to DESIGN and PLAN a complete MVP system with modular architecture, adaptive AI behavior, and future scalability.

You MUST:

* Decompose the system into small independent modules
* Design each module clearly
* Show data flow and interaction
* Include diagrams and structured flows
* Plan implementation in small steps
* Recombine everything into a final working system

---

# 🚀 PROJECT

App Name:
Study Friction AI — Pomodoro Attention OS

---

# 🎯 CORE IDEA

A system that actively reshapes user attention using friction + adaptive AI.

---

# 🧩 SYSTEM COMPONENTS

## 1. Chrome Extension

* Detects doomscrolling platforms
* Applies adaptive friction (delay, resistance, cooldown)
* Tracks browsing behavior (scroll, time, sessions)
* Shows interactive popup UI (intent, warning, cooldown)

---

## 2. Vue Dashboard Web App

* Focus vs Brainrot analytics
* Pomodoro sessions
* Session summaries
* Behavioral insights
* AI chat interface

---

## 3. Landing Page

* Product intro
* Features
* Demo
* Download CTA

---

## 4. AI Layer

Handles:

* classification
* summarization
* insights
* personalization
* chat interaction

---

# ⚙️ TECH STACK

* Vue.js (Composition API)
* Tailwind CSS
* Chrome Extension (Manifest V3)
* LocalStorage (MVP)
* Future DB-ready (Supabase/Firebase)
* AI API (OpenAI or similar, optional fallback)

---

# 🧠 YOUR TASK (STRICT STRUCTURE)

---

## 🧩 PHASE 1: SYSTEM DECOMPOSITION

Define modules:

1. Extension Core
2. Friction Engine
3. Brainrot Detection Engine
4. Session Tracker (Pomodoro)
5. Categorization Engine
6. AI Classification Engine
7. Summary Engine
8. Adaptive Friction Engine
9. AI Learning Loop Engine (NEW)
10. User Profile Memory System (NEW)
11. AI Chat Engine (NEW)
12. Storage Layer (local-first, DB-ready)
13. Extension Popup UI
14. Vue Dashboard
15. Landing Page

For each:

* responsibility
* inputs
* outputs
* dependencies

---

## 🔗 PHASE 2: DATA FLOW DIAGRAM

Include full flow:

User → Browser → Extension → Logic → Storage → UI → AI → Feedback

Also include:

* AI API flow
* chat interaction flow
* learning loop feedback cycle

---

## 🧠 PHASE 3: CORE LOGIC DESIGN

Define:

1. Scroll friction system
2. Brainrot score calculation
3. Session grouping (Pomodoro)
4. Categorization rules
5. Adaptive friction logic
6. Summary generation
7. AI classification logic
8. Learning loop logic (NEW)
9. Personalization adjustments (NEW)

---

## 🧠 PHASE 4: AI CLASSIFICATION SYSTEM

(Hybrid: rules + AI)

Include:

* rule-based classification
* AI fallback classification
* confidence scoring
* context-aware behavior (scroll/time)

---

## 🔁 PHASE 5: AI LEARNING LOOP (VERY IMPORTANT)

Design a system that continuously improves behavior control.

### Loop:

1. Track behavior
2. Evaluate session:

   * focus vs brainrot
   * user responses to friction
3. Adjust:

   * friction strength
   * popup timing
   * classification sensitivity

---

### Example logic:

IF user ignores friction → increase intensity
IF user exits early → reduce friction
IF user engages → stabilize

---

### Output:

* updated user profile
* updated system parameters

---

## 🧠 PHASE 6: USER AI PROFILE MEMORY SYSTEM

Design persistent user memory:

### Store:

```json id="mem1"
{
  "frictionTolerance": 2,
  "avgScrollSession": 18,
  "peakDistractionTime": "9pm-12am",
  "highRiskSites": ["reels", "shorts"],
  "focusPatterns": ["productive in morning"],
  "userPreferences": {
    "tone": "strict | chill",
    "goal": "study | relax balance"
  }
}
```

---

### Behavior:

* system adapts per user
* evolves over time
* used by:

  * friction engine
  * AI chat
  * summaries

---

## 💬 PHASE 7: AI CHAT SYSTEM (NEW CORE FEATURE)

Design an AI chat interface where user can:

* ask:

  * “Why am I distracted?”
  * “Help me focus”
* give preferences:

  * “Be stricter”
  * “Don’t interrupt too much”

---

### Chat Effects:

* updates user profile
* changes friction behavior
* modifies tone of system messages

---

### Chat Memory:

* store key preferences
* use in future interactions

---

## 🗂 PHASE 8: FILE & FOLDER STRUCTURE

Include:

* extension/
* src/ (Vue)
* landing/
* logic/
* services/
* store/

Include:

* AI service layer
* memory/profile module

---

## 👥 PHASE 9: TEAM DIVISION (3 PEOPLE)

1. Extension + Friction Engineer
2. Logic + AI Engineer
3. UI Engineer (Dashboard + Chat + Landing + Popup)

---

## 📅 PHASE 10: 2-DAY BUILD PLAN

Day 1:

* friction
* tracking
* basic UI

Day 2:

* AI classification
* summaries
* learning loop
* chat UI
* landing page

---

## 🧪 PHASE 11: INTEGRATION STRATEGY

Explain:

* extension → logic
* logic → storage
* storage → Vue UI
* chat → profile → system behavior

---

## 📊 PHASE 12: DATA MODEL

Include:

* sessions
* profile
* chat history
* summaries

Design for future DB.

---

## 🤖 PHASE 13: AI API INTEGRATION

Include:

* classification prompts
* summary prompts
* chat prompts
* fallback strategies

---

## 🎨 PHASE 14: UI/UX FLOW

### Popup:

* intent
* warning
* cooldown

### Dashboard:

* stats
* sessions
* insights

### Chat:

* conversational UI
* suggestion buttons

### Landing:

* hero
* features
* CTA

---

## 🔁 PHASE 15: FINAL SYSTEM RECOMPOSITION

Combine everything:

* full architecture
* complete lifecycle

---

## 🏆 PHASE 16: DEMO FLOW

1. user opens reels
2. friction triggers
3. popup appears
4. user interacts
5. chat adjusts system
6. dashboard updates
7. summary generated

---

## ⚠️ PHASE 17: SIMPLIFICATION STRATEGY

List:

* what to skip
* what to fake
* fallback options

---

# 📌 IMPORTANT RULES

* Buildable in 2 days
* No overengineering
* Modular design
* AI enhances, not required
* Strong demo focus

---

# 🎯 OUTPUT GOAL

A complete system blueprint that includes:

* AI classification
* learning loop
* user memory system
* AI chat personalization
* Vue dashboard
* extension popup UI
* landing page
* future scalability
