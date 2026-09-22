# 📚 GATE Civil Engineering Mock Test & Practice Platform

A full-featured, client-side preparation platform for GATE Civil Engineering (CE) aspirants. Practice official previous years' papers (2015–2025), solve topic-wise custom question sets, simulate the authentic exam environment with an integrated virtual calculator and palette, and monitor your preparation with a comprehensive progress and topic mastery dashboard.

---

## 🚀 Quick Start (Running Locally with Persistent Storage)

The platform comes with a zero-dependency server that automatically persists your test scores, practice sessions, question-by-question verdicts, and profile data directly into a local file (**`userData.json`**).

### Option 1: Node.js (Recommended)
No external npm dependencies required:
```bash
# Clone the repository (if you haven't already)
git clone https://github.com/Predator-7/gate-mock.git
cd gate-mock

# Start the local server with automatic disk persistence
npm start
# or: node server.js
```
Open your browser and navigate to: **`http://localhost:8080`**

### Option 2: Python 3
Python's built-in standard library server is also included:
```bash
python3 server.py
```
Open your browser and navigate to: **`http://localhost:8080`**

---

## 🌐 Deploying to GitHub Pages (Free Cloud Hosting)

Because this platform is built with 100% pure client-side web technologies (HTML5, CSS3, Vanilla JavaScript), it can be deployed directly to **GitHub Pages** with zero setup or build steps:

1. Go to your repository on GitHub: [https://github.com/Predator-7/gate-mock](https://github.com/Predator-7/gate-mock)
2. Click on the **Settings** tab at the top.
3. In the left sidebar, select **Pages** (under *Code and automation*).
4. Under **Build and deployment**:
   - **Source**: Choose `Deploy from a branch`
   - **Branch**: Choose `main` and folder `/ (root)`
   - Click **Save**.
5. After 1–2 minutes, your live site will be active at:
   **`https://predator-7.github.io/gate-mock/`**

> [!TIP]
> **How Progress Works on GitHub Pages**: All test scores, practice sessions, and topic mastery are saved locally in your browser's persistent `localStorage`. You can click **Backup / Export JSON** on the Profile page anytime to download a backup file or transfer your data across different devices or browsers.

---

## 💾 How User Data is Saved (File Persistence)

- **Physical File Storage (`userData.json`)**: Whenever you submit a mock test, complete a practice session, or update your name, the app automatically writes your updated records directly to `userData.json` on your computer.
- **Two-Way Sync**: When you open any page, the app automatically reads from `userData.json` to load your progress.
- **Browser Fallback**: If the server is ever closed, browser `localStorage` acts as an automatic fallback so your progress is never lost.
- **Git Protection**: `userData.json` is listed in `.gitignore` so your personal scores and answers are kept strictly private on your computer and never committed to GitHub. A template `userData.example.json` is provided.

### 2. Taking a Full-Length Mock Test
1. From the **Mock Tests** home page ([`index.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/index.html)), select any year paper (e.g., *GATE CE 2025 CE1*, *GATE CE 2021*, *GATE CE 2017*).
2. Review the official test pattern, marking scheme (MCQ, MSQ, NAT), and instructions on [`instructions.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/instructions.html).
3. Check the acknowledgment box and click **"Start Test →"**.
4. Inside the exam interface ([`exam.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/exam.html)):
   - **Exam Timer**: 180-minute countdown with warning alerts.
   - **Virtual Calculator**: Click the calculator icon at the top to access the built-in scientific calculator modeled after the official GATE interface.
   - **Question Palette**: Live status for Answered, Unanswered, Marked for Review, and Not Visited.
   - **Multiple Question Types**: Full support for Multiple Choice (MCQ), Multiple Select (MSQ), and Numerical Answer (NAT).
   - **Resume Capability**: If your session is interrupted, your in-progress attempt is auto-saved so you can resume where you left off.
5. Click **"Submit Paper"** to finalize.

### 3. Reviewing Your Test Results
- Once submitted, you are directed to [`result.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/result.html).
- View your **Total Score out of 100**, count of correct/wrong/skipped questions, and negative marks penalty.
- Inspect the **Section-wise Breakdown** (General Aptitude vs. Core Civil Engineering).
- Browse the **Answer Key Review** with detailed question-by-question verdicts, correct answers, accepted numerical ranges, and official question image diagrams.
- Click **"View Progress & Profile"** to see your updated overall performance.

### 4. Practicing Topic-Wise
1. Click **⚡ Practice** in the top navigation bar to go to [`practice.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/practice.html).
2. **Choose Topics**: Pick one or more topics (e.g., *Geotechnical Engineering*, *Structural Analysis*, *Environmental Engineering*).
3. **Choose Years**: Filter by specific paper years or practice across all years.
4. Set your desired question count and click **"Start Practice →"**.
5. Practice at your own pace with instant feedback and topic breakdown recorded upon completion.

### 5. Tracking Progress on the Profile Dashboard
- Click **Progress** in the navigation bar or visit [`profile.html`](file:///Users/anshgarewal/Desktop/GATE-MOck/profile.html):
  - **Overall KPIs**: Combined accuracy percentage, total mock tests submitted (with average and personal best scores), practice questions solved, and topics covered.
  - **Topic-wise Syllabus Mastery Matrix**: Visual accuracy bars for all 15 CE syllabus topics with status filters (*All*, *Strong ≥75%*, *Needs Work <45%*, *Untested*) and direct `⚡ Practice Topic →` shortcuts.
  - **Attempt History**: Tabbed history of all mock exams taken (with direct links back to test analysis) and practice sessions.
  - **Data Management**:
    - **Backup / Export JSON**: Download a `.json` backup file of your entire attempt history and mastery metrics.
    - **Reset Progress**: Clear local history if you want to start fresh.

---

## 🏗️ Supported Civil Engineering Topics (15 Categories)

The platform classifies and tracks questions across the complete GATE Civil Engineering syllabus:

| Icon | Topic Name | Subjects Covered |
| :---: | :--- | :--- |
| 🧠 | **General Aptitude** | Verbal Ability, Numerical Ability, Reasoning |
| 📐 | **Engineering Mathematics** | Linear Algebra, Calculus, Differential Equations, Probability & Statistics, Numerical Methods |
| 🏗️ | **Structural Analysis** | Trusses, Frames, Influence Lines, Indeterminacy, Moment Distribution |
| 🔩 | **Solid Mechanics & Design** | Stress & Strain, Mohr's Circle, Bending & Shear Stress, Torsion, Buckling |
| 🧱 | **Concrete Structures (RCC)** | Limit State Design, Beams, Slabs, Columns, Footings, Prestressed Concrete |
| ⚙️ | **Steel Structures** | Connections, Tension/Compression Members, Plate Girders, Plastic Analysis |
| 🏛️ | **Construction & Management** | CPM/PERT, Project Estimation, Quality Control, Construction Equipment |
| 🌍 | **Geotechnical Engineering** | Soil Mechanics, Effective Stress, Consolidation, Shear Strength, Earth Pressure, Foundations |
| 💧 | **Fluid Mechanics** | Fluid Statics, Kinematics, Continuity, Bernoulli's, Boundary Layer, Flow Measurements |
| 🌊 | **Hydraulics & Open Channel** | Specific Energy, Hydraulic Jumps, Gradually Varied Flow, Turbines & Pumps |
| 🌧️ | **Hydrology** | Precipitation, Infiltration, Hydrographs, Flood Routing, Well Hydraulics |
| 🚿 | **Irrigation Engineering** | Water Requirements of Crops, Canals, Dams, Spillways, Gravity Dam Design |
| 🌿 | **Environmental Engineering** | Water Quality, Water & Wastewater Treatment, Air Pollution, Solid Waste |
| 🛣️ | **Transportation Engineering** | Highway Geometric Design, Traffic Engineering, Pavement Design, Airport/Railway |
| 📏 | **Surveying & Geomatics** | Levelling, Traversing, Compass, Curves, Theodolite, GPS & Photogrammetry |

---

## 📁 Repository Structure

```
GATE-MOck/
├── index.html               # Home page listing available mock papers & hero greeting
├── instructions.html        # Pre-exam instructions, rules, and marking pattern
├── exam.html                # Real exam testing interface with timer, palette & calculator
├── result.html              # Post-exam scorecard, section breakdown & answer key review
├── practice.html            # Topic & year selector for custom practice sets
├── practice-exam.html       # Practice test session interface
├── profile.html             # Profile & Progress dashboard with topic mastery matrix
├── css/
│   ├── base.css             # Design system variables, typography & layout resets
│   ├── index.css            # Home page paper grid styling
│   ├── instructions.css     # Instructions card styling
│   ├── exam.css             # Authentic exam layout, question display & palette
│   ├── result.css           # Scorecard & review styles
│   ├── practice.css         # Topic cards & practice mode UI
│   ├── profile.css          # Profile hero, KPI cards, topic mastery & history tabs
│   └── calculator.css       # Virtual scientific calculator theme
├── js/
│   ├── config.js            # Global configuration
│   ├── manifest.js          # Registry of supported papers, duration & labels
│   ├── utils.js             # Utility functions & DOM helpers
│   ├── storage.js           # GateStorage engine for test attempts & saved states
│   ├── profile.js           # GateProfile tracking engine, mastery matrix & backup
│   ├── onboarding.js        # Onboarding modal & dynamic navbar avatar pill
│   ├── scoring.js           # Auto-scoring engine for MCQ, MSQ, and NAT questions
│   ├── palette.js           # Question palette state management
│   ├── calculator.js        # Scientific calculator engine
│   ├── question-renderer.js # Dynamic renderer for question statements & choices
│   ├── timer.js             # Exam countdown timer with state persistence
│   ├── state.js             # Exam state machine
│   ├── index-page.js        # Home page controller
│   ├── instructions-page.js # Instructions page controller
│   ├── exam-page.js         # Exam interface controller
│   ├── result-page.js       # Scorecard & answer key review controller
│   ├── practice.js          # Practice question selector & generator
│   ├── practice-page.js     # Practice mode configuration controller
│   ├── practice-exam-page.js# Practice exam session controller
│   └── profile-page.js      # Profile dashboard controller
├── data/
│   ├── topics.js            # Topic taxonomy definitions & keyword classification
│   ├── 2015.js              # Full question bank for GATE CE 2015
│   ├── 2017_ce1.js          # Full question bank for GATE CE 2017 Shift 1
│   ├── 2017_ce2.js          # Full question bank for GATE CE 2017 Shift 2
│   ├── 2018_ce1.js, 2018_ce2.js, ... # Papers from 2018 to 2025
├── assets/
│   └── images/              # Question diagrams, tables, and option images
└── tools/
    ├── verify_profile.js    # 15-point verification suite for storage & mastery engine
    ├── verify_pages.js      # Integrity check for asset links, scripts & styles
    └── verify_2017.js       # Data validation suite for paper questions
```

---

## 🧪 Verification & Testing

To run the automated integrity and test verification suites:

```bash
# Run all test suites
npm test

# Verify local server and userData.json file persistence
node tools/verify_server.js

# Verify profile, scoring, mastery calculation and data backup/restore
node tools/verify_profile.js

# Verify all HTML pages, script load order and asset references
node tools/verify_pages.js

# Verify question data files and image references
node tools/verify_2017.js
```

---

## 📄 License
This project is open-source and intended for educational and preparation purposes for students appearing in the Graduate Aptitude Test in Engineering (GATE).
