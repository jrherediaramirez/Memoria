// src/firebase/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  AuthError,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { AuthFormData } from "../auth/AuthForm"; // We'll create this type

export const signUpUser = async ({ email, password }: AuthFormData): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    // Handle specific errors if needed, e.g., email-already-in-use
    console.error("Sign up error:", error);
    throw error as AuthError;
  }
};

export const signInUser = async ({ email, password }: AuthFormData): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Sign in error:", error);
    throw error as AuthError;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error as AuthError;
  }
};