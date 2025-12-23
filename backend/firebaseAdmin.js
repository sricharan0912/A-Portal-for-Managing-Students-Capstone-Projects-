/**
 * @fileoverview Firebase Admin SDK Configuration
 * Initializes Firebase Admin SDK for server-side authentication and user management
 * Handles service account credentials and exports auth instance for use across the application
 * 
 * @requires firebase-admin
 * @requires dotenv
 * 
 * @module firebaseAdmin
 * 
 * @description
 * This module configures the Firebase Admin SDK using service account credentials
 * stored in environment variables. The Admin SDK enables server-side Firebase operations
 * including:
 * - Verifying ID tokens from client apps
 * - Managing user accounts (create, delete, update)
 * - Custom authentication claims
 * - Token generation and validation
 * 
 * Required Environment Variables:
 * - FIREBASE_TYPE: Service account type (usually "service_account")
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_PRIVATE_KEY_ID: Private key identifier
 * - FIREBASE_PRIVATE_KEY: Private key (newlines will be processed)
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_CLIENT_ID: Client ID
 * - FIREBASE_AUTH_URI: Authentication URI
 * - FIREBASE_TOKEN_URI: Token URI
 * - FIREBASE_AUTH_PROVIDER_X509_CERT_URL: Auth provider cert URL
 * - FIREBASE_CLIENT_X509_CERT_URL: Client cert URL
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console
 * 2. Navigate to Project Settings > Service Accounts
 * 3. Click "Generate new private key"
 * 4. Add credentials to .env file
 * 
 * @example
 * // Import auth instance
 * import { auth } from './firebaseAdmin.js';
 * 
 * // Verify an ID token
 * const decodedToken = await auth.verifyIdToken(idToken);
 * const uid = decodedToken.uid;
 * 
 * @example
 * // Create a custom token
 * const customToken = await auth.createCustomToken(uid, additionalClaims);
 * 
 * @example
 * // Get user by email
 * const user = await auth.getUserByEmail(email);
 */

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

/**
 * Firebase Service Account Configuration
 * 
 * @type {Object}
 * @constant
 * 
 * @property {string} type - Service account type identifier
 * @property {string} project_id - Firebase project ID
 * @property {string} private_key_id - Unique identifier for the private key
 * @property {string} private_key - RSA private key (newlines are processed from env)
 * @property {string} client_email - Service account email address
 * @property {string} client_id - OAuth 2.0 client ID
 * @property {string} auth_uri - OAuth 2.0 authorization endpoint
 * @property {string} token_uri - OAuth 2.0 token endpoint
 * @property {string} auth_provider_x509_cert_url - Auth provider certificate URL
 * @property {string} client_x509_cert_url - Client certificate URL
 * 
 * @description
 * Service account credentials object constructed from environment variables.
 * The private_key field requires special handling to convert escaped newlines
 * (\n) into actual newline characters for proper key formatting.
 * 
 * These credentials authenticate the backend server with Firebase services
 * and grant administrative privileges for user management and token verification.
 * 
 * Security Note:
 * Never commit the actual service account key to version control.
 * Always use environment variables and keep .env file in .gitignore.
 */
// Initialize Firebase Admin SDK
// Download your service account key from Firebase Console:
// Project Settings > Service Accounts > Generate new private key
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

/**
 * Initialize Firebase Admin SDK
 * 
 * @description
 * Initializes the Firebase Admin SDK with service account credentials.
 * This must happen before any Firebase Admin operations are performed.
 * The SDK is initialized once at module load time and shared across the app.
 * 
 * @throws {Error} Throws if service account credentials are invalid or missing
 */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Firebase Auth Instance
 * 
 * @type {admin.auth.Auth}
 * @constant
 * 
 * @description
 * Exported Firebase Auth instance for authentication operations.
 * Use this to verify ID tokens, manage users, and handle authentication.
 * 
 * Common operations:
 * - auth.verifyIdToken(token) - Verify and decode ID tokens
 * - auth.getUser(uid) - Get user by UID
 * - auth.getUserByEmail(email) - Get user by email
 * - auth.createUser(properties) - Create new user
 * - auth.deleteUser(uid) - Delete user account
 * - auth.setCustomUserClaims(uid, claims) - Set custom claims
 * - auth.createCustomToken(uid) - Generate custom auth token
 * 
 * @example
 * // Verify token from client
 * import { auth } from './firebaseAdmin.js';
 * 
 * try {
 *   const decodedToken = await auth.verifyIdToken(idToken);
 *   console.log('User ID:', decodedToken.uid);
 *   console.log('Email:', decodedToken.email);
 * } catch (error) {
 *   console.error('Token verification failed:', error);
 * }
 * 
 * @example
 * // Check if user exists
 * try {
 *   const user = await auth.getUserByEmail(email);
 *   console.log('User found:', user.uid);
 * } catch (error) {
 *   if (error.code === 'auth/user-not-found') {
 *     console.log('User does not exist');
 *   }
 * }
 */
export const auth = admin.auth();

console.log("✅ Firebase Admin SDK initialized");

/**
 * Firebase Admin SDK Instance
 * 
 * @type {admin.app.App}
 * @default
 * 
 * @description
 * Default export of the initialized Firebase Admin SDK.
 * Provides access to all Firebase Admin services beyond just auth,
 * such as Firestore, Realtime Database, Cloud Storage, etc.
 * 
 * @example
 * // Import full admin SDK
 * import admin from './firebaseAdmin.js';
 * 
 * // Access Firestore (if using)
 * const db = admin.firestore();
 * 
 * // Access Cloud Storage (if using)
 * const bucket = admin.storage().bucket();
 */
export default admin;