# BizCopilot 🚀
*AI-Powered Business Intelligence Copilot*

**[🌍 Live Demo: https://chatbot-6bn3.onrender.com/](https://chatbot-6bn3.onrender.com/)**

BizCopilot is an intelligent, unified dashboard and conversational AI agent designed to help users synthesize, analyze, and communicate financial datasets quickly. It bridges the gap between raw data analysis, smart visualizations, and easy team sharing.

---

## 🌟 Video Walkthrough
**[Watch the Loom Video Walkthrough](https://www.loom.com/share/8c2e1e48a439445a8c9303b25e202b6a)**

## ✨ Key Features

### 1. **Interactive AI Chat (Powered by LangGraph & Gemini)**
- Talk to business data like a colleague. 
- The AI autonomously selects tools to answer data questions, generate visualization code, write summaries, and create reports.

### 2. **Dynamic Live Dashboard**
- Visualize financial and operational data in real-time.
- Multi-dimensional layout where AI pushes KPI scorecards and responsive Recharts graphs directly to your dashboard.

### 3. **Rich Reporting & Document Generation**
- The AI creates markdown financial reports and strategies.
- Store reports securely in the "Reports" library.

### 4. **Slack Integration (Via Composio)**
- **Share anywhere**: Distribute dashboard snapshots or generated reports straight to your Slack channel.
- **Rich Block Kit Interface**: Reports appear elegantly formatted inside Slack instead of raw ugly markdown.
- *Simple connect*: Seamlessly connect to your Slack Workspace via your user setting.

### 5. **CSV & Connector Data Hub**
- Upload proprietary datasets seamlessly using CSVs.
- Supports external DB integrations (conceptually wired).

---

## 🛠 Tech Stack

- **Client**: React 19, Vite, TailwindCSS, Shadcn UI, Recharts
- **Server**: Node.js, Express, Socket.IO
- **Database**: MongoDB & Mongoose
- **AI & Agent framework**: LangGraph, Google Gemini API
- **Authentication**: Passport.js (Google OAuth + Local)
- **Integrations**: Composio (Slack), Slack Webhook

---

## 🚀 Local Development Setup

### 1. Prerequisite
Ensure you have Node.js 18+ and a MongoDB instance running.

### 2. Environment Variables
Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```
Fill out `CLIENT_URL`, `MONGODB_URI`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `COMPOSIO_API_KEY` etc.

### 3. Install NPM Packages
```bash
# In the root repo folder
npm run install:all
```

### 4. Run Locally
We use standard `concurrently` to spin up both apps.
```bash
npm run dev
```
Client: http://localhost:5173  
Server: http://localhost:5001

---
