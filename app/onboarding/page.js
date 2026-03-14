"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import CharityCard from "@/components/CharityCard";
import {
  postUsersOnboarding,
  getMatchedCharities,
  getCharityCauses,
  patchUser,
} from "@/lib/api";

const STEPS = [
  {
    question: "What cause matters most to you?",
    subtext: "Pick as many as you like. You can always change this later.",
  },
  {
    question: "What's something broken in your city you wish someone would fix?",
    subtext: "No wrong answers. Just say what's on your mind.",
  },
  {
    question: "If you ran a nonprofit, what would it be for?",
    subtext: "Dream big. What problem would you take on?",
  },
  {
    question: "Growing up, what's one thing you wish someone had taught you?",
    subtext: "This helps us find orgs doing that work for others.",
  },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const { isLoaded, userId, getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [causes, setCauses] = useState([]);
  const [cityAnswer, setCityAnswer] = useState("");
  const [nonprofitAnswer, setNonprofitAnswer] = useState("");
  const [mentorshipAnswer, setMentorshipAnswer] = useState("");
  const [matchedCharities, setMatchedCharities] = useState([]);
  const [selectedCharities, setSelectedCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [causesList, setCausesList] = useState([]);

  const clerkId = user?.id;

  useEffect(() => {
    if (!isLoaded || !getToken) return;
    getCharityCauses({ getToken })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.causes || data?.data || [];
        setCausesList(list);
      })
      .catch((err) => {
        console.error("Causes fetch error:", err?.status, err?.body ?? err?.message ?? err);
      });
  }, [isLoaded, getToken]);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace("/sign-in");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (step === 5 && clerkId) {
      getMatchedCharities(clerkId, { getToken })
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.charities || [];
          setMatchedCharities(list);
        })
        .catch((err) => console.error("Matched charities error:", err));
    }
  }, [step, clerkId, getToken]);

  const completeOnboarding = async () => {
    if (!clerkId || !user) return;
    setLoading(true);
    try {
      if (selectedCharities.length > 0) {
        try {
          await patchUser(
            clerkId,
            { charityIds: selectedCharities.map((c) => c.id || c._id) },
            { getToken }
          );
        } catch (patchErr) {
          console.warn("Could not save charityIds (non-blocking):", patchErr?.status, patchErr?.body);
        }
      }
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, onboardingComplete: true },
      });
      router.push("/home");
    } catch (err) {
      console.error("Onboarding error:", err);
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (step === 4) {
      setLoading(true);
      try {
        const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
        const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
        const payload = {
          clerkId,
          name,
          email,
          onboardingAnswers: {
            cityAnswer,
            nonprofitAnswer,
            mentorshipAnswer,
          },
          causes,
        };
        console.log("[Onboarding] User object:", { id: user?.id, firstName: user?.firstName, lastName: user?.lastName, emailAddresses: user?.emailAddresses });
        console.log("[Onboarding] Request payload:", payload);
        await postUsersOnboarding(payload, { getToken });
        setStep(5);
      } catch (err) {
        console.error("[Onboarding] Save error:", err?.message);
        console.error("[Onboarding] Status:", err?.status);
        console.error("[Onboarding] Response body:", err?.body);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 5) {
      if (selectedCharities.length > 0) {
        setLoading(true);
        try {
          await patchUser(
            clerkId,
            { charityIds: selectedCharities.map((c) => c.id || c._id) },
            { getToken }
          );
        } catch (err) {
          console.error("Save charities error:", err);
        } finally {
          setLoading(false);
        }
      }
      setStep(6);
      return;
    }
    if (step === 6) {
      completeOnboarding();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSkip = () => {
    setStep((s) => s + 1);
  };

  const toggleCharity = (charity) => {
    setSelectedCharities((prev) => {
      const exists = prev.some((c) => (c.id || c._id) === (charity.id || charity._id));
      if (exists) return prev.filter((c) => (c.id || c._id) !== (charity.id || charity._id));
      return [...prev, charity];
    });
  };

  const isSelected = (charity) =>
    selectedCharities.some((c) => (c.id || c._id) === (charity.id || charity._id));

  if (!isLoaded || !clerkId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
        <p className="text-[#9C8B7E]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex flex-col">
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i <= step ? "bg-[#5C4A38]" : "bg-[#E0D5CB]"
            }`}
          />
        ))}
      </div>

      {step <= 4 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full">
          <div className="space-y-6 w-full text-center">
          <h1 className="text-xl font-semibold text-[#2E2218]">
            {STEPS[step - 1].question}
          </h1>
          <p className="text-[#9C8B7E]">{STEPS[step - 1].subtext}</p>
          {step === 1 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {causesList.length === 0 ? (
                <p className="text-[#9C8B7E] text-sm">Loading causes...</p>
              ) : (
                causesList.map((c) => {
                const selected = causes.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setCauses((prev) =>
                        selected ? prev.filter((x) => x !== c) : [...prev, c]
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selected
                        ? "bg-[#5C4A38] text-white"
                        : "bg-[#FFF8F2] border border-[#E0D5CB] text-[#5C4A38] hover:border-[#5C4A38]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })
              )}
            </div>
          ) : (
            <textarea
              value={
                step === 2 ? cityAnswer : step === 3 ? nonprofitAnswer : mentorshipAnswer
              }
              onChange={(e) => {
                if (step === 2) setCityAnswer(e.target.value);
                if (step === 3) setNonprofitAnswer(e.target.value);
                if (step === 4) setMentorshipAnswer(e.target.value);
              }}
              placeholder="Type your answer..."
              className="w-full min-h-32 p-4 rounded-xl border border-[#E0D5CB] bg-[#FFF8F2] text-[#2E2218] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#5C4A38]"
              rows={4}
            />
          )}
          <div className="flex gap-3 pt-4 justify-center">
            {step > 1 && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-3 rounded-full text-[#9C8B7E] hover:text-[#5C4A38]"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={(step === 1 && causes.length === 0) || loading}
              className="px-6 py-3 rounded-full bg-[#5C4A38] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full">
          <div className="space-y-6 w-full">
          <h1 className="text-xl font-semibold text-[#2E2218] text-center">Pick your charities</h1>
          <p className="text-[#9C8B7E] text-center">
            We matched these to your answers. Tap to select. You can add or change these later in
            settings.
          </p>
          <div className="space-y-4">
            {matchedCharities.slice(0, 10).map((charity, i) => (
              <CharityCard
                key={charity.id || charity._id || i}
                charity={charity}
                selected={isSelected(charity)}
                onToggle={toggleCharity}
                isTopMatch={i === 0}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full px-6 py-3 rounded-full bg-[#5C4A38] text-white font-medium"
          >
            Continue
          </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full">
          <div className="space-y-6 w-full text-center">
          <h1 className="text-xl font-semibold text-[#2E2218]">Connect your bank</h1>
          <p className="text-[#9C8B7E]">
            We use this to see when you get paid and calculate your spare change. We never move money
            without telling you.
          </p>
          <div className="rounded-xl border border-[#E0D5CB] bg-[#FFF8F2] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E0D5CB] flex items-center justify-center text-2xl">
                🏦
              </div>
              <div>
                <p className="font-medium text-[#2E2218]">Bank connection</p>
                <p className="text-sm text-[#9C8B7E]">Read-only access</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-[#5C4A38]">🔒 Bank-level security</p>
              <p className="text-[#5C4A38]">👁 Read-only access</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => completeOnboarding()}
              disabled={loading}
              className="w-full px-6 py-3 rounded-full bg-[#5C4A38] text-white font-medium disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect with Plaid"}
            </button>
            <button
              type="button"
              onClick={() => completeOnboarding()}
              disabled={loading}
              className="w-full px-6 py-3 rounded-full border border-[#E0D5CB] text-[#5C4A38] hover:bg-[#FFF8F2] disabled:opacity-50"
            >
              I&apos;ll do this later
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
