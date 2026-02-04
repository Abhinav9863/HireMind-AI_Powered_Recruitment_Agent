# HireMind - AI-Powered Recruitment Agent

HireMind is an advanced recruitment platform that leverages Artificial Intelligence to streamline the hiring process. It features automated resume parsing, AI-driven candidate interviews, and intelligent Application Tracking System (ATS) scoring to connect HR professionals with the best talent efficiently.

![HireMind Dashboard](./screenshot.png)

## 🚀 Key Features

### For HR Professionals
- **Smart Job Posting**: Detailed job descriptions with specific requirements (experience, location, skills).
- **Automated Screening**: Immediate ATS scoring of applicant resumes against job descriptions.
- **AI Interview Insights**: View summaries and full transcripts of the AI's chat with candidates.
- **Efficient Dashboard**: Track status (New, Interviewing, Accepted, Rejected) and manage applications in real-time.

### For Candidates
- **Easy Application**: Upload resumes (PDF) and apply with a single click.
- **Interactive AI Interview**: Chat with an intelligent bot that asks relevant technical and behavioral questions based on the job role.
- **Real-time Status**: Track application progress transparently.

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (SQLModel/SQLAlchemy)
- **Vector DB**: Qdrant (for semantic search & matching)
- **AI/LLM**: Llama 3.1 8B (via Groq API), LangChain
- **Authentication**: JWT (JSON Web Tokens) with Dual OTP (Email/SMS)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Email Service**: Brevo (formerly Sendinblue)
- **SMS Service**: Twilio

## 📋 Prerequisites

Before you began, ensure you have the following installed:
- **Docker** and **Docker Compose**
- **Node.js** (v18+)
- **Python** (v3.11+)

## 🚀 Quick Start (Docker)

The easiest way to run the application is using Docker.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/HireMind.git
    cd HireMind
    ```

2.  **Configure Environment Variables**
    Create a `.env` file in the `backend/` directory based on `.env.example`.
    ```bash
    cp backend/.env.example backend/.env
    ```
    *Fill in your keys (Groq, Database URL, etc.).*

3.  **Start Services**
    ```bash
    docker-compose up -d --build
    ```

4.  **Access the Application**
    - **Frontend**: http://localhost:5173
    - **Backend API Docs**: http://localhost:8000/docs
    - **Vector DB Dashboard**: http://localhost:6333/dashboard

## 🔧 Manual Setup (Local Development)

If you prefer running services individually without Docker:

### Backend Setup

1.  Navigate to `backend`:
    ```bash
    cd backend
    ```
2.  Create and activate virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run database migrations (or ensure DB is running):
    ```bash
    # Ensure PostgreSQL is running locally on port 5435 (or update .env)
    python main.py
    ```

### Frontend Setup

1.  Navigate to `frontend`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```

## 🔐 Environment Variables

Required variables in `backend/.env`:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `GROQ_API_KEY` | API Key for Llama 3 models |
| `SECRET_KEY` | Strong random string for JWT encryption |
| `QDRANT_URL` | URL for Qdrant Vector DB (default: http://localhost:6333) |
| `BREVO_API_KEY` | API Key for sending emails |
| `TWILIO_ACCOUNT_SID` | Twilio SID for SMS OTP |

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built with ❤️ by the HireMind Team*
