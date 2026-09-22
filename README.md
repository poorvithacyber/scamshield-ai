# 🛡️ ScamShield: AI-Powered Security Investigation Assistant

ScamShield is an AI-assisted cybersecurity investigation assistant designed to protect job seekers, students, and professionals from deceptive recruitment campaigns, advance-fee employment scams, and credential phishing.

Rather than merely generating an arbitrary score, ScamShield reconstructs how a scam could work, extracts verifiable evidence, contrasts claimed employer identities against observed channels, and provides an immediate executive security advisory.

---

## 📌 Problem & Purpose

Fraudulent employment communications and fake offer letters cause millions of dollars in losses annually. Scammers impersonate recognizable brands, fabricate urgent onboarding processes, and demand refundable "laptop security deposits" or "training fees" through unverified communication channels (e.g., Telegram, WhatsApp, Gmail).

**ScamShield** acts as a defensive pre-flight scanner:
- Analyzes unstructured offer letters, recruitment messages, application links, and screenshots.
- Surfaces concrete observed red flags with exact citations.
- Maps the scam progression pipeline (from initial lure to exploitation).
- Outlines clear, immediate defensive actions for candidates.

---

## ✨ Core Capabilities

1. **Offer & Message Scanner:**
   - Evaluates recruitment text for advance fees, equipment purchase demands, artificial urgency deadlines, and non-corporate communication channels.

2. **Recruitment URL Scanner:**
   - Inspects application links, login portals, and lookalike domains.
   - Allows correlated message context to compare the stated employer brand against the actual observed domain.

3. **Multimodal Screenshot Inspector:**
   - Performs optical character and layout analysis on uploaded offer letters, chat screenshots, or appointment contracts (PNG, JPG, WebP).
   - Extracts structured parameters such as Organization, Stated Salary, Payment Requests, Contact Handles, and Deadlines.

4. **Action-First Security Advisory (STOP / VERIFY FIRST / LOW CONCERN):**
   - Delivers immediate defensive guidance before diving into deep technical forensics.

5. **Evidence-Grounded Findings:**
   - Presents each finding as an actionable triad: **Observed Evidence** &rarr; **Risk Interpretation** &rarr; **Recommended Action**.

6. **Attack Progression Chain:**
   - Reconstructs the multi-stage threat progression (e.g., *Initial Lure &rarr; Coercion & Pressure &rarr; Financial Exploitation*).

7. **Claim vs. Evidence Comparison:**
   - Directly contrasts stated corporate identities against observed technical channels and corroboration status.

8. **Pre-Action Verification Checklist:**
   - Provides an interactive candidate checklist for validating top-level domains, official career portals, and recruiter identities before sharing any data.

9. **Incident Report Export:**
   - Formats a comprehensive plaintext report suitable for reporting incidents to cybersecurity teams, campus safety departments, or law enforcement.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | High-contrast, single-page cybersecurity dashboard |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive enterprise dark theme with semantic threat color scales |
| **Backend** | Node.js, Express, `tsx` | Secure API gateway handling input validation and rate limiting |
| **Build & Bundle** | `esbuild`, `vite` | Production-ready compilation to standalone `dist/server.cjs` |
| **AI Engine** | Google Gemini (`gemini-3.1-flash-lite`) | Server-side structured threat analysis via `@google/genai` SDK |

---

## 🔒 Security & Secrets Management

- **Server-Side API Key Protection:** The `GEMINI_API_KEY` is loaded strictly on the Node.js server via environment variables. It is **never** sent to the client browser or included in frontend bundles.
- **No Hardcoded Secrets:** Repository code contains zero credentials. `.env.example` provides non-sensitive placeholders.
- **Strict Git Exclusion:** `.gitignore` excludes `.env`, `.env.*`, `node_modules/`, and production build artifacts.
- **Ephemeral Data Processing:** Submitted text, URLs, and image payloads are processed in-memory for the duration of the analysis request and are not stored in any external database.
- **User Privacy Guardrail:** ScamShield prominently instructs users never to input passwords, OTPs, or active banking credentials.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js version 20.x or higher
- npm (bundled with Node.js)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/scamshield.git
cd scamshield
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a local `.env` file in the project root:
```bash
cp .env.example .env
```
Open `.env` and set your Google Gemini API key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Run Development Server
```bash
npm run dev
```
The application will be accessible at:
```
http://localhost:3000
```

---

## 📦 Production Build & Deployment

To verify and execute the production build:

```bash
# 1. Compile client assets and backend server
npm run build

# 2. Start the production server
npm start
```

### Deployment Architecture
- **Container Environment:** The application is packaged to run on container platforms like Google Cloud Run or any standard Docker / Node runtime.
- **Single Port Delivery:** Port `3000` hosts the Express backend API (`/api/*`) and serves the static production SPA assets from `dist/` with single-page application fallback routing.

---

## ⚖️ Limitations & Ethical Disclaimer

- **AI-Assisted Evaluation:** ScamShield provides heuristic and pattern-based risk assessment based on observed indicators. It does **not** constitute definitive legal evidence or confirmed proof of fraud.
- **Corroboration Checkpoints:** Technical indicators (such as domain age or recruiter identity) represent corroboration checkpoints based on pattern analysis; ScamShield does not perform live authenticated registrar WHOIS lookups.
- **Golden Rule of Employment:** Legitimate employers will never require candidates to deposit funds, purchase gift cards, or wire money to secure employment or receive company-provided equipment.
