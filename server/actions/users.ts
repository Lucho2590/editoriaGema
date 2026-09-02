"use server";

import { adminAuth, adminDb, isAdminReady } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";
import { AdminInvitationEmail } from "@/components/email/AdminInvitation";
import { FieldValue } from "firebase-admin/firestore";
import { assertAdmin } from "@/lib/auth/session";

export interface CreateAdminInput {
  email: string;
  displayName?: string;
}

export interface CreateAdminResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Create a new admin user
 * - Creates Firebase Auth user
 * - Creates Firestore user document with isAdmin: true
 * - Sends invitation email with password reset link
 */
export async function createAdminUser(
  input: CreateAdminInput,
): Promise<CreateAdminResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!isAdminReady || !adminAuth || !adminDb) {
    return {
      success: false,
      error:
        "Firebase Admin SDK no está configurado. Contacta al administrador del sistema.",
    };
  }

  const { email, displayName } = input;

  // Validate email
  if (!email || !email.includes("@")) {
    return {
      success: false,
      error: "Email inválido",
    };
  }

  try {
    // Check if user already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: "Ya existe un usuario con este email",
        };
      }
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create Firebase Auth user with a random temporary password
    const tempPassword = generateTempPassword();
    const userRecord = await adminAuth.createUser({
      email,
      displayName: displayName || undefined,
      password: tempPassword,
      emailVerified: false,
    });

    // Create Firestore user document with isAdmin: true
    const userDoc = {
      id: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || null,
      photoURL: null,
      isAdmin: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userDoc);

    // Generate password reset link
    const resetPasswordLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login`,
    });

    // Send invitation email
    const emailResult = await sendEmail({
      to: email,
      subject: "Invitación al panel de administración - GEMA",
      react: AdminInvitationEmail({
        email,
        displayName,
        resetPasswordLink,
      }),
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // User was created but email failed - we should still return success
      // but log the error
    }

    return {
      success: true,
      userId: userRecord.uid,
    };
  } catch (error: any) {
    console.error("Error creating admin user:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        error: "Ya existe un usuario con este email",
      };
    }

    if (error.code === "auth/invalid-email") {
      return {
        success: false,
        error: "El email ingresado no es válido",
      };
    }

    return {
      success: false,
      error: error.message || "Error al crear el usuario",
    };
  }
}

/**
 * Get all admin users
 */
export async function getAdminUsers() {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error, users: [] };

  if (!isAdminReady || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin SDK no está configurado",
      users: [],
    };
  }

  try {
    const snapshot = await adminDb
      .collection("users")
      .where("isAdmin", "==", true)
      .orderBy("createdAt", "desc")
      .get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        isAdmin: data.isAdmin,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return { success: true, users };
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return { success: false, error: error.message, users: [] };
  }
}

/**
 * Remove admin privileges from a user (doesn't delete the user)
 */
export async function removeAdminPrivilege(userId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!isAdminReady || !adminDb || !adminAuth) {
    return { success: false, error: "Firebase Admin SDK no está configurado" };
  }

  try {
    await adminDb.collection("users").doc(userId).update({
      isAdmin: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Kill their session cookie now instead of letting it coast for its
    // remaining lifetime with admin access.
    await adminAuth.revokeRefreshTokens(userId);

    return { success: true };
  } catch (error: any) {
    console.error("Error removing admin privilege:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Resend invitation email to an existing admin user
 */
export async function resendAdminInvitation(
  email: string,
  displayName?: string,
) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  if (!isAdminReady || !adminAuth) {
    return { success: false, error: "Firebase Admin SDK no está configurado" };
  }

  try {
    // Generate new password reset link
    const resetPasswordLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login`,
    });

    // Send invitation email
    const emailResult = await sendEmail({
      to: email,
      subject: "Invitación al panel de administración - GEMA",
      react: AdminInvitationEmail({
        email,
        displayName,
        resetPasswordLink,
      }),
    });

    return emailResult;
  } catch (error: any) {
    console.error("Error resending invitation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a secure temporary password
 */
function generateTempPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
