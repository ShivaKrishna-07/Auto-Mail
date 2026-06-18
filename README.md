# Auto Mail - AI-Powered Email Ingestion & RAG Assistant
## AI Automation Executive Assessment

An intelligent, production-grade email assistant that syncs email threads, applies Gemini-based summaries and categorization, indexes content in a PostgreSQL database using `pgvector` embeddings, and implements a Retrieval-Augmented Generation (RAG) conversational search dashboard.

---

## 🚀 Key Features

1. **OAuth2 Workspace Integration**: Secure authentication via Google to retrieve profile data and request scopes for email read/write access.
2. **Robust Sync Engine**: Supports paginated initial sync and incremental synchronization using Gmail `historyId`, with an automated date-based fallback.
3. **AI Pipeline (Gemini)**:
   - **Summarization**: Generates concise 1-2 sentence summaries for individual emails, plus a unified conversation summary for threads.
   - **Smart Classification**: Auto-categorizes emails into `Professional`, `Personal`, `Notification`, `Finance`, `Newsletter`, or `Job`.
   - **Gemini Embeddings**: Translates text bodies into 768-dimensional float arrays utilizing `text-embedding-004`.
4. **Vector RAG Chat Interface**: Semantic search on inbox records using pgvector cosine distance, responding with citation references that link to email previews.
5. **Context-Aware Composing & Replying**: Composes new messages and replies inside threads with correct MIME base64 headers (`Message-ID`, `In-Reply-To`, `References`) to keep mail thread grouping intact.
6. **Premium Themeable Dashboard**: Designed with elegant light/dark styles, glassmorphism card panels, and full feature-based folder organization.
7. **TanStack React Query Integration**: Core data fetching and mutation layers utilize `@tanstack/react-query` to manage cached queries, state management, and optimized refetches.

---

## 📂 Folder Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment parser
│   │   ├── db/              # Drizzle schema (camelCase to snake_case) & connection
│   │   ├── middleware/      # JWT authorization middleware
│   │   ├── controllers/     # Controller classes delegating requests to services
│   │   ├── services/        # Service logic (Gmail, AI, Embeddings, RAG)
│   │   ├── routes/          # Express route definitions
│   │   └── index.ts         # Server bootstrapping
│   ├── drizzle.config.ts
│   └── tsconfig.json
├── frontend/
│   ├── app/                 # Next.js App Router (strictly page & layout routing files)
│   ├── src/
│   │   ├── components/      # Global shared, Providers, and shadcn UI components
│   │   ├── utils/           # Global utility helpers (e.g., category resolver)
│   │   ├── lib/             # API HTTP Client helpers
│   │   ├── features/        # Modular domains (auth, inbox, chat, compose)
│   │   │   └── [feature]/   
│   │   │       ├── components/  # Feature UI components
│   │   │       ├── pages/       # Feature page layouts
│   │   │       ├── hooks/       # custom React Query hooks (useThreads, useChat, etc.)
│   │   │       └── services/    # api service calls (authService, inboxService, etc.)
│   └── package.json
├── Architecture.md          # Technical design documentation
└── README.md                # Quickstart instructions
```

---

## 🛠️ Local Installation & Configuration

### Prerequisites
- Node.js (v18+) & npm
- Supabase (PostgreSQL with `pgvector` enabled)
- Google Cloud Console Project (with Gmail API enabled and OAuth 2.0 Credentials)
- Gemini API Key

---

### Step 1: Environment Configuration

Create the following files in the project subdirectories:

#### Backend Environment (`backend/.env`)
```env
PORT=5000
NODE_ENV=development

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# Database Connection (Supabase PostgreSQL URL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# JWT Session Secret
JWT_SECRET=your-jwt-session-secret-key
```

#### Frontend Environment (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 2: Backend Setup & Database Migration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run Drizzle migration to push the schema definition to Supabase:
   ```bash
   npm run db:push
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

The backend server will launch on `http://localhost:5000`. You can inspect the health check at `http://localhost:5000/health`.

---

### Step 3: Frontend Setup & Dev Run

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Next.js development client:
   ```bash
   npm run dev
   ```

The frontend client will launch on `http://localhost:3000`. Open it in your browser, connect your Google account, sync your inbox, and test the AI chat & compose workflows!
