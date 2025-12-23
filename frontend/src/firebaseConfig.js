/**
 * Firebase Configuration and Initialization Module
 * 
 * Configures and initializes Firebase services for the Capstone Hub application.
 * Handles Firebase Authentication setup using environment variables for security.
 * 
 * This module is the central configuration point for all Firebase services used
 * throughout the application, particularly Firebase Authentication for user management.
 * 
 * Environment Variables Required:
 * - VITE_FIREBASE_API_KEY: Firebase API key
 * - VITE_FIREBASE_AUTH_DOMAIN: Firebase authentication domain
 * - VITE_FIREBASE_PROJECT_ID: Firebase project identifier
 * - VITE_FIREBASE_STORAGE_BUCKET: Firebase storage bucket URL
 * - VITE_FIREBASE_MESSAGING_SENDER_ID: Firebase Cloud Messaging sender ID
 * - VITE_FIREBASE_APP_ID: Firebase application ID
 * 
 * @module firebaseConfig
 * @requires firebase/app
 * @requires firebase/auth
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase configuration object
 * 
 * Contains all necessary Firebase project credentials loaded from environment variables.
 * These values are injected at build time by Vite and should never be hardcoded.
 * 
 * @constant {Object} firebaseConfig
 * @property {string} apiKey - Firebase Web API key for client authentication
 * @property {string} authDomain - Authorized domain for Firebase Authentication
 * @property {string} projectId - Unique Firebase project identifier
 * @property {string} storageBucket - Cloud Storage bucket URL
 * @property {string} messagingSenderId - Firebase Cloud Messaging sender ID
 * @property {string} appId - Firebase application ID
 * 
 * @example
 * // Configuration is loaded automatically from .env file:
 * // VITE_FIREBASE_API_KEY=AIza...
 * // VITE_FIREBASE_AUTH_DOMAIN=capstone-hub.firebaseapp.com
 * // etc.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase application
 * 
 * Creates and configures the main Firebase app instance using the provided configuration.
 * This instance is used as the foundation for all Firebase services in the application.
 * 
 * @constant {FirebaseApp} app
 * 
 * @example
 * // The app instance is automatically initialized on import
 * import app from './utils/firebaseConfig';
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Authentication service
 * 
 * Creates the Authentication instance tied to the Firebase app.
 * Used throughout the application for user authentication operations including:
 * - User sign-in and sign-up
 * - Email/password authentication
 * - Token generation and verification
 * - User session management
 * 
 * @constant {Auth} auth
 * 
 * @example
 * // Import in authentication components
 * import { auth } from './utils/firebaseConfig';
 * import { signInWithEmailAndPassword } from 'firebase/auth';
 * 
 * // Sign in a user
 * const userCredential = await signInWithEmailAndPassword(
 *   auth, 
 *   email, 
 *   password
 * );
 * 
 * @example
 * // Get current user
 * import { auth } from './utils/firebaseConfig';
 * const currentUser = auth.currentUser;
 * 
 * @example
 * // Get authentication token
 * const token = await auth.currentUser.getIdToken();
 */
export const auth = getAuth(app);

/**
 * Default export: Firebase app instance
 * 
 * The main Firebase application instance.
 * Import this if you need access to the core Firebase app object.
 * 
 * @default
 * @type {FirebaseApp}
 * 
 * @example
 * import firebaseApp from './utils/firebaseConfig';
 * console.log(firebaseApp.name); // '[DEFAULT]'
 */
export default app;