# Architecture Overview

Auto Mail is built using a modern, scalable web stack separated into a frontend interface and a backend API server.

## 1. High-Level Diagram

```text
                +---------------------------------+
                |      Next.js Frontend           |
                |  (Dashboard & User Interface)   |
                +----------------+----------------+
                                 |
                        REST APIs & WebSockets
                                 |
                                 v
                +---------------------------------+
                |       Node.js Backend           |
                |      (API & Background Sync)    |
                +----+-----------------------+----+
                     |                       |
           Google Gmail API              Gemini AI
```

## 2. Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Supabase)
- **AI Processing:** Google Gemini API

## 3. Core Workflows

1. **Email Synchronization:** When a user logs in, the backend fetches their recent emails from the Gmail API and stores them securely in the PostgreSQL database.
2. **AI Processing:** New emails are automatically passed through the Gemini API to generate short summaries and assign them to a folder (like Finance, Job, or Newsletter).
3. **AI Search:** The system converts emails into vector embeddings. When a user asks a question, the AI searches for the most relevant emails and generates an answer using them as context.
4. **Email Drafting:** Users can use the AI copilot to write new emails or draft replies, which are sent back directly through the Gmail API.
