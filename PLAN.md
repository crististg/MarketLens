MarketLens — Master Specification & AI-First Development Blueprint

Purpose: This document is the single source of truth for building MarketLens — an AI-centric market intelligence platform. It is written so that a developer OR an autonomous AI agent can implement the project end-to-end with minimal ambiguity.

⸻

1. Vision & Philosophy

1.1 What MarketLens Is

MarketLens is an AI-powered market intelligence system, not a trading platform.

It exists to answer one core question:

“Why is this happening in the markets?”

MarketLens synthesizes:
	•	Market data
	•	Macroeconomic indicators
	•	Financial & geopolitical news
	•	Cross-asset correlations

…and turns them into clear, explainable insights.

1.2 What MarketLens Is NOT
	•	❌ No trade execution
	•	❌ No buy/sell/price predictions
	•	❌ No high-frequency or tick trading
	•	❌ No hype, emojis, or influencer tone

MarketLens prioritizes trust, explainability, and calm analysis.

⸻

2. Core Product Concept (AI-First)

2.1 The AI Assistant Is the Product

The UI, dashboards, charts, and news feeds all exist to support the AI assistant.

Correct mental model:

MarketLens = AI Market Analyst + Data Tools

The assistant is:
	•	Context-aware
	•	Deterministic in structure
	•	Non-predictive
	•	Grounded only in internal data

2.2 AI Assistant Responsibilities

The assistant must:
	•	Explain market moves
	•	Connect macro → asset impact
	•	Highlight risks and tailwinds
	•	Summarize news relevance

The assistant must NEVER:
	•	Predict prices
	•	Give investment advice
	•	Invent sources
	•	Browse the open web

⸻

3. Data Stack (Authoritative & Free)

3.1 Market & Asset Data

Alpha Vantage (Backbone)
	•	Stocks (global)
	•	Indices (S&P 500, Nasdaq, etc.)
	•	Forex
	•	Commodities
	•	Limited macro

Constraints:
	•	Free tier: ~25 requests/day
	•	Requires aggressive caching

⸻

3.2 Macroeconomic Data

FRED (St. Louis Fed)
	•	CPI
	•	GDP
	•	Interest rates
	•	Employment data

Strengths:
	•	Official
	•	Clean
	•	Explainable

⸻

3.3 Crypto Data

CoinGecko
	•	Prices
	•	Market cap
	•	Volume
	•	Dominance

⸻

3.4 News & Sentiment

Marketaux (Primary)
	•	Financial news
	•	Company-tagged articles
	•	Sentiment metadata

Optional secondary:
	•	NewsAPI (broader geopolitics)

⸻

4. System Architecture

4.1 High-Level Architecture

[External APIs]
      ↓
[Backend Fetchers]
      ↓
[Normalization Layer]
      ↓
[Cache + Database]
      ↓
[Insight Engine]
      ↓
[AI Assistant]
      ↓
[Frontend / Extension]


⸻

5. Backend — Detailed Plan

5.1 Technology Stack
	•	Language: Python 3.10+
	•	Framework: FastAPI
	•	Async HTTP: HTTPX
	•	Scheduler: APScheduler
	•	Cache: Redis
	•	Database: PostgreSQL
	•	ORM: SQLAlchemy

⸻

5.2 Data Fetching Modules

Each API has its own module with:
	•	Rate limit handling
	•	Error recovery
	•	Caching fallback

Cache TTL Rules

Data Type	TTL
Stocks / Forex	1–5 min
Crypto	1–5 min
News	15–30 min
Macro	24h


⸻

5.3 Data Normalization (MANDATORY)

All data must be normalized into a unified schema before use by AI.

Example:

{
  "symbol": "AAPL",
  "asset_type": "stock",
  "timestamp": "2026-02-02T14:00:00Z",
  "value": 178.50,
  "currency": "USD",
  "source": "AlphaVantage",
  "confidence": 0.95
}


⸻

5.4 Insight Engine

The Insight Engine is rule-based + heuristic, NOT predictive ML.

It computes:
	•	Direction: bullish / bearish / neutral
	•	Strength: weak / moderate / strong
	•	Drivers: macro, news, correlations

Restrictions:
	•	No numerical price forecasts
	•	Every insight must include reasoning

⸻

5.5 Backend API Endpoints
	•	/api/overview
	•	/api/asset/{symbol}
	•	/api/news
	•	/api/macro
	•	/api/insight/{symbol}
	•	/api/assistant/query

All endpoints:
	•	Return cached data if limits exceeded
	•	Validate inputs
	•	Never expose raw API keys

⸻

6. AI Assistant — Specification

6.1 Input Context

The assistant receives structured JSON only:
	•	Asset data
	•	Macro indicators
	•	News summaries
	•	Recent movements
	•	User-selected context

No raw HTML. No web browsing.

⸻

6.2 Output Structure (STRICT)

Every response must follow:
	1.	Summary (1–2 sentences)
	2.	Key Drivers (bulleted)
	3.	What to Watch Next

This ensures consistency and trust.

⸻

6.3 Safety & Compliance Rules
	•	No financial advice
	•	No certainty language (“will”, “guaranteed”)
	•	Use probabilistic phrasing only

⸻

7. Frontend — Design & UX

7.1 Technology Stack
	•	Framework: Next.js (React)
	•	Styling: Tailwind CSS
	•	Charts: Chart.js or D3.js
	•	Data Fetching: Axios / Fetch

⸻

7.2 Design Language

Tone: calm, analytical, professional

Color Palette:
	•	Dark mode default
	•	Neutral grays
	•	Soft green (positive)
	•	Soft red (negative)

No neon. No hype colors.

⸻

7.3 Layout Structure

Home Dashboard
	•	“What’s moving markets today” (AI-generated)
	•	Major indices
	•	Macro snapshot

Asset Page
	•	Price chart
	•	News feed
	•	AI explanation panel
	•	Ask-about-this-asset input

Assistant Page
	•	Full-screen analyst chat
	•	Context-aware responses

⸻

8. Browser Extension (Phase 3)

Purpose

Inject MarketLens context while users browse the web.

Features
	•	Detect tickers on pages
	•	Show mini AI summary overlay
	•	Link back to full app

Not part of MVP.

⸻

9. Development Roadmap

Phase 1 — MVP
	•	Backend data pipeline
	•	Insight engine
	•	AI assistant
	•	Core web app

Phase 2 — Power Features
	•	Daily briefings
	•	Saved insights
	•	User watchlists

Phase 3 — Extension
	•	Chrome/Firefox extension
	•	Context overlays

⸻

10. Restrictions & Best Practices (CRITICAL)
	•	Cache aggressively
	•	Respect API ToS
	•	No predictions
	•	No scraping
	•	All insights explainable
	•	HTTPS everywhere
	•	Minimal user data

⸻

11. Getting Started Checklist
	1.	Create repo
	2.	Set up backend env
	3.	Register API keys
	4.	Implement fetchers
	5.	Add caching
	6.	Normalize data
	7.	Build insight engine
	8.	Implement AI assistant
	9.	Build frontend
	10.	Test
	11.	Deploy

⸻

12. Final Principle

If MarketLens cannot explain why something happened, it should say so clearly.

This honesty is the product’s biggest strength.

⸻

End of Master Specification