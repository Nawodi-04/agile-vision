# 💼 Agile Vision

The **Agile Vision** system is a full-stack web application developed to help small to medium-sized Agile teams manage their sprints, track tasks, and improve real-time collaboration. It supports core Agile practices like sprint planning, Kanban-style task management, and sprint analytics through intuitive UI and backend automation.


## 🚀 Features

- 🗓 **Sprint Management** – Create, update, and track sprints with defined goals and timeframes.
- 📋 **Kanban Task Board** – Drag-and-drop interface for managing tasks between stages (To-Do, In Progress, Done).
- 📊 **Burndown and Velocity Charts** – Visualize sprint performance and team productivity.
- 💬 ** Chat** – Built-in chat system powered by Socket.io for live collaboration.
- 🔐 **User Roles** – Role-based access for Project Manager, and Team Members.


## 🛠️ Technology Stack

### Frontend

- [React.js](https://reactjs.org/)
- React Router DOM
- [Tailwind CSS](https://tailwindcss.com/) for modern UI styling

### Backend

- [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- RESTful API Architecture
- Socket.io for real-time updates

### Database

- [MongoDB](https://www.mongodb.com/) with Mongoose ORM

---

## 🧪 Running the Project Locally

### 1. Clone the repository:

```bash
git clone https://github.com/your-username/agile-vision.git
cd agile-vision
```

### 2. Install dependencies:

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Set up environment variables:

Create a `.env` file in the `server/` directory with:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
```

### 4. Start the development servers:

```bash
# Start backend
cd server
node index.js

# Start frontend (in a new terminal)
cd client
npm start
```

---

## 📊 Research Background

This system is part of a research project titled: **"Analyzing the Impact of Agile Methodologies on Reducing Software Development Time in Small-Scale Projects"**

The tool was created to evaluate how Agile practices—when properly supported by lightweight tools—can help smaller teams improve efficiency, collaboration, and time-to-market.


