# Nebula KnowLab — AI-Powered Mail Web Application

## 1. Project Overview

Nebula KnowLab is a full-stack mail web application where an AI assistant **controls the application UI through natural language**. It is not a chatbot — the assistant calls backend tool functions that produce visible, real changes in the React frontend (opening compose, populating fields, filtering the inbox, opening emails, drafting and confirming sends).

## 2. Features

- **Google OAuth 2.0 login** with Gmail scopes (read, send, modify)
- **Real Gmail inbox / sent views** fetched via the Gmail API
- **Email detail view** with full body and reply capability
- **Compose view** with To / Subject / Body and Send / Cancel
- **AI assistant panel** that controls the application UI via tool/function calling
- **Six AI tools**: `compose_email`, `search_emails`, `open_email`, `filter_emails`, `reply_to_email`, `send_email`
- **Send confirmation dialog** (human-in-the-loop) before any email actually leaves the account
- **Assistant rich results** — email cards rendered inside the chat that open emails in the main UI
- **Manual UI filters** (sender, keyword, date range, read/unread) that work independently of the AI
- **Application context** passed to the assistant (current view, open email, active filters, compose state) so commands like "reply to this" resolve correctly

## 3. Architecture

```
React Frontend ──REST──▶ Express Backend ──▶ Gmail API (user's OAuth tokens)
       ▲                     │
       │                     └──▶ OpenAI API (function calling)
       │
  MailContext / AssistantContext (frontend state driven by AI tool results)
```

The frontend and backend are completely separate directories. The frontend talks to the backend through REST endpoints only — React never touches Gmail or OpenAI directly.

- **Mail service** (`gmail.service.js`) wraps all Gmail API calls and returns a clean email model.
- **AI service** (`ai.service.js`) handles OpenAI function calling and executes the chosen tool.
- **UI logic** lives in React contexts (`MailContext`, `AssistantContext`).

## 4. Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | React 18, Vite 5, React Router 6, Tailwind CSS 3 |
| Backend    | Node.js, Express 4, express-session, helmet, cors |
| Email      | Gmail API via `googleapis`                  |
| AI         | OpenAI API (function calling, `gpt-4o-mini`)|
| Database   | PostgreSQL — *not currently used*; Gmail is the source of truth. A DB can be added later for prefs/sync state. |

## 5. Folder Structure

```
root/
  frontend/
    src/
      components/    Sidebar, EmailList, EmailCard, EmailDetail, Compose,
                     ReplyBox, Filters, Assistant, AssistantMessage,
                     LoadingSpinner, ErrorMessage, SendConfirmation, EmptyState
      pages/         Login, Inbox, Sent, EmailView, ComposePage
      context/       AuthContext, MailContext, AssistantContext
      services/      api.js
      hooks/         useAuth, useMail, useAssistant
      App.jsx
      main.jsx
    vite.config.js
    tailwind.config.js
  backend/
    src/
      server.js
      routes/        auth.routes, mail.routes, ai.routes
      controllers/   auth.controller, mail.controller, ai.controller
      services/      gmail.service, oauth.service, ai.service
      ai/tools/      composeEmail, searchEmails, openEmail, filterEmails,
                     replyToEmail, sendEmail, index
      middleware/    auth, errorHandler
      utils/         gmailParser
    .env.example
  README.md
  .gitignore
```

## 6. Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (e.g. "nebula-knowlab").
3. Go to **APIs & Services → OAuth consent screen**, choose *External*, configure the app name and your email.
4. Add scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`, `userinfo.email`, `userinfo.profile`.
5. Add yourself as a **test user** while in testing mode.

## 7. Gmail API Setup

1. In the same project, go to **APIs & Services → Library**.
2. Enable the **Gmail API**.
3. Go to **Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Add authorized redirect URI: `http://localhost:4000/api/auth/google/callback`.
6. Copy the **Client ID** and **Client Secret**.

## 8. OAuth Setup

The OAuth flow:

```
User clicks "Continue with Google"
      │
      ▼
Backend redirects to Google consent screen
      │
      ▼
Google redirects to /api/auth/google/callback with a code
      │
      ▼
Backend exchanges code for tokens, stores them in the httpOnly session
      │
      ▼
User is redirected back to the frontend
      │
      ▼
Frontend calls GET /api/auth/me and displays the inbox
```

Run the backend with the frontend running so the redirect URI matches.

## 9. OpenAI API Setup

1. Create an account at [platform.openai.com](https://platform.openai.com).
2. Create an API key: **API Keys → Create new secret key**.
3. Add credits to your account (function calling on `gpt-4o-mini` is cheap).

## 10. Environment Variables

Create `backend/.env` from `backend/.env.example`:

```
PORT=4000
NODE_ENV=development
SESSION_SECRET=a-long-random-string
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
OPENAI_API_KEY=...
FRONTEND_URL=http://localhost:5173
```

The frontend reads `VITE_API_URL` (optional). If unset it defaults to `/api`, and Vite's dev server proxies `/api` to `http://localhost:4000`.

## 11. Local Development

Requires Node.js 18+. Run the backend and the frontend in two terminals.

### 12. How to Run Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### 13. How to Run Backend

```bash
cd backend
npm install
cp .env.example .env # then fill in real values
npm run dev          # http://localhost:4000
```

Verify the backend is up: `GET http://localhost:4000/api/health` → `{ "status": "ok" }`.

## 14. AI Tool Architecture

The assistant is implemented with OpenAI **tool/function calling**. The flow:

```
User: "Show me unread emails from this week"
        │
        ▼
POST /api/ai/chat { message, context }
        │
        ▼
OpenAI returns tool_call: filter_emails({ unread: true, after: "20260830" })
        │
        ▼
Backend executes filter_emails → runs Gmail query
        │
        ▼
Backend returns structured { action: "FILTER", emails: [...] }
        │
        ▼
Frontend applyAiResult() updates MailContext → Inbox list re-renders
        │
        ▼
Assistant shows "Showing unread emails from this week."
```

Each tool returns a structured `{ action, ... }` envelope that the frontend maps to real state changes. The assistant is **not allowed** to manipulate React code directly — only through these pinned tools.

| Tool              | Arguments                                             | Frontend result                              |
| ----------------- | ----------------------------------------------------- | -------------------------------------------- |
| `compose_email`   | `to`, `subject`, `body`                               | Navigate to `/compose`, fields visibly populated |
| `search_emails`   | `sender`, `keyword`, `after`, `before`, `unread`, `limit` | Results replace the main email list + cards in chat |
| `open_email`      | `emailId`                                             | Open the email in the detail view            |
| `filter_emails`   | `sender`, `keyword`, `after`, `before`, `unread`      | Inbox filtered                              |
| `reply_to_email`  | `emailId`, `body`                                     | Compose opens pre-filled with reply          |
| `send_email`      | `to`, `subject`, `body`                               | Shows the send-confirmation dialog          |

## 15. Example Assistant Commands

- "Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm"
- "Show me emails from the last 10 days"
- "Find the email from Sarah about the project update"
- "Open the latest email from David"
- "Reply to this saying I'll review it tomorrow"
- "Show only unread emails from this week"
- "Compose a draft to me with subject Notes and body Don't forget the demo"

## 16. Architecture Decisions

1. **Tool-based AI over direct UI manipulation** — the model only ever calls a fixed set of validated tools; the frontend decides how to interpret the structured result. Safe, testable, and the model can never inject arbitrary code.
2. **Backend owns all credentials** — Gmail and OpenAI calls happen server-side. The frontend only sees the user's own Gmail data via the Express API.
3. **Sessions over JWT** — a simple httpOnly server session holds the Gmail tokens. Simplest correct approach for this scope; swappable later.
4. **Context as explicit data** — the current view, open email, filters and compose state are serialized and sent with every AI request, giving the model the "this" resolution it needs.
5. **Structured tool envelopes** — every tool result uses an `action` discriminator so frontend handling code stays declarative.

## 17. Trade-offs

- **Real-time sync is not wired yet.** The code structure leaves room for Gmail watch / PubSub (see "What could be improved"). Currently the inbox refreshes on navigation and after actions.
- **No PostgreSQL yet.** Gmail is the source of truth, so no DB is strictly needed. A DB would be useful later for AI preferences, push notification state, and caching.
- **Inbox reads are limited to ~20 emails per page** by default to keep responses fast; more pages could be added.
- **The reply feature sends the reply directly**; the AI path always confirms first, and the manual UI confirms when composed via the assistant.

## 18. Screenshots / Demo Instructions

1. Start both servers (`npm run dev` in `backend/` and `frontend/`).
2. Open `http://localhost:5173`, click **Continue with Google**, authorize.
3. The inbox loads real Gmail messages. Click one to open it.
4. Open the **Assistant** panel and try: *"Show me unread emails from this week."* Watch the inbox update.
5. Try: *"Compose an email to you@example.com with subject Hello and body Hi there."* The compose screen opens with the fields populated.
6. Click Send and confirm in the dialog.

## 19. What Could Be Improved With More Time

- **Gmail real-time sync** via `users.watch` + Pub/Sub push to `/api/webhook/gmail`, updating the inbox live.
- **Message separate offloading** of thread-based grouping (Gmail conversations).
- Pagination and search history.
- **PostgreSQL** for user preferences, assistant memory, and persisted filter state per account.
- Mark as read/unread and labels management.
- Unit and integration tests (Jest/Vitest, Supertest) and CI.
- Streaming assistant responses (SSE) for a smoother chat feel.
- Multi-account support and token refresh handling via a token store.

---

**Status:** Phase 1 — foundation (scaffolding, placeholders, routing, API client, layouts, and both servers) is complete. Gmail OAuth is implemented on the backend; the next step is configuring real credentials and then progressively enabling Gmail + AI integration end-to-end.