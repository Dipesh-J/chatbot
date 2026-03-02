# BizCopilot — Technical Requirements Document (TRD)

**Version:** 1.0
**Architecture:** Monorepo — Express API server + React SPA client

---

## 1. System Architecture

```
┌─────────────┐     HTTPS      ┌─────────────────────────────────────┐
│   Browser    │◄──────────────►│           Express Server            │
│  (React SPA) │                │                                     │
│             │   Socket.io     │  ┌─────────┐  ┌──────────────────┐ │
│             │◄───────────────►│  │  Routes  │  │  Socket.io Hub   │ │
│             │                │  └────┬────┘  └────────┬─────────┘ │
└─────────────┘                │       │                │           │
                               │  ┌────▼────┐           │           │
                               │  │ Services │◄──────────┘           │
                               │  └────┬────┘                       │
                               │       │                             │
                               │  ┌────▼──────────────────────────┐ │
                               │  │  LangGraph Agent (Gemini 2.5) │ │
                               │  │  Tools: analyze, chart,       │ │
                               │  │    report, strategy, slack    │ │
                               │  └────┬──────────────────────────┘ │
                               │       │                             │
                               │  ┌────▼────┐   ┌───────────────┐  │
                               │  │ MongoDB  │   │  Composio SDK │  │
                               │  │  (Atlas) │   │  (Slack OAuth)│  │
                               │  └─────────┘   └───────────────┘  │
                               └─────────────────────────────────────┘
```

### Project Structure
```
bizcopilot/
├── package.json                  # Root: concurrently for dev, scripts
├── server/
│   ├── package.json              # Server dependencies (ES modules)
│   └── src/
│       ├── index.js              # Entry: Express + Socket.io + MongoDB connect
│       ├── config/
│       │   ├── db.js             # mongoose.connect(MONGODB_URI)
│       │   └── passport.js       # Local + Google OAuth strategies
│       ├── middleware/
│       │   ├── auth.js           # JWT verification → req.user
│       │   ├── upload.js         # Multer: disk storage, CSV filter, 10MB
│       │   ├── rateLimiter.js    # express-rate-limit configs
│       │   └── errorHandler.js   # Centralized error → JSON response
│       ├── models/
│       │   ├── User.js
│       │   ├── ChatSession.js
│       │   ├── Message.js
│       │   ├── FinancialData.js
│       │   └── Report.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── chat.js
│       │   ├── csv.js
│       │   ├── dashboard.js
│       │   ├── reports.js
│       │   └── composio.js
│       ├── services/
│       │   ├── agent.js          # LangGraph ReAct agent + tools
│       │   ├── csvProcessor.js   # Parse, validate, infer types, summarize
│       │   └── slack.js          # Composio + webhook sharing
│       └── uploads/              # Multer temp storage (gitignored)
└── client/
    ├── package.json              # Client dependencies (Vite + React 19)
    └── src/
        ├── main.jsx              # React root with context providers
        ├── App.jsx               # React Router routes
        ├── api/                  # Axios API modules
        ├── context/              # Auth, Socket, Dashboard providers
        ├── hooks/                # useChat, useCSVUpload
        ├── pages/                # Route page components
        └── components/           # All UI components
```

---

## 2. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 client secret |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CLIENT_URL` | Yes | Client origin for CORS (e.g., `http://localhost:5173`) |
| `COMPOSIO_API_KEY` | No | Composio API key for managed Slack OAuth |
| `SLACK_WEBHOOK_URL` | No | Default Slack webhook URL fallback |

---

## 3. Database Schema

### 3.1 User

```javascript
{
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },                    // bcrypt, 12 salt rounds
  name:         { type: String, required: true },
  avatar:       { type: String },                    // URL
  authProvider: { type: String, enum: ['local', 'google'] },
  googleId:     { type: String },                    // sparse index
  slackConfig: {
    webhookUrl: { type: String },
    channel:    { type: String }
  },
  timestamps: true
}
```

### 3.2 ChatSession

```javascript
{
  userId:       { type: ObjectId, ref: 'User', required: true, index: true },
  title:        { type: String, default: 'New Chat' },
  isActive:     { type: Boolean, default: true },
  dataSourceIds: [{ type: ObjectId, ref: 'FinancialData' }],
  dashboardState: {
    charts: [{
      id:        { type: String },
      type:      { type: String, enum: ['bar', 'line', 'pie', 'area'] },
      title:     { type: String },
      config:    { type: Mixed },    // { data, xKey, yKeys, colors }
      createdAt: { type: Date }
    }]
  },
  timestamps: true
}
```

### 3.3 Message

```javascript
{
  sessionId: { type: ObjectId, ref: 'ChatSession', required: true, index: true },
  role:      { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
  content:   { type: String, default: '' },
  toolCalls: [{
    toolName: { type: String },
    args:     { type: Mixed },
    result:   { type: Mixed }
  }],
  metadata: {
    model:      { type: String },
    tokensUsed: { type: Number }
  },
  timestamps: true
}
```

### 3.4 FinancialData

```javascript
{
  userId:    { type: ObjectId, ref: 'User', required: true, index: true },
  fileName:  { type: String, required: true },
  columns:   [{ name: String, type: { type: String, enum: ['string', 'number', 'date'] } }],
  rowCount:  { type: Number, default: 0 },
  dateRange: { start: Date, end: Date },
  rows:      [{ type: Mixed }],              // Raw parsed CSV rows
  summary: {
    totalRevenue:     { type: Number, default: 0 },
    totalExpenses:    { type: Number, default: 0 },
    netProfit:        { type: Number, default: 0 },
    monthlyBreakdown: [{
      month:    String,     // "YYYY-MM"
      revenue:  Number,
      expenses: Number,
      profit:   Number
    }]
  },
  status: { type: String, enum: ['processing', 'ready', 'error'] },
  timestamps: true
}
```

### 3.5 Report

```javascript
{
  userId:        { type: ObjectId, ref: 'User', required: true, index: true },
  sessionId:     { type: ObjectId, ref: 'ChatSession' },
  title:         { type: String, required: true },
  type:          { type: String, enum: ['summary', 'strategy', 'analysis'] },
  content:       { type: String, required: true },     // Markdown
  highlights:    [{ type: String }],
  sharedToSlack: { type: Boolean, default: false },
  timestamps: true
}
```

---

## 4. API Specification

### 4.1 Authentication (`/api/auth`)

#### `POST /auth/signup`
- **Rate Limit:** 20 req / 15 min
- **Body:** `{ email: string, password: string, name: string }`
- **Response 201:** `{ token: string, user: { id, email, name, avatar } }`
- **Errors:** 400 (validation), 409 (email exists)

#### `POST /auth/login`
- **Rate Limit:** 20 req / 15 min
- **Body:** `{ email: string, password: string }`
- **Response 200:** `{ token: string, user: { id, email, name, avatar } }`
- **Errors:** 401 (invalid credentials)

#### `GET /auth/google`
- Redirects to Google OAuth consent screen
- Scope: `profile email`

#### `GET /auth/google/callback`
- Google OAuth callback
- **Redirect:** `{CLIENT_URL}/auth/callback?token={jwt}`
- Creates user if first login, links googleId if email exists

#### `GET /auth/me`
- **Auth:** Bearer token
- **Response 200:** `{ user: { id, email, name, avatar, slackConfig } }`

#### `PATCH /auth/me`
- **Auth:** Bearer token
- **Body:** `{ name?: string, slackConfig?: { webhookUrl?: string, channel?: string } }`
- **Response 200:** `{ user: {...} }`

### 4.2 CSV Data (`/api/csv`)

#### `POST /csv/upload`
- **Auth:** Bearer token
- **Content-Type:** `multipart/form-data`
- **Field:** `file` (CSV, max 10MB)
- **Processing:**
  1. Parse CSV with PapaParse
  2. Validate: non-empty, has headers, ≤10,000 rows, <10 parse errors
  3. Infer column types from first 50 rows (number, date, string)
  4. Detect revenue/expense/date columns by keyword matching
  5. Compute monthly aggregation and summary
- **Response 201:** `{ id, fileName, rowCount, columns, summary, status: 'ready' }`
- **Errors:** 400 (no file, invalid CSV, too many rows)

#### `GET /csv/datasets`
- **Auth:** Bearer token
- **Response 200:** `{ datasets: [{ id, fileName, rowCount, columns, summary, status, createdAt }] }`
- **Note:** Excludes `rows` field for performance. Sorted by newest first.

#### `GET /csv/datasets/:id`
- **Auth:** Bearer token
- **Response 200:** `{ dataset: { ...including rows } }`
- **Errors:** 404 (not found or not owned)

#### `DELETE /csv/datasets/:id`
- **Auth:** Bearer token
- **Response 200:** `{ message: 'Dataset deleted' }`
- **Errors:** 404

### 4.3 Chat (`/api/chat`)

#### `POST /chat/sessions`
- **Auth:** Bearer token
- **Response 201:** `{ session: { _id, userId, title: 'New Chat', isActive, dashboardState, createdAt } }`

#### `GET /chat/sessions`
- **Auth:** Bearer token
- **Response 200:** `{ sessions: [...] }`
- **Sort:** Newest first (`createdAt: -1`)

#### `POST /chat/sessions/:id/messages`
- **Auth:** Bearer token
- **Rate Limit:** 30 req / 60 sec
- **Body:** `{ content: string }`
- **Response:** `text/event-stream` (SSE)
- **SSE Event Format:** `data: {json}\n\n`
- **SSE Event Types:**

| Type | Payload | Description |
|------|---------|-------------|
| `token` | `{ type: 'token', content: string }` | Streamed AI response chunk |
| `tool_call` | `{ type: 'tool_call', toolName: string, args: object }` | Agent invoking a tool |
| `done` | `{ type: 'done', content: string }` | Stream complete, full response |
| `error` | `{ type: 'error', content: string }` | Error occurred |

- **Agent Pipeline:**
  1. Load last 20 messages for context
  2. Build system prompt with user name + available datasets
  3. Stream via LangGraph ReAct agent (Gemini 2.5 Flash)
  4. On tool call → SSE `tool_call` event
  5. On text → SSE `token` events
  6. On chart creation → save to session + emit Socket.io `dashboard:chart_update`
  7. On completion → save Message to DB, SSE `done` event
  8. Session title auto-updates from first message (60-char truncation)

#### `GET /chat/sessions/:id/messages`
- **Auth:** Bearer token
- **Response 200:** `{ messages: [...] }`
- **Sort:** Oldest first (`createdAt: 1`)

#### `DELETE /chat/sessions/:id`
- **Auth:** Bearer token
- **Cascade:** Deletes all Messages for session
- **Response 200:** `{ message: 'Session deleted' }`

### 4.4 Dashboard (`/api/dashboard`)

#### `GET /dashboard/sessions/:id/charts`
- **Auth:** Bearer token
- **Response 200:** `{ charts: [...] }`
- **Source:** `ChatSession.dashboardState.charts`

### 4.5 Reports (`/api/reports`)

#### `GET /reports`
- **Auth:** Bearer token
- **Response 200:** `{ reports: [...] }`
- **Sort:** Newest first

#### `GET /reports/:id`
- **Auth:** Bearer token
- **Response 200:** `{ report: {...} }`

#### `POST /reports/:id/share-slack`
- **Auth:** Bearer token
- **Logic:**
  1. Load report
  2. Try Composio: get user's connected Slack, send via `SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL`
  3. If no Composio: try user's `slackConfig.webhookUrl` with Slack Block Kit format
  4. If neither: return error
  5. Set `report.sharedToSlack = true`
- **Response 200:** `{ message: 'Report shared to Slack...' }`
- **Errors:** 400 (no Slack configured), 404 (report not found)

#### `DELETE /reports/:id`
- **Auth:** Bearer token
- **Response 200:** `{ message: 'Report deleted' }`

### 4.6 Composio (`/api/composio`)

#### `GET /composio/status`
- **Auth:** Bearer token
- **Response 200:** `{ composioConfigured: boolean, slackConnected: boolean }`
- If `COMPOSIO_API_KEY` not set: `composioConfigured: false`

#### `POST /composio/connect/slack`
- **Auth:** Bearer token
- **Response 200:** `{ authUrl: string }`
- **Note:** Client opens URL in new tab for user to complete Slack OAuth

---

## 5. AI Agent Architecture

### 5.1 Framework
- **Agent Type:** LangGraph ReAct agent
- **LLM:** Google Gemini 2.5 Flash via `@langchain/google-genai`
- **Temperature:** 0.7
- **Max Output Tokens:** 4,096
- **Stream Mode:** `updates` (LangGraph stream)

### 5.2 System Prompt Template

```
You are BizCopilot, an AI-powered business intelligence assistant for small business owners.

Current user: {userName}
Available datasets: {datasetList with fileName, rowCount, columns}

Tool usage guidelines:
1. financial_analysis — Use for any financial question (revenue, profit, margins, etc.)
2. create_visualization — Use when user asks for charts, graphs, visual representations
3. generate_strategy — Use for business plans, growth strategies, roadmaps
4. generate_report — Use when user wants a formal report document
5. share_to_slack — Use when user wants to share content to Slack

Formatting:
- Currency as $X,XXX.XX
- Percentages with 2 decimal places
- Guide users to upload CSV if no data available
- Professional but friendly tone for non-technical business owners
- Can chain multiple tools in a single response
```

### 5.3 Tool Definitions

#### `financial_analysis`
- **Zod Schema:** `{ query: z.string(), datasetId: z.string().optional() }`
- **Implementation:**
  1. Load user's latest FinancialData (or by datasetId)
  2. Return dataset info + computed KPIs:
     - `totalRevenue`, `totalExpenses`, `netProfit`
     - `profitMargin` = (netProfit / totalRevenue) * 100
     - `avgMonthlyRevenue` = totalRevenue / monthCount
     - `burnRate` = avg monthly expenses
     - `runway` = netProfit > 0 ? netProfit / avgMonthlyExpenses : 0
     - `growthRate` = ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
     - `monthlyBreakdown` array

#### `create_visualization`
- **Zod Schema:** `{ chartType: z.enum(['bar','line','pie','area']), title: z.string().optional(), metrics: z.array(z.string()).optional(), datasetId: z.string().optional() }`
- **Implementation:**
  1. Load dataset's monthlyBreakdown
  2. Build Recharts-compatible config:
     ```json
     {
       "id": "chart-{timestamp}-{random}",
       "type": "bar|line|pie|area",
       "title": "...",
       "config": {
         "data": [{ "month": "2024-01", "revenue": 1000, ... }],
         "xKey": "month",
         "yKeys": ["revenue", "expenses", "profit"],
         "colors": ["#6366f1", "#8b5cf6", "#ec4899", ...]
       },
       "createdAt": "ISO timestamp"
     }
     ```
  3. Return chart config (service will save to session and emit via socket)

#### `generate_strategy`
- **Zod Schema:** `{ timeframe: z.string().optional(), focus: z.string().optional() }`
- **Defaults:** timeframe = "90-day", focus = "growth"
- **Implementation:**
  1. Load latest financial KPIs if available
  2. Return context string for LLM to generate structured plan
  3. Format: 30-day / 60-day / 90-day phases with action items

#### `generate_report`
- **Zod Schema:** `{ title: z.string().optional(), type: z.enum(['summary','strategy','analysis']).optional() }`
- **Implementation:**
  1. Load latest financial data + KPIs
  2. Generate markdown report:
     - Overview section (data source, period, rows)
     - Key Metrics table (all KPIs)
     - Monthly Breakdown table
     - Highlights (auto-generated from KPIs)
  3. Save Report model to database
  4. Return `{ reportId, title, message: 'Report generated...' }`

#### `share_to_slack`
- **Zod Schema:** `{ reportId: z.string().optional(), message: z.string().optional(), channel: z.string().optional() }`
- **Implementation:**
  1. Try Composio SDK → `SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL`
  2. Fallback: POST to user's `slackConfig.webhookUrl`
  3. Return `{ success: boolean, method: 'composio'|'webhook' }`

### 5.4 Agent Streaming Pipeline

```
User Message → [Load History (20 msgs)] → [Build System Prompt]
    → [LangGraph Agent Stream]
        → on tool_call: SSE { type: 'tool_call', toolName, args }
        → on tool_result:
            → if chart: save to session, socket emit 'dashboard:chart_update'
        → on text chunk: SSE { type: 'token', content }
    → on complete:
        → Save Message to DB (content + toolCalls)
        → Update session title if first message
        → SSE { type: 'done', content }
    → on error: SSE { type: 'error', content }
```

---

## 6. Real-Time (Socket.io)

### 6.1 Connection
- **Transport:** WebSocket with polling fallback
- **Auth:** `{ auth: { token: JWT } }` on connection
- **Server validates** JWT on connect, rejects invalid tokens
- **CORS:** Same as Express CORS config

### 6.2 Rooms
| Room Pattern | Purpose |
|--------------|---------|
| `user:{userId}` | User-level events |
| `session:{sessionId}` | Session-specific chart updates |

### 6.3 Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `join:session` | `sessionId: string` | Subscribe to session chart updates |
| Client → Server | `leave:session` | `sessionId: string` | Unsubscribe from session |
| Server → Client | `dashboard:chart_update` | `{ id, type, title, config, createdAt }` | New chart added to session |

### 6.4 Chart Update Flow
1. Agent tool `create_visualization` returns chart config
2. Service calls `addChartToSession(sessionId, chartConfig)`
3. Chart saved to `ChatSession.dashboardState.charts` array
4. `io.to('session:' + sessionId).emit('dashboard:chart_update', chart)`
5. All connected clients in that session room receive the event

---

## 7. CSV Processing Service

### 7.1 Parse Pipeline
```
File Upload → Multer saves to disk
    → fs.readFileSync(filePath)
    → PapaParse.parse(csvString, { header: true, skipEmptyLines: true })
    → validateCSV(parsed)
    → inferColumnTypes(rows, fields)
    → computeSummary(rows, columns)
    → Save FinancialData model
    → Delete temp file
```

### 7.2 Validation Rules
| Rule | Threshold |
|------|-----------|
| Non-empty | At least 1 data row |
| Has headers | PapaParse `fields.length > 0` |
| Max rows | 10,000 |
| Parse errors | < 10 critical errors |

### 7.3 Column Type Inference
- **Sample:** First 50 rows per column
- **Number:** Value successfully parses as `parseFloat()` and is not `NaN`
- **Date:** Value successfully parses as `new Date()` and is valid
- **String:** Default fallback

### 7.4 Revenue/Expense/Date Column Detection
- **Revenue keywords:** `revenue`, `income`, `sales`, `earning` (case-insensitive, partial match on column name)
- **Expense keywords:** `expense`, `cost`, `spending`, `expenditure`
- **Date keywords:** `date`, `month`, `period`, `time`

### 7.5 Summary Computation
```javascript
computeSummary(rows, columns):
  1. Find revenueCol, expenseCol, dateCol by keyword matching
  2. Group rows by month (YYYY-MM from dateCol)
  3. Per month:
     revenue  = SUM(revenueCol values)
     expenses = SUM(expenseCol values)
     profit   = revenue - expenses
  4. Totals:
     totalRevenue  = SUM(all monthly revenues)
     totalExpenses = SUM(all monthly expenses)
     netProfit     = totalRevenue - totalExpenses
  5. Return { totalRevenue, totalExpenses, netProfit, monthlyBreakdown }
```

---

## 8. Authentication & Security

### 8.1 JWT
- **Algorithm:** Default (HS256)
- **Expiration:** 7 days
- **Payload:** `{ userId: string }`
- **Storage:** Client localStorage
- **Transport:** `Authorization: Bearer {token}` header

### 8.2 Password Hashing
- **Library:** bcryptjs
- **Salt Rounds:** 12
- **Applied:** On signup, compared on login

### 8.3 Google OAuth
- **Library:** Passport.js + passport-google-oauth20
- **Scope:** `profile email`
- **Flow:** Authorization Code Grant
- **Account Linking:** If email exists → link googleId; if new → create account
- **Callback:** Redirect to `{CLIENT_URL}/auth/callback?token={jwt}`

### 8.4 Middleware Stack
```
1. helmet()                    — Security headers (CSP disabled)
2. cors({ origin: CLIENT_URL, credentials: true })
3. express.json()              — Body parsing
4. morgan('dev')               — Request logging (dev only)
5. rateLimiter                 — Per-route rate limits
6. auth middleware             — JWT validation on protected routes
7. errorHandler                — Centralized error responses
```

### 8.5 Rate Limits
| Limiter | Window | Max Requests | Applied To |
|---------|--------|-------------|------------|
| `authLimiter` | 15 min | 20 | `/auth/signup`, `/auth/login` |
| `chatLimiter` | 60 sec | 30 | `/chat/sessions/:id/messages` |
| `apiLimiter` | 15 min | 100 | All other `/api/*` routes |

### 8.6 Error Handling
| Error Type | Status Code |
|-----------|-------------|
| Validation (Mongoose) | 400 |
| Multer (file upload) | 400 |
| Duplicate key (MongoDB 11000) | 409 |
| Unauthorized | 401 |
| Not found | 404 |
| Unhandled | 500 |

---

## 9. Slack Integration Service

### 9.1 Composio (Primary)
```javascript
// Initialization
const composio = new Composio({ apiKey: COMPOSIO_API_KEY });

// Check status
getStatus(userId):
  composioConfigured = Boolean(COMPOSIO_API_KEY)
  if configured: check user's Slack connection via composio.connectedAccounts
  return { composioConfigured, slackConnected }

// Connect
connectSlack(userId):
  entity = composio.getEntity(userId)
  connection = entity.initiateConnection({ appName: 'slack' })
  return { authUrl: connection.redirectUrl }

// Send message
sendViaComposio(userId, channel, text):
  entity = composio.getEntity(userId)
  connection = entity.getConnection({ app: 'slack' })
  composio.executeAction('SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL', {
    channel: channel || '#general',
    text: text (first 2500 chars)
  }, { connectedAccountId: connection.id })
```

### 9.2 Webhook (Fallback)
```javascript
sendViaWebhook(webhookUrl, title, content):
  POST webhookUrl with body:
  {
    "blocks": [
      { "type": "header", "text": { "type": "plain_text", "text": "BizCopilot: {title}" } },
      { "type": "section", "text": { "type": "mrkdwn", "text": "{content}" } }
    ]
  }
```

### 9.3 Share Priority
1. If `COMPOSIO_API_KEY` set AND user has connected Slack → use Composio
2. Else if user has `slackConfig.webhookUrl` → use webhook
3. Else → return error "No Slack connection configured"

---

## 10. Client-Side Architecture

### 10.1 Provider Hierarchy
```
<AuthProvider>           — User state, token management
  <SocketProvider>       — Socket.io connection (requires auth)
    <DashboardProvider>  — Charts state, socket event listeners
      <RouterProvider>   — React Router
        <App />          — Route definitions
```

### 10.2 Route Map
| Path | Component | Auth Required |
|------|-----------|--------------|
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/auth/callback` | AuthCallbackPage | No |
| `/` | DashboardPage | Yes |

### 10.3 Context APIs

#### AuthContext
```javascript
// State
user: { id, email, name, avatar, slackConfig } | null
loading: boolean

// Methods
loginUser(token, userData)  — Store token, set user
logout()                    — Clear token, null user, redirect
setUser(userData)            — Update user state

// Init: checks localStorage token → GET /auth/me
```

#### SocketContext
```javascript
// State
socket: Socket | null

// Init: when user exists, connect with { auth: { token } }
// Cleanup: disconnect on unmount or user null
```

#### DashboardContext
```javascript
// State
charts: Array<ChartConfig>
activeSessionId: string | null

// Methods
joinSession(sessionId)  — socket.emit('join:session'), GET /dashboard/sessions/:id/charts
clearCharts()           — Reset charts to []

// Listener: 'dashboard:chart_update' → append to charts
```

### 10.4 Custom Hooks

#### useChat
```javascript
// State
sessions: Array<Session>
activeSession: Session | null
messages: Array<Message>
isStreaming: boolean
toolCalls: Array<ToolCall>

// Methods
loadSessions()                — GET /chat/sessions
createSession()               — POST /chat/sessions, set as active
selectSession(session)         — Set active, GET messages
sendMessage(content)           — POST SSE stream, handle events
removeSession(id)              — DELETE session, select another

// SSE Event Handling
'token'     → append to last assistant message content
'tool_call' → add to toolCalls array (state: 'input-available' → 'output-available')
'done'      → set isStreaming=false, clear toolCalls
'error'     → toast error, set isStreaming=false
```

#### useCSVUpload
```javascript
// State
datasets: Array<Dataset>
uploading: boolean
uploadResult: Dataset | null

// Methods
loadDatasets()        — GET /csv/datasets
upload(file)          — POST /csv/upload (FormData), toast success/error
removeDataset(id)     — DELETE /csv/datasets/:id
setUploadResult(val)  — Manual override
```

### 10.5 API Client
```javascript
// Axios instance
baseURL: '/api'
interceptors:
  request: Add Authorization header from localStorage
  response: On 401 → clear token, redirect to /login
```

---

## 11. Chart Rendering Specification

### 11.1 Config Shape
```typescript
interface ChartConfig {
  data: Array<Record<string, any>>;   // [{ month: '2024-01', revenue: 5000, ... }]
  xKey: string;                        // X-axis field name
  yKeys: string[];                     // Y-axis metric names
  colors: string[];                    // Hex color per yKey
}
```

### 11.2 Default Color Palette
```
#6366f1  (Indigo)
#8b5cf6  (Purple)
#ec4899  (Pink)
#f43f5e  (Rose)
#f97316  (Orange)
#eab308  (Yellow)
#22c55e  (Green)
#14b8a6  (Teal)
```

### 11.3 Chart Types
| Type | Recharts Component | Notes |
|------|-------------------|-------|
| `bar` | `BarChart` + `Bar` per yKey | Default type |
| `line` | `LineChart` + `Line` per yKey | With dots |
| `area` | `AreaChart` + `Area` per yKey | Filled |
| `pie` | `PieChart` + `Pie` | First yKey only |

### 11.4 Common Chart Features
- `ResponsiveContainer` width="100%" height="100%"
- `Tooltip` with custom styling
- `Legend` at bottom
- `CartesianGrid` with `strokeDasharray="3 3"` (bar/line/area)

---

## 12. KPI Computation Reference

```javascript
computeKPIs(summary) {
  const months = summary.monthlyBreakdown;
  const totalRevenue = SUM(months.map(m => m.revenue));
  const totalExpenses = SUM(months.map(m => m.expenses));
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgMonthlyRevenue = totalRevenue / months.length;
  const avgMonthlyExpenses = totalExpenses / months.length;
  const burnRate = avgMonthlyExpenses;
  const runway = avgMonthlyExpenses > 0 ? netProfit / avgMonthlyExpenses : 0;
  const first = months[0]?.revenue || 0;
  const last = months[months.length - 1]?.revenue || 0;
  const growthRate = first > 0 ? ((last - first) / first) * 100 : 0;

  return {
    totalRevenue, totalExpenses, netProfit, profitMargin,
    avgMonthlyRevenue, burnRate, runway, growthRate,
    monthlyBreakdown: months
  };
}
```

---

## 13. Report Generation Template

```markdown
# {title}

## Overview
- **Data Source:** {dataset.fileName}
- **Period:** {firstMonth} to {lastMonth}
- **Total Rows:** {dataset.rowCount}

## Key Metrics
| Metric | Value |
|--------|-------|
| Total Revenue | ${totalRevenue.toFixed(2)} |
| Total Expenses | ${totalExpenses.toFixed(2)} |
| Net Profit | ${netProfit.toFixed(2)} |
| Profit Margin | {profitMargin.toFixed(2)}% |
| Avg Monthly Revenue | ${avgMonthlyRevenue.toFixed(2)} |
| Burn Rate | ${burnRate.toFixed(2)}/mo |
| Growth Rate | {growthRate.toFixed(2)}% |

## Monthly Breakdown
| Month | Revenue | Expenses | Profit |
|-------|---------|----------|--------|
{rows}

## Highlights
- {profitability: "Business is profitable" | "Operating at a loss"}
- {growth: "Revenue growing at X%" | "Revenue declining at X%"}
- {margin: "Healthy profit margin above 20%" | "Profit margin below 20%, needs improvement"}
```

---

## 14. Deployment

### 14.1 Production Build
```bash
cd client && npm install && npm run build   # Vite → client/dist/
cd server && node src/index.js              # Express serves API + static
```

### 14.2 Static Serving (Production)
```javascript
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

### 14.3 Dependencies Summary

**Server (17 production deps):**
`@langchain/core`, `@langchain/google-genai`, `@langchain/langgraph`, `ai`, `axios`, `bcryptjs`, `composio-core`, `cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`, `mongoose`, `morgan`, `multer`, `papaparse`, `passport`, `passport-google-oauth20`, `passport-local`, `socket.io`, `zod`

**Client (30+ production deps):**
`react`, `react-dom`, `react-router-dom`, `axios`, `socket.io-client`, `recharts`, `react-markdown`, `react-dropzone`, `react-hot-toast`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/*` (14 packages), `@react-oauth/google`, `ai`, `streamdown`, `shiki`, `motion`, `nanoid`, `use-stick-to-bottom`

### 14.4 Database Indexes
| Collection | Field(s) | Type |
|-----------|----------|------|
| users | email | unique |
| users | googleId | sparse |
| messages | sessionId | index |
| chatsessions | userId | index |
| financialdata | userId | index |
| reports | userId | index |
