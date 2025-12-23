# Capstone Hub Frontend

Student Capstone Project Management System - React Frontend Application

## Overview

This is the frontend application for Capstone Hub, a comprehensive platform for managing student capstone projects in CS 682. Built with modern React and designed for three user roles:

- **Clients**: Submit and track project proposals
- **Students**: Browse projects, submit preferences, and view assignments
- **Instructors**: Approve projects, manage groups, and oversee progress

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **React Router DOM 7** - Client-side routing
- **Firebase** - Authentication
- **Framer Motion** - Animations
- **React Icons** - Icon library

## Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── shared/         # Shared across roles
│   │   ├── student/        # Student-specific components
│   │   ├── instructor/     # Instructor-specific components
│   │   └── client/         # Client-specific components
│   ├── pages/              # Page-level components
│   │   ├── public/         # Public pages (login, signup, home)
│   │   ├── student/        # Student dashboard pages
│   │   ├── instructor/     # Instructor dashboard pages
│   │   └── client/         # Client dashboard pages
│   ├── utils/              # Helper functions and utilities
│   │   ├── apiHelper.js    # API communication layer
│   │   └── firebase.js     # Firebase configuration
│   ├── hooks/              # Custom React hooks
│   ├── App.jsx             # Main app component with routing
│   └── main.jsx            # Application entry point
└── docs/                   # Generated documentation
    └── jsdoc/
```

## Features by Role

### Student Features
- Browse approved projects with detailed information
- Submit and rank top 3 project preferences
- View assigned project and team members
- Track project progress and deadlines

### Client Features
- Submit detailed project proposals
- Track approval status and instructor feedback
- View assigned student teams
- Manage project details and requirements

### Instructor Features
- Review and approve/reject project proposals
- Run automated group formation algorithm
- Manually adjust student groups
- Post announcements and manage evaluations
- Monitor overall system statistics

## Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Documentation

For complete component-level documentation, run:
```bash
npm run docs:generate
npm run docs:view
```

This will generate and open the JSDoc HTML documentation in your browser.

## Team

- Charan
- Lohith Mudipalli
- Bharath

## Course

CS 682 - Capstone Project
