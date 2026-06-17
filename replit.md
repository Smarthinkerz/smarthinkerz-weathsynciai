# WealthSync - Business Intelligence & Lead Generation Platform

## Overview
WealthSync is an AI-powered business intelligence platform designed for lead generation, funding opportunity discovery, company verification, and market analysis. It offers tiered subscriptions to individuals and companies, aiming to accelerate business growth and market expansion through data-driven insights. It is a part of the Smarthinkerz AI ecosystem.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with Radix UI components (Shadcn/ui)
- **State Management**: React Query
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript/JavaScript (ES modules)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Session-based with bcrypt
- **API Architecture**: RESTful APIs

### Data Storage
- **Primary Database**: PostgreSQL (Neon Database)
- **ORM**: Drizzle ORM
- **Session Storage**: Server-side sessions with secure cookies

### Subscription Tiers
WealthSync offers various subscription tiers: Explorer (Free), Professional, Elite, and Enterprise/Institutional, each providing escalating access to AI agents, advanced analytics, and premium features. Tiers are managed with schema helpers for consistent comparison.

### Key Features
- **User Management**: Supports individual and company users, secure authentication, profile management, and password reset flows.
- **Notifications System**: Real-time, polling-based notification system for various platform events.
- **Global Search**: Command palette search for companies, opportunities, and funding.
- **Lead Generation**: Multi-source data integration for geographic and industry-targeted lead generation and data enrichment.
- **Funding Opportunities**: Global database with smart filtering and AI-driven scoring.
- **Company Verification**: Badge system with premium features and directory listings.
- **Business Intelligence Dashboard**: Interactive dashboards for market analysis, investment insights, and automated report generation, utilizing interactive maps.
- **AI Agents**: Specialized AI agents for startup health, trade flow, market risk, and company performance.
- **Virtual Assistant**: AI-powered assistant for email drafting, scheduling, business planning, and general chat (OpenAI GPT-4o powered).
- **Deep Research**: AI-powered market analysis reports with insights, confidence scoring, and data source attribution.
- **Landing Page**: Comprehensive marketing page detailing features and pricing.
- **Portfolio & Validation**: Showcase projects, case studies, client feedback, and endorsements.
- **AI Assistant with Memory**: Conversational AI with persistent memory per agent type and conversation history storage for Pro+ tiers.
- **Compliance & Strategy**: AI-generated compliance reports and strategy briefs for Elite+ tiers.
- **Threat Simulation & Fraud Detection**: AI-powered fraud scanning and threat simulation scenarios for Elite+ tiers.
- **Plugin Marketplace**: Browse, install, and manage plugins with tier-based access control and configurable settings.
- **Community Forum**: Discussion platform with posts, categories, replies, and upvotes.
- **Learning Center**: Structured learning tracks with progress tracking and certification.
- **Developer & Partner Hub**: API key management, usage tracking, and affiliate program for Elite+ tiers.
- **Data Export**: CSV export functionality for various data types for paid tiers.
- **Co-Policy Modeling**: AI-driven comparative analysis of policy scenarios for Elite+ tiers.
- **Multi-Agent Collaboration**: Parallel processing by specialist AI agents synthesized into unified summaries for Elite+ tiers.
- **Integration Status Dashboard**: Real-time monitoring of all platform integrations.
- **Health Check**: API endpoint to monitor the health and latency of the database and key integrations.
- **Audit Logging**: Comprehensive logging of critical user and system actions.
- **AI Rate Limits**: Implemented rate limiting for AI-heavy endpoints to manage costs.
- **AI Observability**: Logging mechanism for AI endpoint usage and performance.
- **Real PDF Certificates**: Generation of official PDF certificates for learning track completion.
- **Mobile Responsive UI**: Sticky headers, tab grids, and dashboards optimized for 360px+ devices.
- **Onboarding & UX Polish**: First-login welcome modal tour (localStorage-dismissed), reusable `EmptyState` component, tooltip coverage on icon buttons, Cmd/Ctrl-K global search shortcut.
- **Admin Console** (`/admin`): User management with tier override and suspend/unsuspend, audit log viewer, and system stats. Guarded by `users.isAdmin`.
- **Billing & Invoices** (`/billing`): Current plan summary, invoice history, plan change/cancel UI. Webhook endpoint `/api/billing/webhook` handles subscription.activated/payment.confirmed/payment.failed/subscription.cancelled events. Failed payments trigger SendGrid dunning emails. New `invoices` table tracks all transactions.
- **Performance & SEO**: Heavy pages (PremiumDashboard, BusinessMap, DeepResearch, MultiAgent, AdminPage, BillingPage, IntegrationDashboard) lazy-loaded via `React.lazy` + `Suspense`. Server-side `/robots.txt` and `/sitemap.xml`. Open Graph + Twitter card meta tags on landing. `useDocumentTitle` hook for per-page titles.
- **Internationalization**: react-i18next with en/es/ja/ar resources expanded for landing, auth, and dashboard surfaces. `LanguageSwitcher` component wired into dashboard header.

### Data Integrity
- Emphasizes real-world data usage, avoiding dummy or hardcoded values.
- Ensures proper user authorization and secure data handling.
- Deterministic scoring algorithms and real-time market data integration.
- Robust security measures including Helmet middleware, rate limiting, and CORS.

## External Dependencies

### API Integrations
- **Apollo.io API**: Contact discovery and enrichment.
- **RapidAPI**: LinkedIn data scraping.
- **Apify Platform**: Web scraping.
- **Tap Payments**: Payment processing via Smarthinkerz checkout hub.
- **SendGrid**: Transactional email services.
- **Neon Database**: Managed PostgreSQL hosting.
- **Mapbox**: Interactive mapping.
- **OpenAI**: AI-powered content generation and analysis.
- **World Bank API**: Official government economic data.
- **Finnhub API**: Real-time financial sector data.
- **Google Knowledge Graph API**: Structured company and industry intelligence.
- **ExchangeRate API**: Live currency exchange rates.

### Third-Party Services
- **Node Mailer**: Email delivery.

### Development Tools
- **Drizzle Kit**: Database schema management.
- **ESBuild**: JavaScript bundling.
- **TypeScript**: Type safety.