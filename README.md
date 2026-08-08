# MERN Todo Pro

A portfolio-level full-stack task management application built with MongoDB, Express, React and Node.js.

## Features

- JWT authentication: register, login, protected routes and logout
- Password hashing with bcrypt
- Dashboard statistics
- Task CRUD
- Priority: Low / Medium / High
- Due dates and overdue detection
- 🔔 Five-minute due-date reminders with browser notification + beep sound
- Categories
- Search
- Status and priority filters
- Dark / light mode
- Responsive dashboard UI
- REST API
- MongoDB Atlas ready
- Render deployment configuration
- Production SPA fallback for Express
- Environment-based API configuration

## Project structure

```text
mern-todo-pro/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
└── package.json
```

## Local setup

Requirements: Node.js 18+ and MongoDB Atlas or local MongoDB.

### 1. Install

From the project root:

```cmd
npm install
npm run install-all
```

### 2. Configure server

```cmd
copy server\.env.example server\.env
```

Set:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Configure client

```cmd
copy client\.env.example client\.env
```

For local development:

```env
VITE_API_URL=/api
```

### 4. Run

```cmd
npm run dev
```

Open http://localhost:5173

## Production deployment

### Backend on Render

Create a Web Service with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```text
NODE_ENV=production
MONGO_URI=your_atlas_uri
JWT_SECRET=your_long_random_secret
CLIENT_URL=https://your-frontend-domain.onrender.com
PORT=10000
```

### Frontend

You can deploy the `client` directory to Render Static Site, Netlify or Vercel.

Build command:

```text
npm install && npm run build
```

Publish directory:

```text
dist
```

Set:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

## Security notes

- Never commit `.env`.
- Use a long random JWT secret in production.
- Restrict your MongoDB Atlas network access appropriately.
- Change the example credentials and URLs before deployment.

## API

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Todos
- GET `/api/todos`
- POST `/api/todos`
- PUT `/api/todos/:id`
- DELETE `/api/todos/:id`
- GET `/api/todos/stats/summary`


## Five-minute reminders

When a task has a due date within the next five minutes, Todo Pro checks the task every 10 seconds and triggers a reminder once for that task.

The reminder includes:
- A visible in-app notification
- A browser notification when permission is enabled
- A short beep sound

Click **🔔 Enable reminders** in the dashboard once after opening the app. This allows the browser to request notification permission and unlocks audio playback where required by the browser.

For reliable reminders, keep the dashboard tab open. Browser and operating-system power-saving settings can prevent JavaScript timers from running while a tab is fully suspended.
