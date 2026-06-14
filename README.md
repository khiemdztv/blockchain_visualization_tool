# HubBlock — Interactive Blockchain Education Platform

**HubBlock** is a full-stack interactive educational web application designed to visualize cryptographic algorithms and blockchain mechanisms. Users can explore SHA-256 hashing, RSA encryption, Merkle Trees, Proof-of-Work mining, and test their knowledge through an integrated quiz & certification system.

Built for the **Student Scientific Research Competition (SVNCKH 2025)** at Ho Chi Minh City University of Banking.

> 🌐 **Live Demo:** [hubblock.onrender.com](https://hubblock.onrender.com)

--

## Overview

The project addresses the challenge of making complex cryptographic and blockchain concepts accessible to students through hands-on, visual demonstrations. Rather than relying on theoretical explanations alone, HubBlock provides real-time, interactive simulations that allow users to observe and experiment with the mathematical properties underpinning modern blockchain security.

The application supports both **Vietnamese** and **English**, and features both **light** and **dark** display themes.

---

## Features

### 🏠 Home Page
Landing page with a live SHA-256 hash demo, animated particle background, and quick navigation to all major features.

### #️⃣ Hash Demo (Mô phỏng Hash)
- **Real-time SHA-256 hashing** — Any input text is hashed instantly, demonstrating the fixed 256-bit (64 hex character) output.
- **Avalanche Effect Visualizer** — Illustrates how a single character change causes ~50% of the output bits to flip.
- **Step-by-step SHA-256 computation** — View the intermediate steps of the algorithm (message schedule, compression rounds).

### ⛏️ Mining & Blockchain (Khai thác)
- **Mining Simulator** — Simulates Proof-of-Work with real-time nonce search and adjustable difficulty (1–5).
- **Blockchain Explorer** — Add blocks, tamper with data, and observe how modifications invalidate subsequent blocks.
- **Difficulty Lab** — Demonstrates why Bitcoin auto-adjusts difficulty every 2,016 blocks (~2 weeks).
- **Mining Theory** — Educational content explaining PoW mechanics, hash rate, and economic incentives.

### 🔐 RSA Encryption (Mã hoá RSA)
- **Key Generation Demo** — Visualize RSA key pair generation with prime numbers p and q.
- **Encrypt/Decrypt** — Step-by-step RSA encryption and decryption with mathematical formulas.
- **Digital Signature** — Sign messages and verify signatures using RSA.
- **Math Breakdown** — Detailed view of modular exponentiation, Euler's totient, and the Extended Euclidean Algorithm.

### 🌳 Merkle Tree
- **Interactive Tree Builder** — Enter transaction data and watch the Merkle Tree build in real time.
- **Proof Verification** — Select any leaf node and visualize the Merkle proof path to the root.
- **Tamper Detection** — Modify a transaction and see how the root hash changes.
- **Zoomable Canvas** — Pan and zoom the tree visualization for large datasets.
- **Theory Section** — Educational content on Merkle Trees, SPV verification, and use in Bitcoin/Ethereum.

### 📝 Quiz & Certification System (Quiz)
- **500 bilingual questions** across 9 topics (Hash, Mining, RSA, Merkle, Blockchain Basics, Cryptography, P2P Network, Smart Contracts, Security).
- **3 difficulty levels** — Easy, Medium, Hard — selectable per topic.
- **Practice Mode** — Study at your own pace with instant feedback and explanations.
- **Exam Mode** — Timed 40-question test (60 minutes) with automated grading.
  - Distribution: 16 easy + 16 medium + 8 hard questions, randomly shuffled.
  - Pass threshold: 70% (28/40).
- **Progress Tracking** — Circular progress indicator on each topic card showing % completed.
- **PDF Certificate** — Auto-generated "Foundation of Blockchain" certificate upon passing, with custom display name and unique verification code.
- **Detailed Result Review** — Review all answers with correct answers and explanations after submission.

### 👤 User Authentication
- **Email/Password registration & login** with bcrypt password hashing.
- **Google OAuth login** via Google Identity Services (GIS).
- **JWT-based session management** — Secure API access with Bearer tokens.
- **User Profile page** — View stats, exam history, and certificates.

### 🤖 AI Chatbot Assistant
An integrated conversational assistant powered by **OpenAI GPT-4o-mini** with a RAG (Retrieval-Augmented Generation) engine. It answers questions about blockchain, cryptography, and application usage in both Vietnamese and English, using indexed educational content for accurate responses.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | TailwindCSS + Custom CSS |
| Backend | Node.js (native `http`, `crypto`, `fs`) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT + bcryptjs + Google OAuth |
| AI | OpenAI GPT-4o-mini + RAG engine |
| PDF Generation | jsPDF |
| Deployment | Render |

The blockchain core logic is implemented from scratch and mirrors the accompanying Java reference implementation (`Block.java`, `Blockchain.java`, `ProofOfWork.java`, `HashUtil.java`).

---

## Project Structure

```
blockchain_visualization_tool/
├── server.js                     # Node.js backend: blockchain core + HTTP API + static serving
├── db.js                         # MongoDB Atlas connection (Mongoose)
├── index.html                    # HTML entry point (includes Google GSI script)
├── vite.config.js                # Vite configuration with API proxy
├── package.json
├── .env                          # Environment variables (not committed)
│
├── middleware/
│   └── auth.js                   # JWT verification middleware
├── models/
│   ├── User.js                   # User schema (email, Google OAuth, avatar)
│   ├── QuizProgress.js           # Per-question practice progress
│   ├── TestAttempt.js            # Exam attempt records
│   └── Certificate.js            # Issued certificates with verification codes
├── routes/
│   ├── auth.js                   # Auth routes: register, login, Google OAuth, profile
│   └── quiz.js                   # Quiz routes: questions, topics, progress, exam, certificates
│
├── rag_engine.js                 # RAG search engine for AI chatbot
├── rag_ingest.js                 # Script to build RAG index from documents
├── rag_index.json                # Pre-built RAG vector index
│
├── src/
│   ├── App.jsx                   # Root component: routing, navigation, theme/language
│   ├── main.jsx                  # React entry point
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state (token, user, login/logout)
│   ├── data/
│   │   ├── lang.js               # Bilingual string definitions (VI/EN)
│   │   ├── team.js               # Team member and supervisor data
│   │   └── quiz_questions.json   # 500 bilingual quiz questions
│   ├── views/
│   │   ├── HomeView.jsx          # Landing page with live SHA-256 demo
│   │   ├── HashDemoView.jsx      # Hash property demonstrations & avalanche effect
│   │   ├── MiningView.jsx        # Mining simulator, explorer, difficulty lab
│   │   ├── rsa/
│   │   │   ├── RSADemoView.jsx   # RSA encryption main view
│   │   │   └── components/       # RSA sub-components (keygen, encrypt, sign, math)
│   │   ├── QuizView.jsx          # Quiz system: topics, practice, exam, results, certificate
│   │   ├── ProfileView.jsx       # User profile, stats, exam history
│   │   ├── AboutProjectView.jsx  # Project description
│   │   └── AboutTeamView.jsx     # Team profiles and contact
│   ├── components/
│   │   ├── Chatbot.jsx           # AI chatbot overlay (GPT-4o-mini + RAG)
│   │   ├── LoginModal.jsx        # Login/Register modal with Google OAuth
│   │   ├── BlockchainCanvas.jsx  # Canvas-based blockchain rendering
│   │   ├── ParticleBackground.jsx # Animated particle background
│   │   ├── Footer.jsx
│   │   ├── merkle/               # Merkle Tree components (tree, node, input, zoom, theory)
│   │   └── ui/                   # Reusable UI components (Button, Card, Badge, Input)
│   ├── styles/
│   │   └── global.css            # All application styles
│   └── utils/
│
├── public/                       # Static assets (logos, avatars)
├── generate_questions.js         # Quiz question generation script
│
├── Block.java                    # Java reference: block data model
├── Blockchain.java               # Java reference: chain logic
├── BlockchainServer.java         # Java reference: server
├── ProofOfWork.java              # Java reference: mining
└── HashUtil.java                 # Java reference: hashing utilities
```

---

## Backend API Reference

The Node.js server runs on port `3001` by default (configurable via `PORT`).

### Blockchain & Crypto

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chain` | Returns the full blockchain state |
| POST | `/api/block/add` | Mines and appends a new block |
| POST | `/api/block/tamper` | Tampers with a block's data (breaks integrity) |
| POST | `/api/block/restore` | Re-mines a block and all subsequent blocks |
| GET | `/api/mine/stream` | SSE stream for real-time mining animation |
| POST | `/api/hash` | Computes SHA-256 of an input string |
| POST | `/api/hash/steps` | Returns intermediate SHA-256 computation steps |
| POST | `/api/merkle` | Builds a Merkle tree from a list of transactions |
| POST | `/api/difficulty` | Sets the mining difficulty (1–5) |
| POST | `/api/reset` | Resets the blockchain to genesis state |
| GET | `/api/validate` | Validates chain integrity |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/google` | Login/register with Google OAuth ID token |
| GET | `/api/auth/me` | Get current user profile (requires JWT) |
| GET | `/api/config` | Returns Google Client ID for frontend |

### Quiz & Certification

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/quiz/questions` | Get questions (filterable by `topic`, `difficulty`) |
| GET | `/api/quiz/topics` | Get topic statistics (question counts per difficulty) |
| POST | `/api/quiz/progress` | Save practice answer progress (requires auth) |
| GET | `/api/quiz/progress` | Get user progress stats by topic & difficulty |
| POST | `/api/exam/start` | Start a timed 40-question exam (requires auth) |
| POST | `/api/exam/submit` | Submit exam answers for grading (requires auth) |
| GET | `/api/exam/history` | Get user's past exam attempts |
| GET | `/api/cert/my` | Get user's earned certificates |
| GET | `/api/cert/verify/:code` | Verify a certificate by its unique code |

### AI Chatbot

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message to GPT-4o-mini with RAG context |
| GET | `/health` | Health check endpoint |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **MongoDB Atlas** account (free tier works)
- **OpenAI API key** (required for AI Chatbot)
- **Google OAuth Client ID** (required for Google login)

### Installation

```bash
git clone https://github.com/khiemdztv/blockchain_visualization_tool.git
cd blockchain_visualization_tool
npm install
```

### Environment Configuration

Create a `.env` file in the project root. The server reads it natively — no `dotenv` package needed.

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID (enables Google login) |
| `OPENAI_API_KEY` | Optional | OpenAI API key (enables AI Chatbot) |
| `PORT` | Optional | Server port (default: `3001`) |

> Without `MONGODB_URI`, quiz progress, authentication, and certification features are disabled. All visualization features still work.

### Running in Development

```bash
npm run dev
```

This starts both the Node.js backend and Vite dev server concurrently:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

### Building for Production

```bash
npm run build
```

Outputs a production bundle to `dist/`. The server is configured to serve this directory as static files.

### Running in Production

```bash
npm start
```

Serves both the frontend and API from port `3001` (or `PORT`).

---

## Deployment

The application is deployed on **Render** as a Web Service.

1. Connect the GitHub repository to Render.
2. Set **Build Command:** `npm install && npm run build`
3. Set **Start Command:** `npm start`
4. Add all environment variables (`MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`) in the Render Environment settings.

---

## Quiz System Details

### Topics (9 total)
| ID | Topic (VI) | Topic (EN) |
|---|---|---|
| `hash` | Hàm băm & SHA-256 | Hash Functions & SHA-256 |
| `mining` | Khai thác & PoW | Mining & Proof of Work |
| `rsa` | Mã hoá RSA | RSA Encryption |
| `merkle` | Cây Merkle | Merkle Trees |
| `blockchain_basics` | Cơ bản Blockchain | Blockchain Basics |
| `crypto_fundamentals` | Mật mã học | Cryptography Fundamentals |
| `network` | Mạng P2P & Node | P2P Network & Nodes |
| `smart_contracts` | Smart Contract | Smart Contracts |
| `security` | Bảo mật | Security & Attacks |

### Question Format
Each question is bilingual (Vietnamese/English) with:
- 4 multiple-choice options
- Correct answer index
- Detailed explanation in both languages

### Exam Rules
- **40 random questions** (16 easy + 16 medium + 8 hard)
- **60-minute time limit**
- **70% pass threshold** (28/40 correct)
- Upon passing: PDF certificate generated with custom display name and unique verification code

---

## Development Notes

- Mining difficulty ranges from **1 to 5**. Each increment multiplies average hashing attempts by 16×. Nonce search is capped at 2,000,000 attempts.
- The Blockchain Explorer starts with a **Genesis Block** and supports adding, tampering, and restoring blocks.
- The RAG engine indexes educational documents for AI chatbot context. Rebuild the index with `node rag_ingest.js`.
- Quiz questions can be regenerated or extended via `generate_questions.js`.

---

## Team

Developed by students of the **Faculty of Data Science in Business** at Ho Chi Minh City University of Banking (HUB), established 1976.

| Name | Role |
|---|---|
| TS. Nguyen Hoai Duc | Faculty Supervisor — Department of Computer Science |
| Lam Tuan Vu | Team Lead, Backend Developer |
| Do Gia Khiem | Frontend Developer |
| Nguyen Vu Thang | Research and Documentation |

**Contact**
- Email: vtkteam2005@gmail.com
- Supervisor: ducnh@hub.edu.vn

---

## License

This project is licensed under the MIT License.

---

*HubBlock — SVNCKH 2025 — Ho Chi Minh City University of Banking*
