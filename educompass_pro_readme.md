# 🎓 EduCompass Pro

EduCompass Pro is a comprehensive, full-stack college discovery and admission prediction platform designed to help engineering aspirants navigate the complex JoSAA (Joint Seat Allocation Authority) counselling process. 

By leveraging historical cutoff data, students can predict their admission chances, build a strategic preference list, and export their choices for the actual counselling rounds.

## 🚀 Live Demo
* **Frontend:** [Insert your Vercel URL here]
* **Backend API:** [Insert your Render URL here]

## ✨ Key Features
* **🏛️ College Discovery:** Browse and filter engineering institutions across India. Includes advanced sorting by state, distance, and median historical cutoffs.
* **🔮 Admission Predictor:** Enter your expected JEE rank and category to instantly see your probability of admission across various institutes and branches based on sanitized historical JoSAA data.
* **🛒 Preference Dashboard (Choice Cart):** Save target colleges to a personalized dashboard. Run "Mock Allotments" against your list, sort by smart cutoff algorithms, and **export your final preference list as a high-resolution PDF** for counselling day.
* **📅 Live Counselling Timeline:** Track critical JoSAA deadlines, mock seat allocations, and document verification windows in real-time.

## 🛠️ Tech Stack
**Frontend (Deployed on Vercel):**
* React.js
* HTML2Canvas & jsPDF (for dashboard exports)
* CSS / Tailwind (Styling)

**Backend (Deployed on Render):**
* Node.js & Express.js
* RESTful API architecture
* `pg` (Node-Postgres)

**Database (Hosted on Neon DB):**
* PostgreSQL
* **Scale:** Handles thousands of rows of historical JoSAA cutoff data, sanitized and optimized for high-speed median calculations.

## 🗄️ Database Architecture
The application relies on a highly relational PostgreSQL database:
* `institutions`: Master list of all colleges (IITs, NITs, IIITs, GFTIs) with AISHE codes.
* `josaa_cutoffs`: Heavily sanitized historical opening and closing ranks across all categories, rounds, and quotas.
* `users` & `saved_preferences`: Secure relational tables managing individual student choice carts.
* `courses` & `placements_history`: Deep-dive academic and career outcome data.

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/educompass-pro.git
cd educompass-pro
```

### 2. Setup the Backend
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory and add your Neon DB connection string:
```env
DATABASE_URL=your_neon_postgres_connection_string
PORT=10000
```
Start the backend server:
```bash
npm start
```

### 3. Setup the Frontend
Open a new terminal and navigate to the frontend directory:
```bash
cd Frontend
npm install
```
Ensure your `config.js` or `.env` points to `http://localhost:10000` for local development, then start the React app:
```bash
npm run dev
```

## 🐛 Known Issues & Troubleshooting
* **Database Imports:** When updating the `josaa_cutoffs` database via CSV, ensure Preparatory ranks (e.g., "105P") and dashes ("-") are sanitized to pure integers using the provided SQL scripts, otherwise backend median calculations (`percentile_cont`) will fail.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.