"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoaded) return;

    if (!userId) {
      router.replace("/sign-in");
      return;
    }

    // Wait for user to load so we can check onboardingComplete
    if (!userLoaded) return;

    const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true;
    if (onboardingComplete) {
      router.replace("/home");
    } else {
      router.replace("/onboarding");
    }
  }, [authLoaded, userLoaded, userId, user?.unsafeMetadata?.onboardingComplete, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
      <p className="text-[#9C8B7E]">Loading...</p>
    </div>
  );
}
