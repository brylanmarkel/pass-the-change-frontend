"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CharityCard from "@/components/CharityCard";
import { getCharities, getMatchedCharities, getUser, patchUser } from "@/lib/api";

export default function BrowsePage() {
  const { user } = useUser();
  const { isLoaded, userId, getToken } = useAuth();
  const router = useRouter();
  const [charities, setCharities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [existingIds, setExistingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const clerkId = user?.id;

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace("/sign-in");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!clerkId) return;
    const opts = { getToken };
    Promise.all([
      getCharities(opts),
      getMatchedCharities(clerkId, opts),
      getUser(clerkId, opts),
    ]).then(([allRes, matchedRes, userRes]) => {
      const allList = Array.isArray(allRes) ? allRes : allRes?.charities || allRes?.data || [];
      const matchedList = Array.isArray(matchedRes) ? matchedRes : matchedRes?.charities || matchedRes?.data || [];
      const matchedIds = new Set(matchedList.map((c) => c.id || c._id));
      setCharities(allList);
      setMatchedIds(matchedIds);
      const userIds = new Set(
        (userRes?.matchedCharityIds || userRes?.charities || userRes?.charityIds || []).map((c) =>
          typeof c === "object" ? c.id || c._id : c
        )
      );
      setExistingIds(userIds);
      setSelected(allList.filter((c) => userIds.has(c.id || c._id)));
      setLoading(false);
    }).catch((err) => {
      console.error("Charities fetch error:", err?.status, err?.body ?? err?.message ?? err);
      setCharities([]);
      setLoading(false);
    });
  }, [clerkId, getToken]);

  const toggleCharity = (charity) => {
    const id = charity.id || charity._id;
    setSelected((prev) => {
      const exists = prev.some((c) => (c.id || c._id) === id);
      if (exists) return prev.filter((c) => (c.id || c._id) !== id);
      return [...prev, charity];
    });
  };

  const isSelected = (charity) =>
    selected.some((c) => (c.id || c._id) === (charity.id || charity._id));

  const handleSave = async () => {
    if (!clerkId) return;
    setSaving(true);
    try {
      await patchUser(clerkId, {
        charityIds: selected.map((c) => c.id || c._id),
      }, { getToken });
      router.back();
    } catch (err) {
      console.error("Save charities error:", err);
      setSaving(false);
    }
  };

  if (!isLoaded || !clerkId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
        <p className="text-[#9C8B7E]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-[#FBF7F2] border-b border-[#E0D5CB]">
        <Link href="/home" className="text-[#5C4A38] hover:underline">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-[#2E2218]">Add a charity</h1>
        <div className="w-12" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-[#9C8B7E] mb-6">
          Tap to select charities. Your selections will be saved when you tap Save.
        </p>

        {loading ? (
          <p className="text-[#9C8B7E]">Loading charities...</p>
        ) : charities.length === 0 ? (
          <p className="text-[#9C8B7E]">
            No charities found. Check the browser console for API errors.
          </p>
        ) : (
          <div className="space-y-4">
            {charities.map((charity, i) => (
              <CharityCard
                key={charity.id || charity._id || i}
                charity={charity}
                selected={isSelected(charity)}
                onToggle={toggleCharity}
                isTopMatch={matchedIds.has(charity.id || charity._id)}
              />
            ))}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FBF7F2] border-t border-[#E0D5CB]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full max-w-lg mx-auto block py-3 rounded-full bg-[#5C4A38] text-white font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </main>
    </div>
  );
}
