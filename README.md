# Voice Hub

Voice Hub is a Next.js app for two voice workflows:
- **Text to Speech (TTS)** in the browser using the Web Speech API.
- **Speech to Text (STT)** using Google Gemini via a server API route.

## Features

- Modern single-page UI built with React + Tailwind.
- Browser microphone recording with live interim transcript.
- Server-side audio transcription through Gemini (`/api/gemini/stt`).
- Configurable Gemini model with `GEMINI_MODEL_NAME`.
- Strict `.env` key handling for Gemini API authentication.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- `@google/generative-ai`

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm
- A valid Google Gemini API key
- Microphone permissions in your browser

## Environment Setup (.env only)

This project is configured to use **only** `.env` for Gemini credentials.

Create or update `.env` in the project root:

```dotenv
GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash
```

Notes:
- Do not use placeholder values like `add-your-gemini-api-key`.
- If `.env.local` exists, remove it to avoid accidental override behavior.
- `.env` is currently ignored by git (see `.gitignore`).

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` – start development server
- `npm run build` – create production build
- `npm run start` – start production server
- `npm run lint` – run ESLint

## License

Private/internal project.
