import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import firebaseConfig from "./config";

// Check if the config object has all the required values.
const isConfigValid = Object.values(firebaseConfig).every(
    (value) => typeof value === 'string' && value.length > 0
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Connect to the specific 'knowledge-gate' database.
    db = getFirestore(app, 'knowledge-gate');
} else {
    // This message is for developers and will appear in the server/client console.
    console.error("Firebase configuration is invalid. Please ensure all required environment variables are set in your .env file.");
}

export { app, auth, db };
