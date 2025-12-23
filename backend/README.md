# Capstone Hub Backend API

Student Capstone Project Management System - Backend API

## Overview

This is the backend API for Capstone Hub, a comprehensive platform for managing student capstone projects in CS 682. The system serves three user roles:

- **Clients**: Propose and manage project ideas
- **Students**: Browse projects and submit preferences  
- **Instructors**: Approve projects and manage group formation

## Tech Stack

- Node.js + Express
- MySQL Database
- Firebase Authentication
- RESTful API Architecture

## Project Structure
```
backend/
├── src/
│   ├── controllers/    # API endpoint handlers
│   ├── middleware/     # Auth, validation, error handling
│   ├── routes/         # API route definitions
│   ├── utils/          # Helper functions
│   └── config/         # Configuration files
└── docs/              # Generated documentation
```

## API Documentation

For complete API documentation, run:
```bash
npm run docs:generate
npm run docs:view
```

## Team

- Sri Charan 
- Lohith Mudipalli
- Bharath
