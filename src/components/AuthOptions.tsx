import "@/css/Navbar.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { IconLogin, IconLogout } from "@tabler/icons-react";

const LOGIN_ALERT_MSG = import.meta.env.PROD
  ? "You can't login from this URL. Try going to dops.hytechracing.org/query-frontend/ instead."
  : "To test login functionality, spinup your own data_acq_cloud server";

// Shape of the payload returned by the backend /auth/me endpoint when a session exists.
type MeResponse = {
  data: {
    username: string;
  };
};

// Reports whether the browser has an active session, as told by /auth/me, and renders
// the matching action: a login button while logged out, a logout button while logged in.
export default function AuthOptions() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const errorMsgShown = useRef(false);

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            credentials: "include",
          },
        );

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

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") != null && !errorMsgShown.current) {
      errorMsgShown.current = true;
      window.alert(
        "You didn't log in with an authorized account. Only team leads need to log in (for file deletion perms).",
      );
    }

    const callback = () => {
      if (document.visibilityState === "visible") {
        loadAuthStatus();
      }
    };
    window.addEventListener("visibilitychange", callback);
    return () => window.removeEventListener("visibilitychange", callback);
  }, []);

  if (isLoading) {
    return null;
  }

  const loggedIn = username !== null;

  return (
    <>
      <span
        className={`authStatus ${loggedIn ? "authStatusLoggedIn" : "authStatusLoggedOut"}`}
      >
        {loggedIn ? `Logged in as ${username}` : "Logged out"}
      </span>
      {loggedIn ? <LogoutButton /> : <LoginButton />}
    </>
  );
}

function LoginButton() {
  const canLogin =
    (import.meta.env.PROD &&
      window.location.href.includes(import.meta.env.VITE_API_URL)) ||
    (import.meta.env.DEV && import.meta.env.VITE_API_URL.includes("localhost"));
  console.log("Can Login: " + canLogin);
  const clickHandleProps = canLogin
    ? { href: `${import.meta.env.VITE_API_URL}/auth/login` }
    : { onClick: () => window.alert(LOGIN_ALERT_MSG) };

  return (
    <Button
      variant="filled"
      component="a"
      {...clickHandleProps}
      leftSection={<IconLogin size="20" />}
    >
      Login
    </Button>
  );
}

function LogoutButton() {
  return (
    <Button
      variant="filled"
      component="a"
      href={`${import.meta.env.VITE_API_URL}/auth/logout`}
      leftSection={<IconLogout size="20" />}
    >
      Logout
    </Button>
  );
}
