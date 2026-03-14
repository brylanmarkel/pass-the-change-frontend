"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SettingsPanel from "@/components/SettingsPanel";
import {
  getDonations,
  getPlaidTransactions,
  getImpactChicago,
  getUser,
  getMatchedCharities,
} from "@/lib/api";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n ?? 0);
}

function formatDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MOCK_IMPACT = {
  totalDonors: 1247,
  totalDonated: 42850,
  orgsSupported: 23,
  avgPerPerson: 34.36,
};

const MOCK_PLAID = {
  lastPaycheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  payFrequency: "2 weeks",
  change: 3.47,
};

const MOCK_CHARITIES = [
  { id: "1", name: "PAWS Chicago", category: "Animal", supporterCount: 312 },
  { id: "2", name: "Heartland Alliance", category: "Housing", supporterCount: 189 },
  { id: "3", name: "Inspiration Corporation", category: "Economic Mobility", supporterCount: 156 },
];

const MOCK_DONATIONS = [
  { id: "1", charityName: "PAWS Chicago", amount: 2.47, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), fromPaycheck: true },
  { id: "2", charityName: "Heartland Alliance", amount: 1.00, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), fromPaycheck: true },
  { id: "3", charityName: "Inspiration Corporation", amount: 1.50, date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(), fromPaycheck: true },
];

export default function HomePage() {
  const { user } = useUser();
  const { isLoaded, userId, getToken } = useAuth();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [donations, setDonations] = useState([]);
  const [plaid, setPlaid] = useState(null);
  const [impact, setImpact] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const clerkId = user?.id;
  const joinedMonth = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long" })
    : "";

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace("/sign-in");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!clerkId) return;
    const opts = { getToken };
    Promise.all([
      getDonations(clerkId, opts).catch(() => []),
      getPlaidTransactions(clerkId, opts).catch(() => null),
      getImpactChicago(opts).catch(() => null),
      getUser(clerkId, opts).catch(() => null),
      getMatchedCharities(clerkId, opts).catch(() => []),
    ]).then(([d, p, i, u, matched]) => {
      setDonations(Array.isArray(d) ? d : d?.donations || []);
      setPlaid(p);
      setImpact(i);
      const matchedList = Array.isArray(matched) ? matched : matched?.charities || [];
      setUserData({ ...u, charities: matchedList });
      setLoading(false);
    });
  }, [clerkId, getToken]);

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const charities = userData?.charities?.length ? userData.charities : MOCK_CHARITIES;
  const displayDonations = donations.length ? donations : MOCK_DONATIONS;
  const displayTotal = totalDonated;
  const displayImpact = impact && (impact.totalDonors > 0 || impact.totalDonated > 0) ? impact : MOCK_IMPACT;
  const displayPlaid = plaid || MOCK_PLAID;

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
        <p className="text-[#9C8B7E]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-[#FBF7F2] border-b border-[#E0D5CB]">
        <h1 className="text-lg font-semibold text-[#2E2218]">Pass the Change</h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full border border-[#E0D5CB] bg-[#FFF8F2] flex items-center justify-center hover:bg-[#E0D5CB] transition-colors"
          aria-label="Settings"
        >
          <svg
            className="w-5 h-5 text-[#5C4A38]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.198 1.04 1.53 2.573a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-1.04 2.198-2.572 1.53a1.724 1.724 0 00-2.573 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.198-1.04-1.53-2.573a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 1.04-2.198 2.573-1.53 1.532.668 2.573 1.065 2.573 1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-[#2E2218]">Your change is working.</h2>
          <p className="text-[#9C8B7E] mt-1">Every paycheck, a little goes a long way.</p>
        </section>

        <section className="rounded-xl border border-[#E0D5CB] bg-[#FFF8F2] p-5">
          <p className="text-sm text-[#9C8B7E]">You&apos;ve donated</p>
          <p className="text-2xl font-semibold text-[#2E2218] mt-1">
            {loading ? "..." : formatCurrency(displayTotal)}
          </p>
          <p className="text-sm text-[#9C8B7E] mt-1">Since {joinedMonth || "you joined"}</p>
        </section>

        <section className="rounded-xl bg-[#2E2218] text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">Next paycheck</p>
            <p className="font-medium">
              {formatDate(displayPlaid.lastPaycheck)} · every {displayPlaid.payFrequency || "2 weeks"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">Change to donate</p>
            <p className="font-semibold text-lg">{formatCurrency(displayPlaid.change)}</p>
          </div>
        </section>

        <section className="rounded-xl bg-[#2E2218] text-white p-5">
          <p className="text-sm text-white/80 uppercase tracking-wider">Chicago is giving</p>
          <h3 className="text-lg font-semibold mt-1">You&apos;re part of something bigger.</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-2xl font-semibold">
                {loading ? "..." : (displayImpact?.totalDonors ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-white/80">People giving</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {loading ? "..." : formatCurrency(displayImpact?.totalDonated)}
              </p>
              <p className="text-sm text-white/80">Donated this year</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {loading ? "..." : (displayImpact?.orgsSupported ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-white/80">Orgs supported</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {loading ? "..." : formatCurrency(displayImpact?.avgPerPerson)}
              </p>
              <p className="text-sm text-white/80">Avg per person</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-[#2E2218] mb-3">Your charities</h3>
          <ul className="space-y-2">
            {charities.map((c, i) => (
                <li
                  key={c.id || c._id || i}
                  className="flex items-center justify-between py-2 border-b border-[#E0D5CB] last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#2E2218]">{c.name || "Charity"}</p>
                    <p className="text-sm text-[#9C8B7E]">
                      {c.category || ""} {c.supporterCount != null && `· 👥 ${c.supporterCount} supporting`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
        </section>

        <section>
          <h3 className="font-semibold text-[#2E2218] mb-3">Recent donations</h3>
          <ul className="space-y-2">
            {displayDonations.slice(0, 10).map((d, i) => (
                <li
                  key={d.id || d._id || i}
                  className="flex items-center justify-between py-2 border-b border-[#E0D5CB] last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#2E2218]">{d.charityName || d.charityId?.name || d.charity?.name || "Charity"}</p>
                    <p className="text-sm text-[#9C8B7E]">
                      {formatDate(d.triggeredAt || d.date)} from paycheck
                    </p>
                  </div>
                  <p className="font-medium text-[#5C4A38]">{formatCurrency(d.amount)}</p>
                </li>
              ))}
            </ul>
        </section>
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userData={userData}
        clerkId={clerkId}
        onUserUpdate={setUserData}
        getToken={getToken}
      />
    </div>
  );
}
