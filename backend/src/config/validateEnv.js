/**
 * Environment Variables Validation
 * Checks that all required environment variables are set before the server starts
 * If any are missing, the server crashes immediately with a clear error message
 * 
 * This prevents silent failures where the server starts but doesn't work properly
 * because a required config value is missing
 * 
 * Usage in index.js (FIRST line):
 * import { validateEnvironment } from "./config/validateEnv.js";
 * validateEnvironment();
 */

/**
 * List of all required environment variables
 * Add new variables here as you add features
 */
const REQUIRED_ENV_VARS = {
  // Database Configuration
  DB_HOST: "MySQL database host (e.g., localhost)",
  DB_USER: "MySQL database user (e.g., root)",
  DB_PASSWORD: "MySQL database password",
  DB_NAME: "MySQL database name (e.g., capstone_hub)",

  // JWT Configuration
  JWT_SECRET: "Secret key for signing JWT tokens (use a long random string)",

  // Firebase Configuration
  FIREBASE_PROJECT_ID: "Firebase project ID",
  FIREBASE_PRIVATE_KEY: "Firebase private key (include newlines as \\n)",
  FIREBASE_CLIENT_EMAIL: "Firebase client email",
  FIREBASE_TYPE: "Firebase type (should be 'service_account')",
  FIREBASE_AUTH_URI: "Firebase auth URI",
  FIREBASE_TOKEN_URI: "Firebase token URI",
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: "Firebase auth provider cert URL",
  FIREBASE_CLIENT_X509_CERT_URL: "Firebase client cert URL",
  FIREBASE_PRIVATE_KEY_ID: "Firebase private key ID",
  FIREBASE_CLIENT_ID: "Firebase client ID",

  // Server Configuration
  PORT: "Server port (default: 5050)",
  NODE_ENV: "Node environment (development, production, test)",
};

/**
 * Optional environment variables (have defaults)
 * These don't cause the server to crash if missing
 */
const OPTIONAL_ENV_VARS = {
  FRONTEND_URL: "Frontend URL for CORS (default: http://localhost:3000)",
  LOG_LEVEL: "Logging level (default: info)",
};

/**
 * Validate all required environment variables
 * Throws error and exits if any required variables are missing
 */
export const validateEnvironment = () => {
  console.log("📋 Validating environment variables...\n");

  const missingVars = [];
  const invalidVars = [];

  // Check all required variables
  Object.keys(REQUIRED_ENV_VARS).forEach((varName) => {
    const value = process.env[varName];

    if (!value) {
      missingVars.push({
        name: varName,
        description: REQUIRED_ENV_VARS[varName],
      });
    } else if (typeof value !== "string" || value.trim() === "") {
      invalidVars.push({
        name: varName,
        description: REQUIRED_ENV_VARS[varName],
      });
    }
  });

  // If any required variables are missing, show error and exit
  if (missingVars.length > 0) {
    console.error(
      "\n❌ ERROR: Missing required environment variables:\n"
    );

    missingVars.forEach((v) => {
      console.error(`  • ${v.name}`);
      console.error(`    ${v.description}\n`);
    });

    console.error("\n📝 Please add these variables to your .env file and try again.\n");
    process.exit(1);
  }

  // If any variables are invalid
  if (invalidVars.length > 0) {
    console.error(
      "\n❌ ERROR: Invalid environment variables (empty or whitespace):\n"
    );

    invalidVars.forEach((v) => {
      console.error(`  • ${v.name}`);
      console.error(`    ${v.description}\n`);
    });

    console.error("\n📝 Please provide valid values in your .env file.\n");
    process.exit(1);
  }

  console.log("✅ All required environment variables are set!\n");
};

/**
 * Get environment variable with fallback
 * Safe way to get optional variables with defaults
 * 
 * Usage:
 * const port = getEnv("PORT", "5050");
 * const frontend = getEnv("FRONTEND_URL", "http://localhost:3000");
 */
export const getEnv = (varName, defaultValue = null) => {
  const value = process.env[varName];
  return value || defaultValue;
};

/**
 * Print environment summary (for debugging)
 * Shows which variables are set (doesn't print sensitive values)
 * 
 * Usage:
 * printEnvironmentSummary();
 */
export const printEnvironmentSummary = () => {
  console.log("\n📊 Environment Configuration Summary:");
  console.log("=====================================\n");

  console.log("✅ Required Variables Set:");
  Object.keys(REQUIRED_ENV_VARS).forEach((varName) => {
    const isSet = !!process.env[varName];
    const status = isSet ? "✓" : "✗";
    console.log(`  ${status} ${varName}`);
  });

  console.log("\n📌 Optional Variables:");
  Object.keys(OPTIONAL_ENV_VARS).forEach((varName) => {
    const value = process.env[varName];
    const status = value ? "✓ Set" : "✗ Using default";
    console.log(`  ${status}: ${varName}`);
  });

  console.log("\n🔧 Server Configuration:");
  console.log(`  PORT: ${process.env.PORT || 5050}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`  Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);

  console.log("\n");
};

/**
 * Example .env file generator
 * Prints example of what your .env file should look like
 * 
 * Usage:
 * printExampleEnvFile();
 */
export const printExampleEnvFile = () => {
  console.log("\n📄 Example .env File:\n");
  console.log("================== .env ==================");
  console.log("# Database\n");
  console.log("DB_HOST=localhost");
  console.log("DB_USER=root");
  console.log("DB_PASSWORD=your_password_here");
  console.log("DB_NAME=capstone_hub\n");

  console.log("# JWT\n");
  console.log("JWT_SECRET=your_super_secret_long_random_string_here_minimum_32_characters\n");

  console.log("# Firebase Service Account (from Firebase Console)\n");
  console.log("FIREBASE_TYPE=service_account");
  console.log("FIREBASE_PROJECT_ID=your-firebase-project-id");
  console.log("FIREBASE_PRIVATE_KEY_ID=your_private_key_id");
  console.log("FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n");
  console.log("FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com");
  console.log("FIREBASE_CLIENT_ID=123456789");
  console.log("FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth");
  console.log("FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token");
  console.log("FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs");
  console.log("FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...\n");

  console.log("# Server\n");
  console.log("PORT=5050");
  console.log("NODE_ENV=development");
  console.log("FRONTEND_URL=http://localhost:3000");
  console.log("\n==========================================\n");
};

/**
 * Validate specific required Firebase environment variables
 * Firebase requires all these fields to initialize properly
 */
export const validateFirebaseConfig = () => {
  const firebaseVars = [
    "FIREBASE_TYPE",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_AUTH_URI",
    "FIREBASE_TOKEN_URI",
    "FIREBASE_AUTH_PROVIDER_X509_CERT_URL",
    "FIREBASE_CLIENT_X509_CERT_URL",
  ];

  const missing = firebaseVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("\n❌ ERROR: Missing Firebase configuration variables:");
    missing.forEach((v) => console.error(`  • ${v}`));
    console.error(
      "\nGet these from: Firebase Console > Project Settings > Service Accounts"
    );
    console.error("Generate a new private key and download the JSON file.\n");
    process.exit(1);
  }
};

/**
 * Validate specific required Database environment variables
 */
export const validateDatabaseConfig = () => {
  const dbVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

  const missing = dbVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("\n❌ ERROR: Missing database configuration variables:");
    missing.forEach((v) => console.error(`  • ${v}`));
    console.error("Please set these in your .env file.\n");
    process.exit(1);
  }
};

export default {
  validateEnvironment,
  validateFirebaseConfig,
  validateDatabaseConfig,
  getEnv,
  printEnvironmentSummary,
  printExampleEnvFile,
};