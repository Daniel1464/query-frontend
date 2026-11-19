import { useEffect, useState } from "react";

// Shape of the payload returned by the backend /auth/me endpoint when a session exists.
type MeResponse = {
  data: {
    username: string;
  };
};

export default function useAuthStatus() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: "include",
        });

        // A 401 means there is no active session, so the user is logged out.
        if (!response.ok) {
          setUsername(null);
          return;
        }

        const body: MeResponse = await response.json();
        setUsername(body.data.username ?? null);
      } catch (error) {
        console.error("Failed to load auth status:", error);
        setUsername(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthStatus();

    const callback = () => {
      if (document.visibilityState === "visible") {
        loadAuthStatus();
      }
    };
    window.addEventListener("visibilitychange", callback);
    return () => window.removeEventListener("visibilitychange", callback);
  }, []);

  return { username, isLoading };
}
