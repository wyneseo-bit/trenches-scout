# TrenchFinder — Full Build Brief for Claude Code

## The Mission

Build a web app called **TrenchFinder** — a natural language agent discovery tool for Virtuals Protocol's ACP (Agent Commerce Protocol) ecosystem.

This is being built to impress **Jansen Teng** (Co-founder & CEO of Virtuals Protocol) at a face-to-face meeting. The builder is going for an ops role and wants to show up with something real and working — not a slide deck.

---

## What Is Virtuals Protocol?

- A decentralised platform where AI agents are tokenised and can autonomously perform services and transact with humans and other agents on-chain
- Their main infrastructure is ACP (Agent Commerce Protocol) — a standard for agent-to-agent and human-to-agent commerce
- They have 18,000+ agents deployed but no good discovery layer
- Jansen's stated priority in 2026: grow real ACP usage and "Agentic GDP"
- **The pain point this app solves:** users land on the platform, see a wall of 18,000 agents sorted by market cap, have no idea what any of them do, and leave

---

## What TrenchFinder Does

### Core Flow

1. User lands on a clean search screen
2. Types what they need in plain English e.g. "I need an agent that automates my DeFi trades"
3. App fetches ~90 real agents from Virtuals' live public ACP API
4. Sends them to Claude AI which picks the 5 best matches and explains why
5. Results are shown as a swipeable card stack
   - Swipe RIGHT = save to shortlist
   - Swipe LEFT = skip
   - Buttons at bottom for click-based skip/save
6. Done screen shows saved shortlist with direct links to each agent on Virtuals

### Why This UX (Important Context)

- We deliberately chose **NOT** to do filters or 3-question quizzes
- We deliberately chose **NOT** to do pure Tinder-style blind swiping through all agents
- The right approach: natural language input → AI pre-filters to 5 relevant matches → user swipes through a small curated deck (not 18,000 agents)
- Swiping 5 pre-matched cards is fast and effortless — swiping 18,000 blindly is exhausting
- This is the missing layer between Butler (ACP's execution agent) and the user: Butler executes jobs. TrenchFinder helps you decide WHICH agents are worth hiring.

---

## Tech Stack

- React 18 + Vite (single page app)
- Inline styles only — no CSS framework, no Tailwind
- Google Fonts: Syne (headings) + JetBrains Mono (data/labels)
- Anthropic API for Claude matching (`claude-sonnet-4-20250514`)
- Virtuals ACP public API for live agent data (no auth needed)
- Vercel serverless function (`api/match.js`) to proxy Anthropic API server-side

---

## Live Data Source — Virtuals ACP API

### Endpoint (public, no auth required)

```
GET https://acpx.virtuals.io/api/metrics/agents
  ?page=1
  &pageSize=30
  &sortBy=volume        (options: volume | revenue | successRate | memoCount)
  &sortOrder=desc
```

### What It Returns Per Agent

```json
{
  "id": 84,
  "name": "Ethy AI",
  "isVirtualAgent": true,
  "virtualAgentId": "19520",
  "profilePic": "https://s3.ap-southeast-1.amazonaws.com/...",
  "successRate": 99.23,
  "volume": 218099220.98,
  "revenue": 572787.33,
  "successfulJobCount": 1139030,
  "uniqueBuyerCount": 7496,
  "memoCount": 3420469,
  "offeringsCount": 10,
  "past7dVolume": [
    { "time": "2026-05-03T08:00:00.000Z", "value": 106929786.2 }
  ],
  "grossAgenticAmount": 218099220.98,
  "lastActiveAt": "2026-04-08T09:22:25.980Z",
  "tag": null
}
```

### Fetching Strategy

Fetch top 30 agents by each of 3 sort criteria, then deduplicate by `id`:

- `sortBy=volume` — highest ACP transaction volume
- `sortBy=revenue` — highest revenue generated
- `sortBy=successRate` — most reliable agents

This gives ~70-90 diverse quality agents for Claude to match against.

### Agent URLs

- If agent has `virtualAgentId`: `https://app.virtuals.io/virtuals/{virtualAgentId}`
- Otherwise: `https://app.virtuals.io/acp/scan/agents`

---

## Claude AI Matching

### How It Works

1. Summarise each fetched agent to: `id`, `name`, `successRate`, `revenue`, `jobs`, `buyers`
2. POST to `/api/match` with the user's query + agent summaries
3. The serverless function calls Anthropic API and returns top 5 matches
4. Each match includes: `category` and `reason` (why it fits the user's need)

### Prompt Used in api/match.js

```
You are an AI agent matchmaker for Virtuals Protocol's ACP (Agent Commerce Protocol).

User wants: "{query}"

Agents (infer function from name + metrics. e.g. "Trade Execution"=DeFi,
"Luna"=entertainment, "Director"=content, "Nox"=utility):
{agents as JSON}

Return the 5 best matches. ONLY valid JSON array, no markdown:
[{"id":number,"category":"DeFi|Content|Analytics|Social|Utility|Trading",
"reason":"one sentence why this matches the user need"}]
```

### Environment Variable Required

```
ANTHROPIC_API_KEY=your_key_here
```

---

## Project File Structure

```
trenches-scout/
├── CLAUDE.md               <- this file
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
├── .env.example
├── api/
│   └── match.js            <- Vercel serverless function
└── src/
    ├── main.jsx
    └── App.jsx             <- all UI and logic lives here
```

---

## Design System

### Colors

```
Background:     #06060A
Surface:        #0D0D16
Surface2:       #121220
Border:         #1A1A2C  /  #1C1C2E
Accent teal:    #00DDB3
Text primary:   #EEEEF5
Text muted:     #4A4A6A  /  #6B6B8A
Text faint:     #2C2C44  /  #32324A
Success green:  #00FF87
Danger red:     #FF4466
```

### Category Colors (for agent badges and card glows)

```
DeFi:       #00E5C8
Trading:    #00B4FF
Content:    #FF6B9D
Social:     #FFB347
Analytics:  #A78BFA
Utility:    #6EE7B7
```

### Typography

- Headings: **Syne** (Google Font), weight 700/800
- Data / labels / monospace: **JetBrains Mono** (Google Font), weight 400/600/700
- Body copy: system-ui, -apple-system, sans-serif
- Load via: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap')`

### Logo

- Hexagon emoji in a 34x34 rounded square
- Background: `linear-gradient(135deg, #00DDB3, #0055FF)`
- App name: "TRENCHFINDER" in Syne 800
- Tagline: "POWERED BY VIRTUALS ACP · LIVE DATA" in JetBrains Mono, color `#2C2C44`

---

## App Screens

### 1. Search Screen

- Centered layout, max-width 460px
- Gradient headline: "Find your perfect agent"
- Subheading explaining the concept
- Textarea (3 rows) with teal border glow on focus
- "SCOUT AGENTS" button — gradient when query entered, disabled otherwise
- Enter key submits (shift+enter = newline)
- Example query chips below input:
  - "Automate my DeFi trades"
  - "Create content for my token"
  - "Analyze market signals"
  - "Manage my social presence"

### 2. Loading Screen

- Centered spinner with teal top border rotating
- Two loading messages shown in sequence:
  1. "Scanning ACP network..."
  2. "Matching agents to your query..."

### 3. Results Screen (Card Stack)

- Max-width 420px
- Top bar: "NEW SEARCH" link | "{n} SAVED" pill counter
- Hint text: "SWIPE RIGHT TO SAVE · LEFT TO SKIP"
- Card stack (3 cards visible, stacked behind each other)
- Bottom action buttons: X (skip, red) | checkmark (save, green)

### 4. Done Screen

- Summary of how many agents were saved
- Shortlist list: avatar, name, reason, link to Virtuals
- "SCOUT AGAIN" button to restart

---

## Agent Card Spec

### Stack Behaviour

- Show top 3 cards stacked
- Each card behind: offset 9px down, scaled 4.5% smaller
- Top card is draggable
- Spring animation when new card becomes top: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Swipe Mechanic

- Use pointer events (works for both mouse and touch)
- `onPointerDown`: record startX, setPointerCapture
- `onPointerMove`: compute deltaX, update visual position
- `onPointerUp`: if `|deltaX| >= 90px` trigger swipe, else snap back
- Store drag state in a `useRef` (not `useState`) to avoid stale closure issues
- Card rotates as it drags: `rotate(deltaX / 22 deg)`

### Swipe Overlays

- Drag right > 45px: green overlay with "SAVE" fades in
- Drag left < -45px: red overlay with "SKIP" fades in
- Opacity scales proportionally with drag distance

### Card Contents (top to bottom)

1. Card counter top-right: "1 / 5"
2. Background radial glow in category color (top-right corner, subtle)
3. Header row:
   - Circular avatar (62x62, category color border)
   - Colored dot on avatar: green if successRate > 95%, amber > 80%, red otherwise
   - Agent name in Syne bold
   - Category badge (tiny uppercase pill in category color)
   - Match reason in muted text below name
4. Metrics grid (2 rows x 2 cols or 4 columns):
   - SUCCESS: successRate as percentage
   - REVENUE: formatted dollar amount
   - JOBS: successfulJobCount formatted
   - BUYERS: uniqueBuyerCount formatted
5. Bottom row:
   - 7-day sparkline SVG chart (only if `past7dVolume` has 2+ points)
     - Green polyline if last value >= first value (trending up)
     - Red polyline if trending down
   - "VIEW" button linking to agent on Virtuals

### Number Formatting

- Money: >= 1M show "$X.XM", >= 1K show "$XXXK", else "$XXX"
- Counts: >= 1M show "X.XM", >= 1K show "XXXK", else the number

---

## Serverless Function — api/match.js

```javascript
// Vercel serverless function
// POST /api/match
// Body: { query: string, agents: array }
// Returns: { matches: array }
// Uses process.env.ANTHROPIC_API_KEY
// Required header to Anthropic: 'anthropic-version': '2023-06-01'
// Model: claude-sonnet-4-20250514
```

---

## Known Issues to Fix / Improvements to Make

1. **CORS**: if acpx.virtuals.io blocks browser requests, show a friendly error message suggesting the user check their connection or try again
2. **Card container height** (370px) may need adjusting if content is taller
3. **Mobile**: verify pointer events work smoothly for swipe on touch screens
4. **Some agents have no past7dVolume** — sparkline simply does not render (correct)
5. **Some agents have no profilePic** — image `onError` should hide it gracefully
6. Agent pool is fetched fresh on each new search session (acceptable for demo)
7. Consider adding entrance animation when card stack first appears
8. Consider adding a subtle noise/grain texture to the background for depth

---

## What Claude Code Should Do First

1. Read all files in this project
2. Run: `npm install`
3. Create a `.env` file with `ANTHROPIC_API_KEY=your_key`
4. Run: `npm run dev`
5. Open browser and test the full flow end to end
6. Fix any runtime errors or bugs
7. Then work through the improvements list above
