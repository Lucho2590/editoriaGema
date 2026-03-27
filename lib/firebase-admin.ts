import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

// Check if Firebase Admin credentials are configured
const isAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

function getFirebaseAdmin(): {
  app: App | null;
  adminAuth: Auth | null;
  adminDb: Firestore | null;
  adminStorage: Storage | null;
  isConfigured: boolean;
} {
  if (!isAdminConfigured) {
    console.warn(
      "⚠️  Firebase Admin SDK not configured. Server-side features will be limited.\n" +
      "   To configure, add FIREBASE_ADMIN_* variables to your .env.local file.\n" +
      "   Get them from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key"
    );
    return {
      app: null,
      adminAuth: null,
      adminDb: null,
      adminStorage: null,
      isConfigured: false,
    };
  }

  let app: App;

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    app = getApps()[0];
  }

  return {
    app,
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
    adminStorage: getStorage(app),
    isConfigured: true,
  };
}

const firebaseAdmin = getFirebaseAdmin();

export const adminAuth = firebaseAdmin.adminAuth;
export const adminDb = firebaseAdmin.adminDb;
export const adminStorage = firebaseAdmin.adminStorage;
export const isAdminReady = firebaseAdmin.isConfigured;
export { firebaseAdmin };
