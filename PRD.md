# BizCopilot — Product Requirements Document (PRD)

**Version:** 1.0
**Product:** BizCopilot — AI-Powered Business Intelligence Copilot
**Target Users:** Non-technical small-to-medium business owners (35+)

---

## 1. Product Overview

BizCopilot is a conversational AI assistant that helps business owners understand their financial data without requiring technical expertise. Users upload CSV financial data and interact with an AI agent that can analyze numbers, generate charts, build strategic plans, create reports, and share findings to Slack — all through natural language conversation.

---

## 2. Core User Flows

### 2.1 Authentication

| Flow | Description |
|------|-------------|
| **Email Signup** | User creates account with email, password, and name. JWT token issued and stored client-side. |
| **Email Login** | User logs in with email and password. JWT token issued. |
| **Google OAuth** | User clicks "Sign in with Google", completes OAuth consent flow, auto-creates or links account. Redirected back with JWT. |
| **Session Persistence** | On app load, client checks stored token validity via `/auth/me`. Invalid token redirects to login. |
| **Profile Update** | User can update name and Slack configuration from settings. |
| **Logout** | Clears stored token and redirects to login. |

### 2.2 CSV Data Upload

| Requirement | Detail |
|-------------|--------|
| **File Types** | `.csv` only |
| **Max Size** | 10 MB |
| **Max Rows** | 10,000 |
| **Upload Methods** | (1) Drag-and-drop on modal, (2) Click-to-browse on modal, (3) CSV option in chat input action menu |
| **Auto-Processing** | On upload, system automatically: parses CSV, infers column types (string/number/date), detects revenue/expense/date columns, computes monthly aggregations and KPI summary |
| **Post-Upload** | User sees preview with file info (name, row count, columns) and computed summary (total revenue, expenses, profit) |
| **Multiple Datasets** | Users can upload multiple CSVs. Most recent is primary for analysis. |
| **Dataset Management** | Users can view list of uploaded datasets and delete any. |

### 2.3 Chat Conversations

| Requirement | Detail |
|-------------|--------|
| **Multi-Session** | Users can have multiple chat sessions. Each session has independent history and dashboard. |
| **Session Creation** | "New Chat" creates a fresh session and clears the dashboard viewport. |
| **Session Titles** | Auto-generated from first message (60-char preview). |
| **Session Switching** | Click any session in sidebar to load its messages and charts. |
| **Session Deletion** | Users can delete any session (also deletes all associated messages). |
| **Message Streaming** | AI responses stream in real-time token-by-token via SSE. |
| **Thinking Indicator** | Shows "BizCopilot is thinking..." during agent reasoning. |
| **Tool Call Visibility** | When agent uses tools, user sees friendly labels (e.g., "Querying your data...", "Creating a chart...") with collapsible details. |
| **Markdown Responses** | AI responses render as styled markdown (headings, lists, tables, code blocks, bold/italic). |
| **Copy Response** | Users can copy any AI response as markdown text. |
| **Empty State** | New chat shows welcome message with 4 suggested prompts to get started. |
| **Quick Suggestions** | After messages exist, suggestion pills appear above input for common follow-ups. |

### 2.4 AI Agent Capabilities

The AI agent can perform 5 distinct actions through natural language:

#### 2.4.1 Financial Analysis
- **Trigger:** Questions about revenue, expenses, profit, margins, growth, burn rate, runway
- **Output:** Computed KPIs based on uploaded data
- **KPIs:** Total Revenue, Total Expenses, Net Profit, Profit Margin %, Avg Monthly Revenue, Burn Rate, Runway (months), Growth Rate %

#### 2.4.2 Chart/Visualization Creation
- **Trigger:** Requests for charts, graphs, visualizations
- **Chart Types:** Bar, Line, Area, Pie
- **Data Source:** Monthly aggregations from uploaded CSV
- **Metrics:** Revenue, Expenses, Profit (default), or agent-selected based on query
- **Delivery:** Charts appear inline in chat AND in real-time on any connected session dashboard
- **Real-time:** Charts push to all connected clients via WebSocket

#### 2.4.3 Strategy Generation
- **Trigger:** Requests for business plans, growth strategies, roadmaps
- **Output:** Structured plan with 30/60/90-day phases and action items
- **Context-Aware:** Uses financial KPIs when data is available to tailor recommendations

#### 2.4.4 Report Generation
- **Trigger:** Requests for reports, summaries, analysis documents
- **Report Types:** Summary, Strategy, Analysis
- **Output:** Markdown report saved to database with:
  - Overview (data source, period, row count)
  - Key Metrics table
  - Monthly Breakdown table
  - Auto-generated Highlights (profitability status, growth direction, margin assessment)
- **Persistence:** Reports are saved and accessible from Reports drawer

#### 2.4.5 Slack Sharing (via Agent)
- **Trigger:** "Share to Slack", "Send this to my team"
- **Methods:** Composio managed connection (primary) or webhook (fallback)
- **Content:** Report content formatted for Slack

### 2.5 Reports Management

| Requirement | Detail |
|-------------|--------|
| **Reports Drawer** | Slide-out drawer listing all generated reports, sorted by newest first. |
| **Report Card** | Shows title, creation date, report type, and highlight badges. |
| **Report Viewer** | Full markdown rendering of report content with date and type metadata. |
| **Share to Slack** | One-click sharing from report viewer. Shows shared indicator. |
| **Slack Shared Indicator** | Reports that have been shared show a Slack icon badge. |

### 2.6 Slack Integration

| Requirement | Detail |
|-------------|--------|
| **Method 1: Composio** | One-click OAuth connection to Slack via Composio. No manual webhook setup. |
| **Method 2: Webhook** | Manual configuration of Slack incoming webhook URL and channel in settings. |
| **Priority** | System tries Composio first, falls back to webhook. |
| **Connection Status** | Settings shows whether Slack is connected via Composio. |
| **Sharing** | Reports can be shared to configured Slack channel. |

### 2.7 Real-Time Dashboard

| Requirement | Detail |
|-------------|--------|
| **Per-Session Charts** | Each chat session has its own set of charts. |
| **Real-Time Updates** | When AI generates a chart, it appears instantly for all connected clients viewing that session. |
| **Chart Types** | Bar, Line, Area, Pie — rendered with Recharts. |
| **Chart Actions** | Share to Slack, Expand/Collapse. |
| **Session Switching** | Dashboard clears and reloads when switching sessions. |

---

## 3. Functional Requirements Summary

### 3.1 Authentication & Authorization
- FR-1: Users can sign up with email/password
- FR-2: Users can log in with email/password
- FR-3: Users can sign in with Google OAuth
- FR-4: All API endpoints (except auth) require valid JWT
- FR-5: Tokens expire after 7 days
- FR-6: Users can update their profile (name, Slack config)
- FR-7: Users can log out

### 3.2 Data Management
- FR-8: Users can upload CSV files (max 10MB, max 10,000 rows)
- FR-9: System auto-detects column types (string, number, date)
- FR-10: System auto-detects revenue, expense, and date columns
- FR-11: System computes monthly aggregations and financial summary
- FR-12: Users can view and delete uploaded datasets
- FR-13: Each user's data is isolated (multi-tenant)

### 3.3 Chat & AI
- FR-14: Users can create, switch between, and delete chat sessions
- FR-15: AI responses stream in real-time via SSE
- FR-16: AI agent has 5 tools: financial_analysis, create_visualization, generate_strategy, generate_report, share_to_slack
- FR-17: Tool calls are visible to the user with friendly labels
- FR-18: AI maintains conversation context (last 20 messages per session)
- FR-19: Session titles auto-generate from first message
- FR-20: AI formats responses as markdown

### 3.4 Visualizations
- FR-21: AI can create bar, line, area, and pie charts
- FR-22: Charts appear inline in chat
- FR-23: Charts push in real-time via WebSocket to all session viewers
- FR-24: Charts persist in session dashboard state

### 3.5 Reports
- FR-25: AI can generate structured markdown reports
- FR-26: Reports save to database with title, type, content, highlights
- FR-27: Users can browse all their reports
- FR-28: Users can view full report content
- FR-29: Users can share reports to Slack
- FR-30: Report shared status is tracked

### 3.6 Integrations
- FR-31: Composio OAuth for one-click Slack connection
- FR-32: Manual Slack webhook as fallback
- FR-33: Report sharing uses Composio first, then webhook

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Rate Limiting** | Auth: 20 req/15min. Chat: 30 req/60sec. General API: 100 req/15min. |
| **Security** | Helmet headers, CORS restricted to client origin, bcrypt password hashing (12 rounds), JWT authentication |
| **Data Isolation** | All queries scoped to authenticated user's data |
| **Streaming** | SSE for chat responses (no polling) |
| **Real-Time** | WebSocket (Socket.io) for dashboard chart updates |
| **File Limits** | 10MB upload, 10,000 rows, CSV only |
| **AI Context Window** | Last 20 messages per session |
| **AI Token Limit** | 4,096 max output tokens per response |
| **Deployment** | Single server serves API + static client build in production |

---

## 5. Suggested Prompt Examples

These are the default suggestions shown to users:

**Empty State (new chat):**
1. "What is my total revenue?"
2. "Show monthly expenses as a bar chart"
3. "Create a 90-day growth plan"
4. "Generate a monthly summary report"

**Quick Suggestions (after messages):**
1. "Summarize my data"
2. "Show a chart"
3. "Create a report"
4. "Top insights"

---

## 6. Out of Scope (v1)

- Multi-user collaboration on same session
- Data sources beyond CSV (Excel, Google Sheets, database connections)
- Scheduled/recurring reports
- Custom chart editing/configuration
- Data export (PDF, Excel)
- Mobile native apps
- Pagination on any list endpoints
- Soft deletes / trash / undo
- File storage service (uploads stored on local disk)
- Custom AI model selection
