"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { patchUser, getCharityCauses } from "@/lib/api";

export default function SettingsPanel({ open, onClose, userData, clerkId, onUserUpdate, getToken }) {
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [causesList, setCausesList] = useState([]);
  const [answerValues, setAnswerValues] = useState({
    causes: [],
    cityAnswer: "",
    nonprofitAnswer: "",
    mentorshipAnswer: "",
  });

  useEffect(() => {
    if (!open || !getToken) return;
    getCharityCauses({ getToken })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.causes || data?.data || [];
        setCausesList(list);
      })
      .catch((err) => {
        console.error("Causes fetch error:", err?.status, err?.body ?? err?.message ?? err);
      });
  }, [open, getToken]);

  useEffect(() => {
    if (userData?.onboardingAnswers) {
      const raw = userData.onboardingAnswers.causes ?? userData.onboardingAnswers.cause;
      const causes = Array.isArray(raw) ? raw : raw ? [raw] : [];
      setAnswerValues({
        causes,
        cityAnswer: userData.onboardingAnswers.cityAnswer ?? "",
        nonprofitAnswer: userData.onboardingAnswers.nonprofitAnswer ?? "",
        mentorshipAnswer: userData.onboardingAnswers.mentorshipAnswer ?? "",
      });
    }
  }, [userData]);

  const answers = [
    { key: "causes", label: "What cause matters most?", value: answerValues.causes.join(", ") || "—" },
    { key: "cityAnswer", label: "What's broken in your city?", value: answerValues.cityAnswer },
    { key: "nonprofitAnswer", label: "If you ran a nonprofit?", value: answerValues.nonprofitAnswer },
    { key: "mentorshipAnswer", label: "What you wish someone taught you?", value: answerValues.mentorshipAnswer },
  ];

  const charities = userData?.charities || [];
  const bankName = userData?.bankName || "Not connected";
  const payFrequency = userData?.payFrequency || "Every 2 weeks";
  const nextPayDate = userData?.nextPayDate || "";

  const handleSaveAnswer = async (key) => {
    if (!clerkId) return;
    try {
      const value = key === "causes" ? answerValues.causes : answerValues[key];
      const updated = { ...userData?.onboardingAnswers, [key]: value };
      await patchUser(clerkId, { onboardingAnswers: updated }, { getToken });
      onUserUpdate?.({ ...userData, onboardingAnswers: updated });
      setEditingAnswer(null);
    } catch (err) {
      console.error("Save answer error:", err);
    }
  };

  const handleRemoveCharity = async (charityId) => {
    if (!clerkId) return;
    const updated = charities.filter((c) => (c.id || c._id) !== charityId);
    try {
      await patchUser(clerkId, { charityIds: updated.map((c) => c.id || c._id) }, { getToken });
      onUserUpdate?.({ ...userData, charities: updated });
    } catch (err) {
      console.error("Remove charity error:", err);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#FBF7F2] z-50 shadow-xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 flex justify-end p-4 bg-[#FBF7F2] border-b border-[#E0D5CB]">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-[#E0D5CB] flex items-center justify-center hover:bg-[#FFF8F2]"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-[#5C4A38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-8">
          <h2 className="text-xl font-semibold text-[#2E2218]">Settings</h2>

          <section>
            <h3 className="font-medium text-[#5C4A38] mb-3">Your answers</h3>
            <div className="space-y-3">
              {answers.map(({ key, label, value }) => (
                <div key={key} className="rounded-lg border border-[#E0D5CB] bg-[#FFF8F2] p-3">
                  <p className="text-sm text-[#9C8B7E]">{label}</p>
                  {editingAnswer === key ? (
                    <div className="mt-2">
                      {key === "causes" ? (
                        <div className="flex flex-wrap gap-2">
                          {causesList.length === 0 ? (
                            <p className="text-sm text-[#9C8B7E]">Loading causes...</p>
                          ) : (
                            causesList.map((c) => {
                            const selected = answerValues.causes.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setAnswerValues((prev) => ({
                                    ...prev,
                                    causes: selected
                                      ? prev.causes.filter((x) => x !== c)
                                      : [...prev.causes, c],
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  selected
                                    ? "bg-[#5C4A38] text-white"
                                    : "bg-[#FFF8F2] border border-[#E0D5CB] text-[#5C4A38]"
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
                          value={answerValues[key] ?? ""}
                          onChange={(e) => setAnswerValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-2 rounded border border-[#E0D5CB] text-[#2E2218] text-sm"
                          rows={3}
                        />
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleSaveAnswer(key)}
                          className="text-sm px-3 py-1 rounded bg-[#5C4A38] text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAnswer(null)}
                          className="text-sm px-3 py-1 text-[#9C8B7E]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[#2E2218]">{value || "—"}</p>
                  )}
                  {editingAnswer !== key && (
                    <button
                      type="button"
                      onClick={() => setEditingAnswer(key)}
                      className="mt-2 text-sm text-[#5C4A38] hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-medium text-[#5C4A38] mb-3">Your charities</h3>
            <ul className="space-y-2">
              {charities.map((c, i) => (
                <li
                  key={c.id || c._id || i}
                  className="flex items-center justify-between py-2 border-b border-[#E0D5CB]"
                >
                  <span className="text-[#2E2218]">{c.name || "Charity"}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCharity(c.id || c._id)}
                    className="text-sm text-[#9C8B7E] hover:text-[#5C4A38]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <Link
              href="/browse"
              className="mt-3 inline-block px-4 py-2 rounded-full border border-[#E0D5CB] text-[#5C4A38] text-sm hover:bg-[#FFF8F2]"
            >
              Add a charity
            </Link>
          </section>

          <section>
            <h3 className="font-medium text-[#5C4A38] mb-3">Bank account</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-[#2E2218]">{bankName}</p>
                <p className="text-sm text-[#9C8B7E]">Read-only</p>
              </div>
              <button
                type="button"
                className="text-sm text-[#5C4A38] hover:underline"
              >
                Change
              </button>
            </div>
          </section>

          <section>
            <h3 className="font-medium text-[#5C4A38] mb-3">Donation schedule</h3>
            <div className="flex items-center justify-between py-2">
              <p className="text-[#2E2218]">
                {payFrequency}
                {nextPayDate && ` · Next: ${new Date(nextPayDate).toLocaleDateString()}`}
              </p>
              <button type="button" className="text-sm text-[#5C4A38] hover:underline">
                Edit
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
