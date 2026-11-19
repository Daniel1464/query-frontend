import "@/css/Navbar.css";
import { useEffect, useRef } from "react";
import { Button } from "@mantine/core";
import { IconLogin, IconLogout } from "@tabler/icons-react";

type AuthOptionsProps = {
  // The logged-in username, or null while logged out.
  username: string | null;
  // True until the session state is known, so nothing is rendered prematurely.
  isLoading: boolean;
};

// Reports whether the browser has an active session, as told by /auth/me, and renders
// the matching action: a login button while logged out, a logout button while logged in.
export default function AuthOptions({ username, isLoading }: AuthOptionsProps) {
  const errorMsgShown = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") != null && !errorMsgShown.current) {
      errorMsgShown.current = true;
      window.alert("You didn't log in with an authorized account. Only team leads need to log in (for file deletion perms).")
    }
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
};

function LoginButton() {
  return (
    <Button
      variant="filled"
      component="a"
      href={`${import.meta.env.VITE_API_URL}/auth/login`}
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
};
