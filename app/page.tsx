"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import FirebaseAuthButton from "@/components/FirebaseAuthButton";
import { useUserSync } from "@/hooks/useUserSync";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Sync user with Convex when they sign in
  useUserSync();

  // Let useUserSync handle the redirect logic for onboarding

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center w-full max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Eşlikçi</h1>
          <p className="text-gray-600 mb-6">
            Your companion app for table games
          </p>
          {/* White card wrapper for wide screens only */}
          <div className="lg:bg-white lg:rounded-xl lg:shadow-lg lg:p-8 lg:border lg:border-gray-100">
            <FirebaseAuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="text-center">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
