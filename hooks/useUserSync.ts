"use client";

import { useAuth } from "@/components/FirebaseAuthProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

export function useUserSync() {
  const { user, isLoaded } = useAuth();
  const createUser = useMutation(api.users.getOrCreateUser);
  const linkPlayerToUser = useMutation(api.players.linkPlayerToUser);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasRedirected.current) {
      // Only run redirect logic on specific pages
      const currentPath = window.location.pathname;
      const shouldCheckOnboarding =
        currentPath === "/" ||
        currentPath === "/games" ||
        currentPath === "/profile";

      if (!shouldCheckOnboarding) {
        return;
      }

      // Get invitePlayerId from query params
      const searchParams = new URLSearchParams(window.location.search);
      const invitePlayerId = searchParams.get(
        "invitePlayerId"
      ) as Id<"players"> | null;

      // Wait a bit for Firebase profile to be fully updated
      const timeoutId = setTimeout(() => {
        const userName = user.displayName || user.email || "User";
        console.log(
          "Syncing user with name:",
          userName,
          "displayName:",
          user.displayName
        );

        createUser({
          firebaseId: user.uid,
          name: userName,
          email: user.email || "",
        })
          .then(async (userData) => {
            console.log("User data received:", userData);
            console.log(
              "User onboarding finished:",
              userData?.isOnboardingFinished
            );
            console.log("Current pathname:", window.location.pathname);

            // If there's an invitePlayerId, link the player to this user
            if (invitePlayerId) {
              try {
                await linkPlayerToUser({
                  playerId: invitePlayerId,
                  firebaseId: user.uid,
                });
                console.log("Player linked to user successfully");
                // Remove invitePlayerId from URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("invitePlayerId");
                window.history.replaceState({}, "", newUrl.toString());
              } catch (error) {
                console.error("Error linking player to user:", error);
              }
            }

            // Check if user needs onboarding
            if (!userData || !userData.isOnboardingFinished) {
              console.log("User needs onboarding, redirecting to /onboarding");
              hasRedirected.current = true;
              router.push("/onboarding");
            } else if (currentPath === "/") {
              // User completed onboarding, redirect to games from home page
              console.log("User completed onboarding, redirecting to /games");
              hasRedirected.current = true;
              router.push("/games");
            }
          })
          .catch((error) => {
            console.error("Error syncing Firebase user:", error);
          });
      }, 200); // Slightly longer delay to ensure profile is updated

      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user, createUser, linkPlayerToUser, router]);
}
