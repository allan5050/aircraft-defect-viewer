# Aviadex: Scalable Aircraft Defect Viewer

An advanced, scalable dashboard for viewing and analyzing aircraft maintenance defects, built with a modern hybrid architecture.

---

## 🏗️ Architecture Overview

This project uses a hybrid architecture that leverages the strengths of a low-code backend for data management and a custom microservice for specialized analytics.

-   **Frontend**: A responsive **React (Vite)** dashboard built with **Material-UI**. It handles dynamic filtering, pagination, and data visualization. It communicates with two different backend services.
-   **Low-Code Backend (Database)**: **Supabase** (PostgreSQL) serves as the primary database. It handles the core CRUD operations for defect records and offers a scalable, secure, and auto-generated API. All primary defect data is fetched directly from Supabase.
-   **Microservice Backend (Analytics)**: A lightweight **FastAPI (Python)** server that runs two specific, computationally-intensive tasks:
    1.  A cached endpoint for general analytics (`/api/analytics`).
    2.  An endpoint that runs manual Python code (`/api/insights`) to generate deeper insights like Mean Time Between Failures (MTBF).

This separation of concerns allows the application to scale efficiently. The resource-intensive data hosting is offloaded to a managed service (Supabase), while the custom business logic remains in a lean, easy-to-maintain Python service.

## 🛠️ Tooling & Stack

This project was built to demonstrate a modern development workflow, balancing manual coding, AI assistance, and low-code platforms.

### 🤖 AI Tools Used

-   **AI-Assisted Development (Cursor)**: An AI-powered code editor was used to:
    -   Generate boilerplate code for React components and FastAPI endpoints.
    -   Refactor code, such as converting API-fetching logic to use the Supabase client.
    -   Identify and fix bugs, like adding missing component imports.
    -   Write and structure documentation and setup scripts.

### 🔧 Low-Code Components

-   **Supabase**: Chosen as the low-code backend for its simplicity and power.
    -   **Database**: A managed PostgreSQL database for storing defect records.
    -   **API Layer**: Provides an instant, secure, and scalable API for data access without writing backend code for basic data operations.
    -   **Scalability**: Offloads the complexity of database management, allowing developers to focus on application features.

### ✍️ Handwritten Code

-   **Frontend Components (React/JSX)**: All UI components (`DefectTable`, `DefectFilters`, `DefectAnalytics`, `DefectInsights`) create a tailored user experience with Material-UI.
-   **Manual Python Analytics (`backend/analytics.py`)**: The `DefectAnalyzer` class was written manually in Python to implement specific business logic (e.g., MTBF calculation) that is not easily achievable with standard database queries. This represents the custom, high-value logic of the application.

## 📊 Scalability Approach

The architecture was designed with scalability as a primary concern.

### Current Implementation (Handles 10k+ records)

-   **Frontend**:
    -   **Pagination**: The UI uses API-based pagination, fetching only 50 records at a time. This keeps the DOM light and initial load times fast, regardless of the total dataset size.
    -   **Efficient Filtering**: Filters are applied at the database level via Supabase queries, ensuring that data transfer is minimized.
-   **Backend**:
    -   **Supabase (PostgreSQL)**: Handles the heavy lifting of data storage and querying. PostgreSQL is production-grade and can be scaled easily within the Supabase dashboard.
    -   **Indexed Queries**: The `setup.sql` script creates indexes on `aircraft_registration`, `severity`, and `reported_at` for high-performance filtering and sorting.
    -   **Analytics Caching**: The main analytics endpoint on the FastAPI service is cached (`@lru_cache`) to reduce redundant computations for frequently requested data.

### Production Roadmap

-   **Frontend Rendering**: For datasets in the hundreds of thousands, **virtual scrolling** (e.g., using TanStack Virtual) would be implemented in `DefectTable` to render only the visible rows, ensuring 60 FPS scrolling.
-   **Backend Architecture**:
    -   **Read Replicas**: Supabase supports PostgreSQL read replicas to distribute the load for high-traffic scenarios.
    -   **Data Warehouse**: The FastAPI analytics service could be pointed to a dedicated data warehouse (like BigQuery or a Snowflake replica) to prevent analytical queries from impacting transactional performance.
    -   **Serverless Deployment**: The FastAPI service can be deployed as a serverless function (e.g., AWS Lambda, Vercel Functions) to scale horizontally on demand.

---

## 🚦 Setup and Run Instructions

Follow these steps to get the project running locally.

### 1. Supabase Setup (Low-Code Backend)

1.  **Create a Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Create Tables and Views**:
    -   Navigate to the **SQL Editor** in the Supabase dashboard.
    -   Click **New query**.
    -   Copy and paste the entire content of `setup.sql` from this repository and click **RUN**. This will create the `defects` table and the `distinct_aircraft` view.
3.  **Get API Credentials**:
    -   Go to **Project Settings** > **API**.
    -   You will need two values:
        -   The **Project URL**.
        -   The **`public` anon key**.

### 2. Frontend Setup

1.  **Navigate to the frontend folder**:
    ```bash
    cd frontend
    ```
2.  **Create Environment File**:
    -   Create a file named `.env` in the `frontend/` directory.
    -   Add your Supabase credentials to it like this:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`.

### 3. Backend Setup (Analytics Service & Data Seeding)

1.  **Navigate to the backend folder** (in a new terminal):
    ```bash
    cd backend
    ```
2.  **Create Environment File**:
    -   Create a file named `.env` in the `backend/` directory.
    -   Go to your Supabase **Project Settings** > **API** again.
    -   This time, copy the **`service_role` secret key**.
    -   Add your credentials to the `.env` file like this:
        ```env
        SUPABASE_URL=YOUR_SUPABASE_URL
        SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY
        ```
3.  **Install Dependencies**:
    ```bash
    # Install Python dependencies
    pip install -r requirements.txt

    # Install Node.js dependencies (for the seeding script)
    npm install
    ```
4.  **Seed the Database**:
    -   Run the seeding script to populate your Supabase table with the sample data. This script will delete any existing data before inserting the new records.
    ```bash
    node seed_supabase.mjs
    ```
5.  **Run the Analytics Server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The backend analytics service will be running at `http://localhost:8000`.

You should now have the full application running!

## 🎯 Trade-offs & Future Improvements

1.  **Analytics Database**: The FastAPI service currently uses a local SQLite database for the main analytics dashboard. In production, this is a bottleneck. The next step would be to point it to a proper data warehouse or a read replica of the main database.
2.  **Real-time Updates**: The app currently relies on manual refreshes. Supabase's real-time capabilities could be used to subscribe to database changes and update the UI instantly when new defects are reported.
3.  **Authentication**: Supabase provides a full authentication suite. The application could be extended to include user roles (e.g., engineers, managers) with different permissions.