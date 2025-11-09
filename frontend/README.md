

# 🌱 CareerSpring — Front-End

> **Find Your First Real Job — Minus the Jargon.**  
> Built during a 2-day hackathon by **Team Agents of Flavour @ Prosus AI House**.

CareerSpring is an **agentic AI career assistant** that helps graduates find jobs that *actually fit them* — by understanding their background, skills, and ambitions.  
The app combines **CV parsing**, **semantic job matching**, and **automated insights** to simplify the transition from graduation to the workplace.

This repository contains the **React + Vite front-end**, built on top of the Pulse Robot template.  
It connects to the **AISOHackathon backend** (FastAPI) to display live job recommendations, personalized insights, and CV-based matches.

---

## 🧭 Overview

The front-end provides:
- A clean, responsive UI for job recommendations.
- Seamless integration with backend APIs (`/show_jobs`, `/upload_cv`, etc.).
- Supabase-based authentication and user management.

---

## 🧠 Tech Stack

| Layer | Technology |
|--------|-------------|
| ⚛️ Framework | React + TypeScript |
| ⚡ Bundler | Vite |
| 🎨 UI | Tailwind CSS + Shadcn/UI |
| 🪶 Database/Auth | Supabase |
| 🔗 Backend API | FastAPI (AISOHackathon) |

---

## 📁 Folder Structure


src/
├── components/       # Reusable UI (JobCard, InboxEmailCard, etc.)
├── pages/            # Application views (UploadCV, Dashboard, etc.)
├── integrations/     # Supabase and API clients
├── hooks/            # Custom React hooks (e.g., useToast)
├── App.tsx           # Routing and layout
└── main.tsx          # App entry point

````

---

## ⚙️ Installation & Setup

```bash
# 1️⃣ Clone the repository
git clone https://github.com/christyesmee/pulse-robot-template-80842.git
cd pulse-robot-template-80842

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run the development server
npm run dev
````

Then open **[http://localhost:8081](http://localhost:8081)** in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

> 💡 The `VITE_API_URL` must match the URL where your backend (AISOHackathon) is running.

---

## 🔄 Backend Integration

The front-end fetches job data dynamically from the backend API.

### Example: Fetch Job Recommendations

```ts
const response = await fetch(`${import.meta.env.VITE_API_URL}/show_jobs?user_id=1`);
const data = await response.json();
```

The results are displayed as **JobCard** components:

```tsx
<JobCard
  company={job.Company}
  title={job.JobTitle}
  salary={job.Salary}
  remote={job.Remote}
/>
```

### Example API Workflow

1. User uploads their CV → `POST /upload_cv`
2. Backend extracts structured metadata.
3. Front-end requests job matches → `GET /show_jobs?user_id={id}`
4. Recommendations appear instantly in the dashboard.

---

## 🧱 Build for Production

```bash
npm run build
npm run preview
```

Your app will be ready at **[http://localhost:8081](http://localhost:8081)**.



---

## 🧩 Connected Repositories

| Repo          | Role                                | URL                                                                                      |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| 🖥️ Front-End | User interface & interactions       | [pulse-robot-template-80842](https://github.com/christyesmee/pulse-robot-template-80842) |
| 🧠 Back-End   | AI agent & job recommendation logic | [AISOHackathon](https://github.com/txy2025/AISOHackathon)                                |

---

## 💡 Example Demo Flow

1. **Upload CV** → AI extracts your skills and experience.
2. **Get Recommendations** → The backend finds the best job matches.
3. **Dashboard View** → See new roles appear automatically.
4. **Stay Updated** → CareerSpring keeps matching while you focus on growth.

---

## 🤝 Contributing

Pull requests are welcome!
If you’d like to improve UI components, add new integrations, or help with testing, please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome-ui`)
3. Commit your changes
4. Open a PR 🎉

---

## 🧾 License

MIT License © 2025 [Team Agents of Flavour](https://github.com/christyesmee)

---
💬 Note

CareerSpring was built in just 2 days during a hackathon — so while not every feature is fully connected yet, the foundation is here.
Our next step is to make the entire workflow seamless, from CV upload → AI understanding → job matching → application generation.

Even as an early prototype, the current UI already demonstrates the potential of our agentic AI, which learns who you are and translates confusing job posts into clear, personalized opportunities.

🧠 The technical details of the agentic pipeline — including how the CV parser, embeddings, and job-matching logic interact — are explained in the backend README.
```
