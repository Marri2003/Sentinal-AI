# 🛡️ SentinelAI — Web Frontend

A modern, high-performance web interface for the **SentinelAI Multi-Modal Phishing & Smishing Detection System**.

Built with **React 18**, **Vite**, **Tailwind CSS**, and **Lucide Icons**, designed to evaluate SMS text, screenshot images (via Tesseract OCR), and sender metadata in real-time.

---

## 🌟 Key Features

- **Multi-Modal Threat Scanner**: Input SMS text, screenshot images, or both.
- **Tesseract OCR Integration**: Upload a screenshot of an SMS, and the system extracts and analyzes the text automatically without requiring manual typing.
- **Multilingual Support**: Tailored for Indian fraud contexts in English, Hindi, and Telugu.
- **Transparent Explainability**: Visual threat meters, modality breakdown (Text, Image, Metadata), token attribution chips, and suspicious feature indicators.
- **Actionable Recommendations**: Clear, contextual security advice on what to do and what NOT to do when a threat is identified.
- **Interactive Demo Showcase**: Pre-loaded real-world fraud scenarios (SBI KYC suspension, electricity cutoff fraud, fake subsidy schemes, and safe bank alerts).
- **Responsive & Accessible**: Clean, modern UI styled with Tailwind CSS, supporting both desktop and mobile devices.

---

## 🏗️ Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Sticky navigation with mobile menu
│   │   ├── Footer.jsx          # Footer with project links & credits
│   │   └── ResultCard.jsx      # Threat score meter, pipeline breakdown, explainability
│   ├── pages/
│   │   ├── Home.jsx            # Landing page with stats, fraud examples & hero
│   │   ├── Analyze.jsx         # Main multi-modal scanner & screenshot OCR
│   │   ├── Demo.jsx            # Pre-loaded interactive fraud scenarios
│   │   ├── About.jsx           # Technical deep-dive on XLM-RoBERTa & fusion
│   │   └── Help.jsx            # FAQ and Indian Cyber Crime helpline (1930)
│   ├── services/
│   │   └── sentinelApi.js      # REST API client connecting to FastAPI backend
│   ├── App.jsx                 # Client-side routing with React Router
│   ├── index.css               # Tailwind directives & CSS custom variables
│   └── main.jsx                # React DOM entry point
├── .env                        # API Base URL configuration
├── index.html                  # HTML5 template
├── package.json                # Dependencies & scripts
├── tailwind.config.js          # Tailwind theme & color palette
└── vite.config.js              # Vite bundler configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (installed with Node.js)

### 2. Installation
Open your terminal in the `frontend` directory:

```bash
cd frontend
npm install
```

### 3. Configure the Backend API URL
Create or edit `.env` in the `frontend` folder:

```env
# Point to your local FastAPI server
VITE_API_BASE_URL=http://127.0.0.1:8000

# Or point to your cloud Hugging Face backend when deployed
# VITE_API_BASE_URL=https://your-username-sentinelai-backend.hf.space
```

### 4. Run Development Server
```bash
npm run dev
```

The frontend will start at **`http://127.0.0.1:5173`**.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

This compiles the static assets into the `dist/` folder.

---

## ☁️ Deployment to Vercel

1. Push this repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Select your GitHub repository.
4. If your project is in a monorepo, set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend-url.hf.space` (or your cloud backend API).
6. Click **Deploy**. Vercel will build and host your website in ~30 seconds with automatic CI/CD on every `git push`.

---

## 📄 License
MIT License. Built for the SentinelAI Phishing Detection System.
