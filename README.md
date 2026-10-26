# 🌟 Little Learner — Kids' Olympiad Practice Web App

**Little Learner** is a responsive, joyful, production-ready educational web app designed for children aged 6–12, starting with **CBSE Class 1 English Olympiad**.

Built strictly according to product design principles:
- **No authentication, accounts, backend, or cookies**: 100% private and child-friendly.
- **Instant practice**: Open the app and start immediately on any desktop, tablet, or phone.
- **Client-side session memory**: All test responses, timers, and progress run in browser memory.
- **Authentic activity book design**: Handcrafted flat vector SVG artwork with thick outlines (`#111827`), friendly rounded typography (`Nunito`), and vivid children's book colors (`#087CF7`, `#FFD329`, `#20C86B`, `#FF6656`, `#9256F5`).
- **Authentic CBSE Olympiad Content**: Two complete Class 1 English practice papers (120 questions) with verified answer keys and child-friendly explanations.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or pnpm

### Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Preview
```bash
# Build optimized static bundle
npm run build

# Preview production build locally
npm run preview
```
The output directory is `dist/` — ready for immediate zero-config deployment on **Cloudflare Pages**, **Netlify**, or **Vercel**.

---

## 🎨 Visual Design System

Little Learner adheres to a children's activity book design language:

| Color | Hex | Role |
| :--- | :--- | :--- |
| **Primary Blue** | `#087CF7` | Main brand color, primary actions, highlights |
| **Yellow** | `#FFD329` | Star logo, hero call-to-actions, accents |
| **Green** | `#20C86B` | Correct answers, progress rings, success badges |
| **Coral** | `#FF6656` | Wrong answers, caps, pencils, alerts |
| **Purple** | `#9256F5` | Secondary subjects, reading comprehension |
| **Ink** | `#111827` | Thick outlines, readable headings and high-contrast text |
| **Surface** | `#F8FAFC` | Calm off-white background |

- **Font**: Google Font `Nunito` (400, 600, 700, 800, 900)
- **Icons**: Unified icon set using `@iconify/react` with the `solar:*` collection.
- **Illustrations**: Native inline scalable SVG illustrations matching the reference:
  - `HeroIllustration`: Student in red cap holding giant pencil, school, sun, clouds, and trophy.
  - `ResultCelebrationIllustration`: Student celebrating with arms raised and stars.
  - `TrophyIllustration`: Golden trophy with ribbons.
  - `QuestionIllustration`: Picture clues (cat, apple, sun, pencil, elephant, school, butterfly, fish, clock, car, dog, etc.).

---

## 📖 Question Bank & Adding New Questions

All questions are organized by class and subject in `src/data/questions/`.

### Question Schema
Each question implements the `Question` TypeScript interface (`src/types/index.ts`):

```json
{
  "id": "c1-eng-spl-01",
  "classNumber": 1,
  "subjectId": "english",
  "topicId": "spelling",
  "difficulty": "easy",
  "question": "Look at the picture and choose the correct spelling.",
  "passage": "Optional story passage for reading comprehension",
  "illustration": "cat",
  "options": [
    "cath",
    "cat",
    "catt",
    "kat"
  ],
  "correctAnswer": 1,
  "explanation": "The correct spelling of this furry pet animal is 'cat' (C-A-T)."
}
```

### How to Add New Questions
1. Open `src/data/questions/class1/english.json` (or create a new subject file).
2. Append new questions with a unique `id`, exactly 4 options, and a 0-indexed `correctAnswer` (0 = A, 1 = B, 2 = C, 3 = D).
3. The app automatically calculates all topic counts, mock tests, and progress rings dynamically.

### How to Add a New Subject (e.g., Mathematics for Class 1)
1. Create `src/data/questions/class1/mathematics.json`.
2. In `src/data/questionRepository.ts`, update `SUBJECTS`:
   ```ts
   {
     id: 'mathematics',
     title: 'Mathematics',
     shortDesc: 'Master numbers, shapes, addition, and playful word puzzles.',
     icon: 'solar:calculator-minimalistic-bold',
     badgeColor: 'yellow',
     isAvailable: true, // change from false to true
   }
   ```
3. Import the data and add topics in `src/data/questionRepository.ts`.

---

## 🕹 Features & Accessibility

- **Two Learning Modes**:
  - **Practice Mode**: Untimed, friendly learning mode with instant feedback and child-friendly explanations.
  - **Exam Mode**: Timed mock Olympiad with countdown clock; results and explanations revealed at the end.
- **Separate Practice Papers**: Each imported PDF remains available as its own paper, while Mixed Practice combines every imported set.
- **Keyboard Shortcuts**:
  - `1`, `2`, `3`, `4` or `A`, `B`, `C`, `D` to choose answers.
  - `ArrowLeft` / `ArrowRight` for Previous / Next question.
  - `Esc` to close modal dialogs.
- **Audio Synthesizer**: Optional sound effects using the native browser Web Audio API — zero network downloads, disabled by default.
- **Printable Report**: Native `@media print` styling to print or save the test results summary as a clean PDF certificate.
- **Responsive Breakpoints**: Seamlessly tested and optimized for 320px, 390px, 768px, 1024px, and 1440px.

---

## 🧪 Testing Question Data Integrity

Run the automated question bank validator:
```bash
node test/verifyQuestions.js
```
Validates question uniqueness, option length, index bounds, and explanation completeness.
