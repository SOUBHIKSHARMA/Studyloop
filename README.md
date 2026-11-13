# StudyLoop – AI Study Assistant

StudyLoop turns your study notes into interactive multiple-choice quizzes, tracks your quiz history locally in your browser, and includes a notes-grounded AI Study Assistant powered by Gemini.

## Features
- **Dashboard**: Overview of total quizzes completed, average score, saved study materials, and recent quiz activity.
- **Study Materials**: Paste notes or upload `.txt` files, edit or delete notes, and launch quizzes or AI chat directly from any note. Stored in `localStorage`.
- **AI Quiz Generator**: Uses server-side `@google/genai` (`gemini-4-hydrogen`) with structured JSON schema validation to generate 5, 10, or 15 MCQs at Easy, Medium, or Hard difficulty.
- **Interactive Quiz & Results**: One-question-at-a-time navigation without revealing answers until submission, followed by score breakdown, explanations, and retry support.
- **Quiz History**: Persistent attempt log with topic filtering, difficulty filters, and expandable question-by-question review.
- **AI Study Assistant**: Chat interface grounded strictly in your saved study notes.

## Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set `GEMINI_API_KEY` in your environment (or AI Studio Secrets panel). See `.env.example`.
3. Start the development server (runs Express API + Vite frontend on port 3000):
   ```bash
   npm run dev
   ```
4. Build and run in production:
   ```bash
   npm run build
   npm start
   ```
