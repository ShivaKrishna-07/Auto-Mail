# Architecture & Design Document

## 1. System Architecture

Auto Mail is a full-stack AI automation platform built with modern, scalable web technologies. It is separated into a Next.js frontend interface and a Node.js/Express backend API server, using Supabase as the primary data and vector store.

```text
                +---------------------------------+
                |      Next.js Frontend           |
                |  (Dashboard & User Interface)   |
                +----------------+----------------+
                                 |
                        REST APIs & Polling
                                 |
                                 v
                +---------------------------------+
                |       Node.js Backend           |
                |      (API & Background Sync)    |
                +----+-------------+---------+----+
                     |             |         |
          Google Gmail API    Supabase    Gemini AI 
                     |       (pgvector)      |
                     v             v         v
                Email Sync     Embeddings  Summaries,
               Send/Compose    Data Store  Chat, &
                                           RAG Pipeline
```

### Flow Summary
1. **Email Synchronization:** When a user logs in via Google OAuth, the backend fetches their recent emails from the Gmail API and stores them securely in the PostgreSQL database on Supabase.
2. **AI Processing:** New emails are automatically passed through the Gemini API to generate concise thread summaries and assign them to taxonomy categories (e.g., Finance, Job, Newsletter).
3. **AI Search (RAG):** The system converts thread summaries into vector embeddings (`text-embedding-004`). When a user asks a question, the AI performs semantic search via `pgvector` to find relevant emails and generates a synthesized answer, citing specific Message IDs.
4. **Email Drafting:** Users use the AI copilot to write new emails or draft context-aware replies directly through the Gmail API.

---

## 2. Database Schema

The database uses PostgreSQL via Supabase, with Drizzle ORM for schema definition and migrations. `pgvector` is utilized for semantic search capabilities.

### Key Tables

1. **`users`**
   - `id` (UUID): Primary key.
   - `email`: User's primary identifier.

2. **`gmail_accounts`**
   - Stores OAuth credentials (`accessToken`, `refreshToken`, `expiresAt`).
   - `historyId`: Used for incremental Gmail syncs.

3. **`threads`**
   - `id`: The standard Gmail Thread ID (Primary Key).
   - `subject`, `snippet`, `lastMessageDate`.
   - `summary`: An AI-generated summary of the entire conversation.
   - `summaryEmbedding`: A `vector(768)` field powered by `pgvector`. This embeds the thread's semantic meaning.
   - **Why Embed Threads?** Instead of embedding every individual message (which scatters context), embedding the *thread summary* ensures that semantic searches find complete conversations, providing much higher quality context to the RAG pipeline.

4. **`emails`**
   - `id`: The standard Gmail Message ID (Primary Key).
   - `threadId`: Foreign key to `threads`.
   - `sender`, `receiver`, `subject`, `body`, `html`.
   - `category`: The AI-classified label (e.g., Newsletter, Finance).

---

## 3. AI Design

### Email Summarization Strategy
- **Chunking:** Emails often contain bloated HTML and signatures. Before summarization, emails are aggressively cleaned using regex and HTML parsers to extract only the text payload. The cleaned text is truncated to a safe token limit (e.g., 10,000 characters) before being passed to Gemini.
- **Thread Context:** Rather than summarizing emails in a vacuum, thread summaries are updated recursively. When a new email arrives in an existing thread, the model is fed the previous thread summary + the new email body to generate an updated holistic summary.

### RAG Pipeline & Chat Agent
- **Embedding:** When a thread is summarized, the summary text is passed to Gemini's `text-embedding-004` model to generate a 768-dimensional vector. This vector is stored in the `threads.summaryEmbedding` column.
- **Retrieval:** When a user queries the chat agent, the query is embedded, and a cosine similarity search is executed against `pgvector`. The top 10 most relevant threads are retrieved. The system then fetches the full text of the individual emails belonging to those threads to build the prompt context.
- **Source Clarity:** To ensure strict attribution, the prompt instructs the AI to append the raw Google Message ID (e.g., `[18fb25ad9ef830ba]`) at the very end of sentences containing factual claims. The frontend intercepts these IDs using regex and replaces them with interactive `Ref` buttons that hyperlink to the actual email.
- **Hallucination Prevention:** The system prompt enforces a "strict adherence" policy: *"Do NOT assume, extrapolate, or hallucinate facts that are not explicitly stated in the context. If the emails do not contain enough information, simply state: 'I don't have access to emails that can answer this question.'"*

---

## 4. Gmail API Strategy

### Initial vs. Incremental Sync
- **Initial Sync:** On first login, the system queries the Gmail API for the user's most recent emails (e.g., last 30 days) and performs a deep fetch of message payloads.
- **Incremental Sync:** The system records the `historyId` returned by the Gmail API. On subsequent syncs, the backend uses `gmail.users.history.list` to fetch only the deltas (messages added or modified since the last `historyId`), dramatically reducing API calls. A date-based fallback is implemented if the `historyId` expires.

### Pagination & Quota Handling
- **Pagination:** The Gmail API limits batch sizes (typically 100). The sync service uses pagination tokens (`pageToken`) to loop through large inboxes. To prevent blocking the UI, the frontend polls the sync status, displaying a live progress bar while the backend fetches batches in the background.
- **Rate Limiting:** The backend utilizes an exponential backoff wrapper (`withGeminiFallback`) for AI calls and respects `429 Too Many Requests` codes from both Google and AI providers. Concurrent message fetching is batched (e.g., `Promise.all` with a chunk size of 10) to stay within Google's burst limits.

---

## 5. Tool & Technology Decisions

- **Frontend (Next.js + Tailwind):** Chosen for its robust routing, fast rendering, and excellent developer experience. Tailwind provides a highly scalable and consistent design system.
- **Backend (Node.js + Express):** Selected for its non-blocking I/O, which is ideal for handling heavily async workflows like API proxying and concurrent email fetching.
- **Database (Supabase + pgvector):** PostgreSQL provides strong relational integrity for nested threads and emails, while `pgvector` offers native semantic search capabilities without the need for a separate, disconnected vector database (like Pinecone).
- **Skipping NVIDIA NIM (Trade-off):** Although initially considered for secondary categorization tasks, introducing an entirely separate LLM provider adds network latency, increases point-of-failure risks, and complicates API key management. Gemini 2.5 Flash proved sufficiently fast and cheap to handle both complex RAG workflows and simple zero-shot categorization tasks efficiently. Thus, to maintain a lean architectural footprint, Gemini was used exclusively.

---

## 6. Trade-offs & Limitations

- **Background Job Queue:** Currently, background syncing and categorization are executed in memory during the request lifecycle or via simple async loops. In a true enterprise environment, these would be offloaded to a dedicated message broker (like RabbitMQ or Redis/BullMQ) for robust retry mechanics and distributed processing.
- **Webhooks (Push Notifications):** Instead of real-time Gmail Push Notifications (Google Cloud Pub/Sub), the application currently relies on a pull mechanism (user-initiated syncs). Implementing Pub/Sub would provide instant syncing but requires public HTTPS endpoints and more complex infrastructure setup.
- **Deep Thread Summarization:** For extremely long threads (e.g., 50+ emails), the current text truncation strategy might drop historical nuance. A "rolling summary" or MapReduce summarization approach would be necessary for massive enterprise email chains.
