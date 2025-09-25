export const getMyConversations = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations/my`, {
    method: "GET",
    credentials: "include", // send cookies if using cookie auth
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return res.json();
};
