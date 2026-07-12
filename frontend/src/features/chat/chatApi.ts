import { getBaseUrl, getToken } from "../../services/api";

export const getMyConversations = async () => {
  const token = await getToken();
  const res = await fetch(`${getBaseUrl()}/chat/my-conversations`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return res.json();
};
