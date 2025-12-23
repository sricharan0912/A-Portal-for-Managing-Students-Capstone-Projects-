# 🎓 Capstone Hub

**A Portal for Managing Students Capstone Projects**

A comprehensive web-based platform designed to streamline capstone project management for software engineering courses. Capstone Hub connects students, instructors, and industry clients in a unified system that automates project proposals, preference submissions, and intelligent group formation.

[![Documentation](https://img.shields.io/badge/docs-live-blue)](https://sricharan0912.github.io/A-Portal-for-Managing-Students-Capstone-Projects-/)


---

## 📋 Table of Contents

- [Features](#-features)
- [Live Documentation](#-live-documentation)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Key Features](#-key-features)
- [Team](#-team)

---

## ✨ Features

### For Students
- 📚 Browse approved project proposals with detailed requirements
- ⭐ Submit ranked project preferences (top 3 choices)
- 👥 View assigned team members and project details
- 📊 Track evaluation schedules and deadlines

### For Instructors
- ✅ Review and approve/reject client project submissions
- 🤖 Automated group formation based on student preferences
- 📈 Monitor student progress and preference submissions
- ⚙️ Configure system settings and deadlines
- 📋 Schedule evaluations for teams

### For Clients
- 📝 Submit project proposals with requirements and deliverables
- 👀 Track approval status with instructor feedback
- 👨‍💻 View assigned student teams with contact information
- ✏️ Edit project details before approval

---

## 📖 Live Documentation

### JSDoc API Documentation (Recommended)
Complete interactive API documentation for both frontend and backend:

🔗 **[View Live Documentation](https://sricharan0912.github.io/A-Portal-for-Managing-Students-Capstone-Projects-/)**

- **Backend API**: REST endpoints, controllers, middleware, database operations
- **Frontend Components**: React components, hooks, utilities
- **Search**: Quick search across all documented functions
- **Examples**: Code snippets and usage patterns

### Additional Documentation
- 📄 [Technical Documentation PDF](./CS682_Project_1_Documentation.pdf)
- 📘 [User Manual PDF](./User_Manual_Project_1.pdf)

---

## 🛠️ Technology Stack

### Frontend
- **React** 19.0.0 - UI component library
- **Vite** 6.0.5 - Build tool and dev server
- **TailwindCSS** 4.0.0 - Utility-first CSS framework
- **React Router** 7.1.1 - Client-side routing
- **Firebase** - Authentication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **Firebase Admin SDK** - Token verification
- **JWT** - Session management

### DevOps & Tools
- **Railway** - Cloud deployment platform
- **Git/GitHub** - Version control
- **JSDoc** - API documentation generation
- **ESLint** - Code quality

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Firebase account
- npm or yarn

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/sricharan0912/A-Portal-for-Managing-Students-Capstone-Projects.git
cd A-Portal-for-Managing-Students-Capstone-Projects
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables in .env:
# DB_HOST=localhost
# DB_USER=your_mysql_user
# DB_PASSWORD=your_mysql_password
# DB_NAME=capstone_hub
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=your_client_email
# FIREBASE_PRIVATE_KEY=your_private_key

# Run database migrations
mysql -u your_user -p capstone_hub < schema.sql

# Start backend server
npm start
```

The backend will run on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables in .env:
# VITE_API_URL=http://localhost:5000
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id

# Start frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 📁 Project Structure

```
capstone-hub/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Authentication, validation
│   │   └── utils/             # Helper functions
│   ├── docs/jsdoc/            # Generated API documentation
│   ├── schema.sql             # Database schema
│   └── package.json
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── Client/            # Client dashboard components
│   │   ├── Instructor/        # Instructor dashboard components
│   │   ├── Student/           # Student dashboard components
│   │   ├── components/        # Shared components
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   ├── docs/jsdoc/            # Generated component documentation
│   └── package.json
│
├── docs/                       # Unified documentation
│   ├── backend/               # Backend JSDoc HTML
│   ├── frontend/              # Frontend JSDoc HTML
│   └── index.html             # Documentation landing page
│
├── deploy-all-docs.sh         # Documentation deployment script
├── CS682_Project_1_Documentation.pdf
├── User_Manual_Project_1.pdf
└── README.md
```

---

## 📚 API Documentation

### Viewing Documentation

#### Option 1: Online (Recommended)
Visit the live documentation: [https://sricharan0912.github.io/A-Portal-for-Managing-Students-Capstone-Projects-/](https://sricharan0912.github.io/A-Portal-for-Managing-Students-Capstone-Projects-/)

#### Option 2: Local
```bash
# Generate documentation
./deploy-all-docs.sh

# Open in browser
open docs/index.html
```

### Main API Endpoints

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/user/verify` - Verify Firebase token

#### Projects (Client/Instructor)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `PUT /api/projects/:id/approval` - Approve/reject project

#### Student Preferences
- `GET /api/preferences/student` - Get student preferences
- `POST /api/preferences` - Submit preferences
- `POST /api/preferences/rank` - Update ranking

#### Group Formation
- `POST /api/groups/generate` - Run auto-assignment algorithm
- `GET /api/groups/:projectId` - Get group for project

---

## 👥 User Roles

### Student
Students can browse approved projects, submit ranked preferences, and view their assigned teams.

**Default Login**: 
- Email: `student@example.com`
- Password: `student123`

### Instructor
Instructors approve projects, run group formation algorithms, and manage course settings.

**Default Login**:
- Email: `instructor@example.com`
- Password: `instructor123`

### Client
External clients submit project proposals and monitor assigned teams.

**Default Login**:
- Email: `client@example.com`
- Password: `client123`

---

## 🎯 Key Features

### Automated Group Formation Algorithm

The system uses a weighted preference scoring algorithm:

1. **Preference Scoring**:
   - 1st choice = 3 points
   - 2nd choice = 2 points
   - 3rd choice = 1 point

2. **Project Prioritization**:
   - Projects sorted by total preference points
   - High-demand projects processed first

3. **Student Assignment**:
   - Students assigned by preference rank
   - Respects maximum team size constraints
   - Prevents duplicate assignments

4. **Statistics Generation**:
   - Percentage receiving 1st/2nd/3rd choice
   - Count of unassigned students

### Role-Based Access Control

- Firebase authentication with JWT tokens
- Middleware enforces role-based permissions
- Protected routes for each user type
- Secure session management

### Responsive Design

- Mobile-first approach with TailwindCSS
- Consistent UI across all dashboards
- Accessible and intuitive interfaces

---

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Generating Documentation
```bash
# Generate both frontend and backend docs
./deploy-all-docs.sh

# Or individually:
cd backend && npm run docs:generate
cd frontend && npm run docs:generate
```

### Database Migrations
```bash
cd backend
mysql -u root -p capstone_hub < schema.sql
```

---

## 🌐 Deployment

The application is deployed on Railway:

- **Frontend**: Auto-deployed from `main` branch
- **Backend**: Auto-deployed from `main` branch
- **Database**: Railway MySQL instance
- **Documentation**: GitHub Pages (`gh-pages` branch)

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

**Backend**:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `PORT` (default: 5000)

**Frontend**:
- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`

---

## 📊 Database Schema

### Key Tables

- **users**: User accounts with role (student/instructor/client)
- **user_profiles**: Extended user information
- **projects**: Project proposals with approval status
- **student_preferences**: Ranked project preferences
- **student_groups**: Formed groups
- **group_members**: Group membership mappings
- **evaluations**: Scheduled evaluations
- **app_settings**: System configuration

View the complete schema in [`backend/schema.sql`](./backend/schema.sql)

---

## 👨‍💻 Team

**CS 682 - Software Engineering Capstone Project**  
**University of Massachusetts Boston**

- **Sri Charan Tadiparthi** - Full Stack Development
- **Lohith Reddy Mudipalli** - Backend & Database
- **Bharath Karumanchi** - Frontend & UI/UX


---


## 📧 Quick Links

For questions or feedback about this project:

- Project Repository: [GitHub](https://github.com/sricharan0912/A-Portal-for-Managing-Students-Capstone-Projects)
- Documentation: [Live Docs](https://sricharan0912.github.io/A-Portal-for-Managing-Students-Capstone-Projects-/)

---

**⭐ If you found this project helpful, please consider giving it a star!**