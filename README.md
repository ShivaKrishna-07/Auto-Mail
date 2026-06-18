# Auto Mail - AI-Powered Email Assistant

Auto Mail is a smart email client that syncs with your Gmail account to summarize emails, auto-categorize them into folders, and allows you to search your inbox using AI.

## 🚀 Key Features

- **Gmail Sync**: Securely connect and sync your emails.
- **AI Folders**: Automatically categorizes emails (e.g., Finance, Job, Newsletter).
- **AI Summaries**: Instantly summarizes long email threads.
- **AI Search**: Ask questions about your inbox and get answers with citations.
- **Smart Compose**: Draft replies and new emails with an AI copilot.

---

## 📂 Folder Structure

The project is split into two main modules:

- `backend/`: Node.js Express server. Handles database connections, Gmail API syncing, and Gemini AI processing.
- `frontend/`: Next.js React application. Contains the user interface, dashboards, and client-side logic.

---

## 🛠️ Local Installation & Setup

### Prerequisites
- Node.js installed
- A PostgreSQL database (e.g., Supabase)
- Google Cloud Console Project (with Gmail API enabled)
- Gemini API Key(s)

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory based on the `.env.example` file.

**Backend (`backend/.env`)**
```env
PORT=5000
NODE_ENV=development

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Gemini API Keys (comma-separated if using multiple keys for fallback)
GEMINI_API_KEYS=your_first_gemini_api_key_here,your_second_gemini_api_key_here

# Database Connection
DATABASE_URL=postgresql://postgres:your_password_here@db.your_project_id.supabase.co:5432/postgres

# JWT Session Secret
JWT_SECRET=your_jwt_session_secret_key_here
```

Create a `.env.local` file in the `frontend/` directory based on the `.env.example` file.

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run the Backend Server

Open your terminal and navigate to the backend folder:

```bash
cd backend
npm install
npm run db:push  # Syncs database tables
npm run dev      # Starts server on port 5000
```

### 3. Run the Frontend App

Open a new terminal window and navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev      # Starts frontend on port 3000
```

Open `http://localhost:3000` in your browser to start using Auto Mail!
