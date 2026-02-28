# AI Resume Tailor

## Section 1 — What is this?

AI Resume Tailor is an AI-powered, self-hosted resume tailoring application designed to help you land your next role by perfectly aligning your resume with any job description.

**Key Features:**
- **Parallel Tailoring:** Paste a job description and watch as Gemini tailors 6 resume sections (Experience, Education, Skills, etc.) in parallel.
- **Interactive Editing:** Review and refine the AI's suggestions directly in the UI before finalizing.
- **Export Options:** Once satisfied, export your tailored resume as a professional PDF or generate a matching cover letter.
- **Single-User Model:** This is a self-hosted tool designed for personal use. One instance per person, with no accounts, shared data, or complex database setups required.

## Section 2 — How it works

The application follows a simple, robust data flow:
1. **Source Data:** Your base resume content is defined in `_config.yml` and `_skills.yml` at the repository root.
2. **Server-Side Rendering:** The Next.js server reads these YAML files at render time to display your base resume.
3. **AI Integration:** When you provide a job description, the app sends your base content and the job requirements to the Gemini API.
4. **Tailoring Process:** Gemini processes the sections server-side, ensuring your API key is never exposed to the browser.
5. **Finalisation:** You review the tailored content, make any necessary manual adjustments, and then use the built-in tools to export to PDF or generate a cover letter.

## Section 3 — Prerequisites

| Requirement    | Version                                                           |
| -------------- | ----------------------------------------------------------------- |
| Node.js        | ≥18.18.0 (20 LTS recommended)                                     |
| npm            | Bundled with Node.js                                              |
| Gemini API key | [Get one at Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI API key | (Optional) [Get one at OpenAI](https://platform.openai.com/)      |

## Section 4 — Quick Start

```bash
git clone https://github.com/your-github-username/resume-tailor.git
cd resume-tailor
npm install
cp .env.example .env.local
# Edit .env.local and set your API keys
# NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
npm run dev
```

The application will be available at `http://localhost:3000`.

## Section 5 — `_config.yml` Reference

### Top-level fields

| Field                    | Type             | Description                                                            |
| ------------------------ | ---------------- | ---------------------------------------------------------------------- |
| `repository`             | string           | `your-github-username/resume-tailor`                                   |
| `favicon`                | string           | Path to favicon, e.g. `/favicon.ico`                                   |
| `version`                | integer          | Config schema version — keep as `2`                                    |
| `name`                   | string           | Your full name as it appears on your resume                            |
| `title`                  | string           | Your job title or professional headline                                |
| `email`                  | list of strings  | One or more contact email addresses                                    |
| `website`                | string           | Your personal website URL                                              |
| `darkmode`               | boolean          | `true` to enable dark mode by default                                  |
| `github_username`        | string           | Your GitHub username (used for profile link)                           |
| `linkedin_username`      | string           | Your LinkedIn username slug                                            |
| `gtag`                   | string           | Google Analytics tag ID (e.g. `G-XXXXXXXXXX`). Leave empty to disable. |
| `about_profile_image`    | string           | Path to profile image, e.g. `/images/profile.jpg`                      |
| `about_content`          | multiline string | Markdown bio shown on the about section                                |
| `footer_show_references` | boolean          | Show references section in footer                                      |
| `remote_theme`           | string           | Jekyll remote theme — do not change                                    |
| `sass`                   | block            | Sass config — do not change                                            |
| `plugins`                | list             | Jekyll plugins — do not change                                         |

### Content sections

The `content` array must contain exactly these seven sections **in this order**. Section titles are **case-sensitive** — the AI tailoring code uses exact string matching.

| Title             | Layout      | Item fields                                                       |
| ----------------- | ----------- | ----------------------------------------------------------------- |
| `Experience`      | `list`      | `title`, `sub_title`, `caption`, `description`, `link` (optional) |
| `Education`       | `list`      | `title`, `sub_title`, `caption`, `description`                    |
| `Proof of Skill`  | `text`      | `content` — a raw multiline string (not an array)                 |
| `Certifications`  | `list`      | `title`, `sub_title`, `caption`, `description`                    |
| `Skills`          | `list-pane` | `title`, `set`, `description`                                     |
| `Tools`           | `list-pane` | `title`, `set`, `description`                                     |
| `Broader Context` | `text`      | `content` — a raw multiline string (not an array)                 |

> **Note:** `Proof of Skill` and `Broader Context` use `layout: text`. Their `content` value must be a plain multiline YAML string, not a list — the renderer and AI tailoring code both expect a string for text-layout sections.

## Section 6 — `_skills.yml` Reference

This file uses a two-level nesting structure to define your technical competencies in detail:

```yaml
content:
  - title: Skills
    layout: list-pane
    content:
      - title: Python
        set: Engineering
        description: Backend services and data pipelines
        label: PROG  # 4-character SFIA skill code
        level: 4     # SFIA proficiency level 1–7
```

### Skill entry fields

| Field         | Type    | Description                                                       |
| ------------- | ------- | ----------------------------------------------------------------- |
| `title`       | string  | Skill or technology name                                          |
| `set`         | string  | Category grouping (e.g. Engineering, Architecture, Delivery)      |
| `description` | string  | One-line description of how you use this skill                    |
| `label`       | string  | 4-character SFIA skill code (e.g. `PROG`, `ARCH`). See Section 7. |
| `level`       | integer | SFIA proficiency level 1–7. See Section 7.                        |

## Section 7 — SFIA Framework

[SFIA (Skills Framework for the Information Age)](https://sfia-online.org) is an industry-standard framework for describing technology skills. Each skill has a 4-letter code and is assessed at one of 7 proficiency levels.

### Proficiency levels

| Level | Name                 | Summary                                                   |
| ----- | -------------------- | --------------------------------------------------------- |
| 1     | Follow               | Performs routine tasks under close supervision            |
| 2     | Assist               | Supports others; applies learned techniques               |
| 3     | Apply                | Works independently on straightforward tasks              |
| 4     | Enable               | Influences others; handles complex situations             |
| 5     | Ensure & Advise      | Provides authoritative guidance; accountable for outcomes |
| 6     | Initiate & Influence | Shapes strategy within an organisation                    |
| 7     | Set Strategy         | Defines direction at the highest organisational level     |

**Common SFIA codes:** `PROG` (Programming), `ARCH` (Solution Architecture), `REQM` (Requirements), `TEST` (Testing), `DTAN` (Data Analysis), `ITMG` (IT Management), `SCTY` (Security), `SLEN` (Systems/Software Engineering).

Browse the full catalogue at [sfia-online.org](https://sfia-online.org).

> **SFIA is optional.** If you prefer not to use SFIA codes, you can omit `label` and `level` fields — the app works fine without them.

## Section 8 — Deployment

### A. Vercel (Recommended)

1. Push your repository to GitHub.
2. Import the repository at [vercel.com](https://vercel.com).
3. Add `NEXT_PUBLIC_GEMINI_API_KEY` in **Settings → Environment Variables**.
4. Deploy.

Vercel handles builds automatically. The `output: 'standalone'` setting in `next.config.ts` is ignored by Vercel — this is expected.

### B. Standalone Server

```bash
npm run build

# Copy static assets into the standalone output
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Run the server
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here node .next/standalone/server.js
```

The application runs on port 3000 by default.

**Minimal Dockerfile:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t resume-tailor .
docker run -p 3000:3000 -e NEXT_PUBLIC_GEMINI_API_KEY=your_key_here resume-tailor
```

### C. Google AI Studio

1. Import the repository into Google AI Studio.
2. Add `NEXT_PUBLIC_GEMINI_API_KEY` in the **Secrets** panel.
3. `APP_URL` is auto-injected by the platform — no manual configuration needed.
4. Run the app.

## Section 9 — Customising

1. Edit `_config.yml` with your personal details, employment history, and resume sections.
2. Edit `_skills.yml` with your skills and proficiency levels.
3. Replace `public/images/profile.jpg` with your own profile photo.
4. Restart the development server (`npm run dev`) or redeploy.

The placeholder files use a fictional Jane Smith persona — every field is annotated with inline comments explaining its purpose.

## Section 10 — How AI Tailoring Works

When you submit a job description, the app makes 6 parallel AI API calls — one for each of these sections: summary, experience, skills, education, proof of skill, and certifications. All calls run server-side via API routes at `app/api/tailor/route.ts` and `app/api/cover-letter/route.ts`; your API keys are never exposed to the browser.

### AI Provider Selection
The application supports both Google Gemini and OpenAI. The provider is selected based on the presence of environment variables:
1. **Google Gemini:** Used if `NEXT_PUBLIC_GEMINI_API_KEY` is set. This is the preferred provider.
2. **OpenAI:** Used if `OPENAI_API_KEY` is set and `NEXT_PUBLIC_GEMINI_API_KEY` is missing.

Once tailoring completes, you review and edit each section in the UI, then export to PDF or generate a cover letter from the tailored content.

## Section 11 — Contributing

We welcome contributions! If you'd like to help improve AI Resume Tailor, please follow these steps:

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature or bugfix (`git checkout -b feature/your-feature-name`).
3. **Make your changes** and ensure the code follows the existing style.
4. **Commit your changes** with a descriptive message.
5. **Push to your fork** and **submit a Pull Request**.

Please ensure your code passes linting (`npm run lint`) and builds successfully (`npm run build`) before submitting.

## Section 12 — Customising Styles

### 1. Web Page Styling
The application uses **Tailwind CSS** for styling.
- **Global Styles:** You can modify `app/globals.css` for base styles, fonts, and CSS variables.
- **Component Styles:** Most UI components are located in the `components/` directory. You can adjust their look and feel by modifying the Tailwind classes directly in the TSX files.
- **Theme:** The app supports dark mode, which can be toggled in the UI or set as default in `_config.yml`.

### 2. PDF Export Styling
The PDF export is generated by printing the resume view.
- **Print-Specific Styles:** We use Tailwind's `print:` modifier to apply styles that only appear in the exported PDF.
- **Customizing the Layout:** Edit `components/ResumeView.tsx` to change how the resume looks when printed. Look for classes like `print:text-[11px]`, `print:leading-snug`, and `print:hidden` to control the PDF output.
- **Page Breaks:** The `break-inside-avoid` class is used to prevent sections from being split across pages.
