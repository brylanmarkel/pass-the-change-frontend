const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchApi(path, options = {}) {
  const { getToken, ...fetchOptions } = options;
  const token = getToken ? await getToken().catch(() => null) : null;
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    },
  });
  if (!res.ok) {
    const bodyText = await res.text();
    const err = new Error(`API error ${res.status}: ${res.statusText}`);
    err.status = res.status;
    err.body = bodyText;
    console.error(`[API] ${fetchOptions.method || "GET"} ${path} failed:`, res.status, bodyText);
    throw err;
  }
  return res.json();
}

export async function postUsersOnboarding(
  { clerkId, name, email, onboardingAnswers, causes },
  { getToken } = {}
) {
  return fetchApi("/users/onboarding", {
    method: "POST",
    body: JSON.stringify({
      clerkId,
      name,
      email,
      onboardingAnswers,
      causes,
    }),
    getToken,
  });
}

export async function getCharities({ getToken } = {}) {
  return fetchApi("/charities", { getToken });
}

export async function getCharityCauses({ getToken } = {}) {
  return fetchApi("/charities/causes", { getToken });
}

export async function getMatchedCharities(userId, { getToken } = {}) {
  console.log("[Charity Match] Requesting matched charities for userId:", userId);
  try {
    const data = await fetchApi(`/charities/match/${userId}`, { getToken });
    console.log("[Charity Match] Response:", data?.length ?? data?.charities?.length ?? 0, "charities", data);
    return data;
  } catch (err) {
    console.error("[Charity Match] Error:", err?.status, err?.body ?? err?.message);
    throw err;
  }
}

export async function getPlaidLinkToken({ getToken } = {}) {
  return fetchApi("/plaid/link-token", { getToken });
}

export async function postPlaidExchangeToken(publicToken, { getToken } = {}) {
  return fetchApi("/plaid/exchange-token", {
    method: "POST",
    body: JSON.stringify({ public_token: publicToken }),
    getToken,
  });
}

export async function getPlaidTransactions(userId, { getToken } = {}) {
  return fetchApi(`/plaid/transactions?userId=${encodeURIComponent(userId)}`, { getToken });
}

export async function postDonation(userId, charityId, amount, { getToken } = {}) {
  return fetchApi("/donations", {
    method: "POST",
    body: JSON.stringify({ userId, charityId, amount }),
    getToken,
  });
}

export async function getDonations(userId, { getToken } = {}) {
  return fetchApi(`/donations/${userId}`, { getToken });
}

export async function getImpactChicago({ getToken } = {}) {
  return fetchApi("/impact/chicago", { getToken });
}

export async function getUser(userId, { getToken } = {}) {
  return fetchApi(`/users/${userId}`, { getToken });
}

export async function patchUser(userId, updates, { getToken } = {}) {
  return fetchApi(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
    getToken,
  });
}
