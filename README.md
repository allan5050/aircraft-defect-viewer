# What you built and why

At the top of the application homepage, I built an analytics dashboard that gives users a quick overview of the most important issues in the large dataset. These metrics help users focus on key problems first. Below the data visualizations, I added a 'Manual Code Insights (Python)' section, which is the handwritten analytics part of the program. This provides a quick pulse on operational performance based on the current view, helping enterprise teams better understand their data.

The 'Aircraft Defect Records' table fulfills the requirement to show all reported defects for the selected aircraft and severity. The table supports filtering, and users can search for aircraft across very large datasets without slowdowns, thanks to performance optimizations in the search field.

To handle large datasets (over 100,000 records), the application provides two scalable rendering strategies:

1. **Standard Pagination:** Each page loads exactly 50 records from the database using efficient `LIMIT/OFFSET` SQL queries. This provides consistent performance regardless of total dataset size.

2. **Virtual Scrolling:** Combines React Window (renders only visible rows) with infinite loading (loads 50 records at a time as you scroll). This enables smooth 60fps scrolling through massive datasets while maintaining low memory usage.

Rows in the table can be expanded to show full defect details. This approach allows busy users to expand multiple rows at once, providing more context than a modal-based approach.

If the Supabase database is unavailable, the application falls back to using SQLite to show mock data. This ensures users can still interact with the system and see basic data, even if a backend service is down.

---

# Stack used and why

- **Frontend:** React (Vite) with Material-UI for a modern, responsive dashboard. React is widely adopted, fast, and has a rich ecosystem for building scalable UIs.
- **Backend:** Python (FastAPI) for analytics and fallback data serving. Python is my most proficient language for prototyping and is well-suited for rapid development and integration with AI tools.
- **Low-Code Backend:** Supabase (managed PostgreSQL) for instant, scalable, and secure data storage and API access. Supabase is fast to set up and requires minimal code for CRUD operations.
- **Fallback:** SQLite is used for local analytics and as a backup data source if Supabase is unavailable.
- **Other:** Node.js for data seeding scripts.

Python was chosen for its speed of development and strong documentation, which also makes it highly compatible with LLM-based development. Supabase was selected as a low-code/no-code PostgreSQL database because it can be set up in minutes with minimal configuration, making it ideal for rapid prototyping.

---

# How you used AI/LLMs

I used the Anthropic Claude Opus model to generate an initial architecture, folder structure, and code outline based on the requirements. I then moved this skeleton into Cursor IDE, where I used the built-in AI agent to help with setup, debugging, and incremental feature development.

Speech-to-text was used to interact with the LLM more efficiently, allowing me to provide detailed input quickly. The audio is transcribed by Microsoft Azure's speech-to-text service.

- **AI-Assisted Development (Cursor):** Used for generating boilerplate code, refactoring, bug fixing, and documentation.
- **AI for Architecture:** Used LLMs to design the initial architecture and folder structure.
- **AI for SQL:** Used LLMs to generate the initial Supabase setup SQL script.

---

# What was handled via low-code

- **Supabase:** Used as a low-code/no-code backend for data storage and API. Only a simple SQL script (`setup.sql`) was needed to set up the database, with no backend code required for basic CRUD operations.
- **Supabase Client:** Used for querying and filtering data in the frontend with minimal code.

---

# How the solution could scale in a production system:

## Frontend rendering strategies
- **True Pagination:** Each page request loads ONLY 50 records from the database (not all records), providing genuine scalability to millions of records with consistent performance.
- **Virtual Scrolling + Infinite Loading:** Uses React Window to render only ~15 visible rows at any time. Records are loaded incrementally (50 at a time) as you scroll, accumulating in memory but never overwhelming the DOM. This enables smooth 60fps scrolling through 100k+ records.
- **Debounced Search:** Prevents excessive API calls by waiting 300ms after typing before searching.
- **Skeleton Loading:** Provides immediate visual feedback while data loads.
- **Component Memoization:** Uses React's memoization features to prevent components from re-rendering when their data hasn't changed. This is like caching the component's output to avoid unnecessary work, making the UI more responsive.
- **Code Splitting:** (Planned) Instead of loading all code at once, the application will be split into smaller chunks that load only when needed. This means the initial page load will be faster since users only download the code they need right away.

## Backend architecture
- **Supabase:** Managed PostgreSQL with instant API, scalable for high-traffic scenarios.
- **FastAPI Microservice:** Handles analytics and custom business logic, with LRU caching (keeps most recently used data in memory for faster access) and rate limiting (SlowAPI) to prevent abuse.
- **Read Replicas:** (Planned) Use Supabase read replicas for load distribution.
- **Serverless Deployment:** (Planned) Deploy FastAPI as a serverless function for horizontal scaling.
- **Fallback to SQLite:** If Supabase is down, analytics and mock data are served from a local SQLite database.

## Data flow and optimization
- **Database-Level Filtering:** All filters are applied at the database level for efficiency.
- **Indexed Queries:** Indexes on key columns for high-performance filtering and sorting.
- **LRU Caching:** Analytics endpoints are cached with automatic invalidation.
- **Efficient Data Loading:** 
  - **Pagination Mode:** Each request loads exactly 50 records via `LIMIT/OFFSET` SQL queries
  - **Virtual Scroll Mode:** Records loaded incrementally (50 per page) as user scrolls, using TanStack Query's infinite loading
  - **Analytics:** Calculations performed in the database using SQL aggregations, not by fetching all records
- **Rate Limiting:** Endpoint-specific limits to ensure fair resource usage.
- **Materialized Views & Partitioning:** (Planned) For sub-second analytics and large table performance.

---

# Setup and run instructions

## 1. Supabase Setup (Low-Code Backend)
1.  **Create a Project:** Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Create Tables and Views:**
    -   Navigate to the **SQL Editor** in the Supabase dashboard.
    -   Click **New query**.
    -   Copy and paste the entire content of `setup.sql` from this repository and click **RUN**. This will create the `defects` table and the `distinct_aircraft` view.
3.  **Get API Credentials:**
    -   Go to **Project Settings** > **API**.
    -   You will need two values:
        -   The **Project URL**.
        -   The **`public` anon key**.

## 2. Frontend Setup
1.  **Navigate to the frontend folder:**
    ```bash
    cd frontend
    ```
2.  **Create Environment File:**
    -   Create a file named `.env` in the `frontend/` directory.
    -   Add your Supabase credentials to it like this:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

## 3. Backend Setup (Analytics Service & Data Seeding)
1.  **Navigate to the backend folder** (in a new terminal):
    ```bash
    cd backend
    ```
2.  **Set up and activate virtual environment:**
    ```bash
    # Create virtual environment (if not already created)
    python -m venv venv

    # Activate virtual environment
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  **Create Environment File:**
    -   Create a file named `.env` in the `backend/` directory.
    -   Go to your Supabase **Project Settings** > **API** again.
    -   This time, copy the **`service_role` secret key**.
    -   Add your credentials to the `.env` file like this:
        ```env
        SUPABASE_URL=YOUR_SUPABASE_URL
        SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
        ```
4.  **Install Dependencies:**
    ```bash
    # Install Python dependencies
    pip install -r requirements.txt

    # Install Node.js dependencies (for the seeding script)
    npm install
    ```
5.  **Seed the Database:**
    -   Run the seeding script to populate your Supabase table.
    ```bash
    node backend/seed_supabase.mjs data/SMALL_air_defects.json
    ```
    > **Note:** You can specify which data file to use (e.g., `large_aircraft_defects.json`).

6.  **Run the Analytics Server:**
    -   **Option 1: From Project Root (Recommended):**
        -   Make sure you are in the project's root directory (the one containing `frontend` and `backend`).
        -   Run the server using:
        ```bash
        uvicorn backend.main:app --reload --port 8000
        ```
    
    -   **Option 2: From Backend Directory:**
        -   If you are inside the `backend` directory, use:
        ```bash
        uvicorn main:app --reload --port 8000
        ```
        > **Note:** The app is designed to work from both locations. If you get a "ModuleNotFoundError: No module named 'backend'" error, make sure you're using the correct command for your current directory.
    
    The backend analytics service will be running at `http://localhost:8000`.

You should now have the full application running!

## 📂 Data Model & Sample Dataset
The core entity in the defect viewer tool is a single **defect report**. Defects are stored in (and exposed from) the `defects` table in Supabase using the following schema:

```sql
CREATE TABLE defects (
  id                  TEXT PRIMARY KEY,
  aircraft_registration TEXT      NOT NULL,
  reported_at           TIMESTAMP NOT NULL,
  defect_type           TEXT      NOT NULL,
  description           TEXT      NOT NULL,
  severity              TEXT      NOT NULL CHECK (severity IN ('Low','Medium','High'))
);
```

• **Sample JSON** – A synthetic dataset matching this schema is available at `data/aircraft_defects.json` (10k+ rows). The smaller `data/SMALL_air_defects.json` (~200 rows) is handy for quick local tests.
• **Seeding** – The `backend/seed_data.py` script can generate an even larger dataset; `backend/seed_supabase.mjs` uploads either JSON file directly to Supabase.

> The UI displays *aircraft_registration*, *defect_type*, *severity*, and *reported_at* in the table. Clicking the chevron on any row expands a **collapsible details panel** with the full *description* and metadata—fulfilling the row expansion requirement.

---

# What you'd improve with more time

With more time, I would add more analytics and "hot-button" filtering/searching to speed up the user experience and improve system performance. For example, a common enterprise use case might be to find critical defects for today, so I would create a hot button to filter for today's critical defects. Optimizing these queries would reduce compute and database load, and help users find what they need faster.

I would also allow users to create their own dashboards and hot buttons, enabling them to work more efficiently and helping the development team learn which patterns are most useful. By supporting customization, we can better understand user needs and improve the product for everyone.

Finally, I would conduct more performance load-testing for the dashboard and table search features to ensure that even with 10,000,000+ records, the application remains fast and responsive.

Additionally, I would refactor the core pagination to use keyset (or "cursor-based") pagination instead of the current `OFFSET` approach. While `OFFSET` is suitable for browsing initial pages, keyset pagination would provide near-constant query time even for very deep page numbers (e.g. page 20,000), making the system truly scalable for enterprise use cases.