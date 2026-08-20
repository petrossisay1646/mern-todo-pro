# 🚀 MERN Todo Pro — Ultra Productivity Suite

A modern, full-stack Task & Productivity Management application built with the **MERN Stack** (MongoDB, Express, React 19, Node.js) and Vite.

MERN Todo Pro transforms task management with **Multi-View Workspaces (List, Kanban Board, Focus Pomodoro, and Analytics)**, subtasks checklist, custom tags, daily completion streaks, bulk operations, JSON backup import/export, keyboard shortcuts, sound chimes, and automatic local MongoDB development support.

---

## 🌐 Live Deployments

- **Frontend (Vercel)**: https://mern-todo-pro.vercel.app

---

## ✨ Features

### 🎯 Multi-View Productivity
- 📋 **List View**: Rich task catalog with smart sorting (pinned first, due dates first), interactive inline subtasks, tag chips, and search.
- 📊 **Kanban Board**: Drag-and-drop or stage-shift task flow across *To Do*, *In Progress*, and *Completed* columns with stage counters.
- 🍅 **Focus Mode (Pomodoro Timer)**: 25-min focus sessions, 5-min short breaks, 15-min long breaks, audio chimes, and direct task binding with one-click completion.
- 📈 **Analytics & Streaks**: 7-day completion activity bar chart, daily target goal ring, consecutive day streak tracker (🔥), and priority distribution.

### ⚡ Power User Tools
- ☑️ **Subtasks / Checklist**: Break down complex tasks with progress percentage indicators.
- 🏷️ **Tagging System**: Add hashtags (`#feature`, `#urgent`, `#dev`) with one-click filtering.
- 📌 **Pin to Top**: Keep critical tasks pinned above everything else.
- 📦 **Bulk Actions**: Select multiple tasks for batch completion, batch deletion, or mass priority updates.
- 💾 **Data Backup & Restore**: Export all tasks to JSON format and import tasks anytime.
- ⌨️ **Keyboard Navigation**:
  - `N` — New task modal
  - `/` — Focus search
  - `1` — List View
  - `2` — Kanban Board
  - `3` — Pomodoro Focus Mode
  - `4` — Analytics
  - `D` — Toggle Dark/Light mode
  - `Esc` — Close modals & clear selection

### 🔐 Auth, Profile & Settings
- 🛡️ JWT Authentication with bcrypt password hashing
- 🎨 Customizable user avatar color themes
- 🎯 Daily target goal setting & custom Pomodoro duration
- 🔒 Secure password change

### 🔊 Audio & Notifications
- 🔔 5-minute deadline reminder popups with Web Audio sound alerts
- 🎵 Subtle completion chime when completing tasks

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite 7**
- **React Router 7**
- **Axios**
- **Lucide React Icons**
- **Web Audio API**
- **CSS3 Design Tokens & Glassmorphism**

### Backend
- **Node.js** + **Express 5**
- **MongoDB** + **Mongoose 8**
- **MongoDB Memory Server** (instant zero-config local dev fallback)
- **JSON Web Tokens (JWT)**
- **bcryptjs**
- **Helmet, CORS, Morgan**

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/petrossisay1646/mern-todo-pro.git
cd mern-todo-pro
```

### 2. Install dependencies
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Configure environment (Optional)
The backend automatically falls back to an in-memory MongoDB database for development if no `MONGO_URI` is provided!

To connect to your own MongoDB Atlas:
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mern-todo-pro?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

### 4. Run the application
```bash
# Start both client and server concurrently:
npm run dev

# Or start individually:
npm --prefix server run dev
npm --prefix client run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health
---

## 📄 License
MIT License. Built by Petros Sisay.
