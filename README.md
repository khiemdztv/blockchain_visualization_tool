# HubBlock — Blockchain Visualization Tool

**HubBlock** is an interactive educational web application designed to visualize the SHA-256 cryptographic hash function and the fundamental mechanisms of blockchain technology. Built for the **Student Scientific Research Competition (SVNCKH 2025)** at Ho Chi Minh City University of Banking.

---

## Overview

The project addresses the challenge of making complex cryptographic and blockchain concepts accessible to students through hands-on, visual demonstrations. Rather than relying on theoretical explanations alone, HubBlock provides real-time, interactive simulations that allow users to observe and experiment with the mathematical properties underpinning modern blockchain security.

The application supports both **Vietnamese** and **English**, and features both a light and dark display theme.

---

## Features

### Hash Demo
Real-time SHA-256 hash computation. Any input text is hashed instantly, demonstrating the fixed 256-bit (64 hex character) output length regardless of input size.

### Avalanche Effect Visualizer
Illustrates how a single character change in the input causes approximately 50% of the output bits to change, visually conveying the sensitivity of cryptographic hash functions.

### Mining Simulator
Simulates the Proof-of-Work mining process. Users can observe the nonce search loop in real time and experience how mining difficulty exponentially increases the computational effort required.

### Blockchain Explorer
A live blockchain simulation where users can add blocks, tamper with block data, and observe how a modification invalidates the integrity of all subsequent blocks in the chain.

### Difficulty Lab
Demonstrates why Bitcoin auto-adjusts its mining difficulty every 2,016 blocks (~2 weeks) to maintain a stable 10-minute block generation time.

### AI Chatbot Assistant
An integrated conversational assistant powered by the OpenAI GPT-4o-mini API. It answers questions about blockchain, cryptography, and application usage in both Vietnamese and English.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 |
| Build Tool | Vite 5 |
| Backend Server | Node.js (built-ins only: `http`, `crypto`, `fs`) |
| Hash Algorithm | SHA-256 via Web Crypto API and Node.js `crypto` |
| AI Integration | OpenAI GPT-4o-mini API |
| Styling | Vanilla CSS |
| Dev Concurrency | `concurrently` |

No heavy external UI libraries are used. The blockchain core logic is implemented from scratch and mirrors the accompanying Java reference implementation (`Block.java`, `Blockchain.java`, `ProofOfWork.java`, `HashUtil.java`).

---

## Project Structure

```
blockchain_visualization_tool-main/
├── server.js                  # Node.js backend: blockchain core + HTTP API
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json
├── src/
│   ├── App.jsx                # Root component: routing, navigation, theme/language switching
│   ├── main.jsx
│   ├── data/
│   │   ├── lang.js            # Full bilingual string definitions (VI/EN)
│   │   └── team.js            # Team member and supervisor data
│   ├── views/
│   │   ├── HomeView.jsx       # Landing page with live SHA-256 demo
│   │   ├── HashDemoView.jsx   # Interactive hash property demonstrations
│   │   ├── MiningView.jsx     # Mining simulator, explorer, difficulty lab, theory
│   │   ├── AboutProjectView.jsx # Project description and content overview
│   │   └── AboutTeamView.jsx  # Team profiles and contact information
│   ├── components/
│   │   ├── Chatbot.jsx        # AI chatbot overlay (GPT-4o-mini)
│   │   ├── BlockchainCanvas.jsx # Canvas-based blockchain rendering
│   │   ├── ParticleBackground.jsx # Animated particle background
│   │   └── Footer.jsx
│   ├── styles/
│   └── utils/
├── public/                    # Static assets (logos, avatars)
├── Block.java                 # Java reference: block data model
├── Blockchain.java            # Java reference: chain logic
├── BlockchainServer.java      # Java reference: server
├── ProofOfWork.java           # Java reference: mining
└── HashUtil.java              # Java reference: hashing utilities
```

---

## Backend API Reference

The Node.js server runs on port `3001` by default (configurable via environment variable `PORT`).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chain` | Returns the full blockchain state |
| POST | `/api/block/add` | Mines and appends a new block |
| POST | `/api/block/tamper` | Tampers with a block's data (breaks integrity) |
| POST | `/api/block/restore` | Re-mines a block and all subsequent blocks |
| GET | `/api/mine/stream` | Server-Sent Events stream for real-time mining animation |
| POST | `/api/hash` | Computes SHA-256 of an input string |
| POST | `/api/hash/steps` | Returns intermediate SHA-256 computation steps |
| POST | `/api/merkle` | Builds a Merkle tree from a list of transactions |
| POST | `/api/difficulty` | Sets the mining difficulty (1–5) |
| POST | `/api/reset` | Resets the blockchain to genesis state |
| GET | `/api/validate` | Validates chain integrity and returns per-block validity |
| POST | `/api/chat` | Proxies chat messages to OpenAI GPT-4o-mini |
| GET | `/health` | Health check endpoint |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- An OpenAI API key (required only for the AI Chatbot feature)

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd blockchain_visualization_tool-main
npm install
```

### Environment Configuration

Create a `.env` file in the project root. No external packages are required to load it — the server reads it natively.

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

If `OPENAI_API_KEY` is not provided, all features except the AI Chatbot will function normally.

### Running in Development

The following command starts both the Node.js backend server and the Vite development server concurrently:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Building for Production

```bash
npm run build
```

This outputs a production-ready bundle to the `dist/` directory. The Node.js server is configured to serve this directory as static files, making it a self-contained deployment.

### Running in Production

```bash
npm start
```

The server serves both the static frontend and the API from port `3001` (or the port defined by `PORT`).

---

## Development Notes

The blockchain mining difficulty ranges from **1 to 5**. Each increment multiplies the average number of hashing attempts by 16 (since each hex character has 16 possible values). The nonce search is capped at 2,000,000 attempts per operation.

For the Blockchain Explorer, the chain starts with a **Genesis Block** and supports adding, tampering, and restoring blocks.

---

## Team

This project was developed by students of the **Faculty of Data Science in Business** at Ho Chi Minh City University of Banking (HUB), established 1976.

| Name | Role |
|---|---|
| TS. Nguyen Hoai Duc | Faculty Supervisor — Department of Computer Science |
| Lam Tuan Vu | Team Lead, Backend Developer |
| Do Gia Khiem | Frontend Developer |
| Nguyen Vu Thang | Research and Documentation |

**Contact**
- Email: vtkteam2005@gmail.com
- Supervisor: nguyenhoaduc@hub.edu.vn

---

## License

This project is licensed under the MIT License.

---

*HubBlock — SVNCKH 2025 — Ho Chi Minh City University of Banking*
