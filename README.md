# AI Hiring Transparency Dashboard
**BIUST Final Year Project — Kago Kebonye, 2025**

## Folder Structure

```
hiring-dashboard/
├── src/
│   ├── App.jsx                          ← Main entry: state, handlers, routing between tabs
│   ├── theme.js                         ← Colour palette (import C from "./theme")
│   │
│   ├── utils/
│   │   └── dataUtils.js                 ← All data logic: generate, parse, score, SHAP, LIME, fairness
│   │
│   └── components/
│       ├── SharedComponents.jsx         ← SHAPBar, LIMEBar, Gauge (used in multiple tabs)
│       │
│       └── tabs/
│           ├── CandidatesTab.jsx        ← Candidate grid with score bars
│           ├── UploadTab.jsx            ← CSV drag-and-drop upload
│           ├── FairnessTab.jsx          ← DIR / SPD / EOD gauges + hiring rate charts
│           ├── ExplainTab.jsx           ← SHAP / LIME / Compare modes + AI explanation
│           ├── MitigationTab.jsx        ← Before/after bias mitigation comparison
│           └── ChatTab.jsx              ← AI auditor chat interface
```

## What Each File Does

| File | Responsibility |
|------|---------------|
| `theme.js` | Single source of truth for all colours |
| `dataUtils.js` | `generateCandidates`, `parseCSV`, `scoreBiased`, `scoreFair`, `getSHAP`, `getLIME`, `computeFairness` |
| `SharedComponents.jsx` | `SHAPBar`, `LIMEBar`, `Gauge` — imported by multiple tabs |
| `App.jsx` | Holds all state, calls API, passes props down to tabs |
| `CandidatesTab.jsx` | Renders candidate cards, regenerate + mitigation buttons |
| `UploadTab.jsx` | File drag-and-drop, CSV template, download sample |
| `FairnessTab.jsx` | DIR/SPD/EOD gauges, gender and ethnicity breakdown bars |
| `ExplainTab.jsx` | SHAP/LIME/Compare view switcher + Claude explanation panel |
| `MitigationTab.jsx` | Before/after metric cards + individual score change grid |
| `ChatTab.jsx` | Full chat interface with suggestion chips |

## Setup in VS Code

```bash
# 1. Create a new React app
npx create-react-app hiring-dashboard
cd hiring-dashboard

# 2. Replace the src/ folder with the files from this project

# 3. Install dependencies (none extra needed — uses React only)
npm start
```

## Key Design Rules
- Every file imports colours from `../../theme` (or `./theme` for App.jsx)
- All data functions live in `utils/dataUtils.js` — never duplicated
- Tab components receive data as props and call handlers passed from App.jsx
- The Anthropic API is only called from `App.jsx` (explainCandidate) and `ChatTab.jsx` (sendChat)
