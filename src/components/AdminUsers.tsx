import "@/css/Navbar.css";
import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Modal,
  Notification,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";

// Mantine insets the modal close button 5px closer to the edge than the modal body's
// padding (its header padding-right is --mb-spacing-md minus 5px). Pulling the row
// actions out by that same amount lines their right edge up with the close button.
const ROW_ACTION_EDGE_OFFSET = -5;

// Manages the login allowlist: it lists the usernames that are currently allowed to
// log in (GET /auth/usernames) and lets a logged-in admin append a new one
// (POST /auth/usernames) or remove an existing one (DELETE /auth/usernames). The
// button is hidden while there is no active session.
export default function AdminUsers() {
  const [showModal, setShowModal] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [isLoadingUsernames, setIsLoadingUsernames] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  // The username whose removal request is in flight, so only that row shows a spinner.
  const [removingUsername, setRemovingUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsernames = async () => {
    setIsLoadingUsernames(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/usernames`,
        { credentials: "include" },
      );

      if (!response.ok) {
        setError(`Failed to load admin users (status ${response.status}).`);
        return;
      }

      // The backend returns the usernames as a plain JSON array.
      const body = await response.json();
      setUsernames(Array.isArray(body) ? body : (body.data ?? []));
    } catch (error) {
      console.error("Failed to load admin users:", error);
      setError("Failed to load admin users.");
    } finally {
      setIsLoadingUsernames(false);
    }
  };

  const openModal = () => {
    setSuccess(null);
    setNewUsername("");
    setShowModal(true);
    loadUsernames();
  };

  const addUsername = async () => {
    const username = newUsername.trim();
    if (!username) {
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/usernames`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message ?? `status ${response.status}`;
        setError(
          response.status === 401
            ? "You must be logged in to add admin users."
            : `Failed to add ${username}: ${message}`,
        );
        return;
      }

      setNewUsername("");
      setSuccess(`Added ${username} to the admin users.`);
      await loadUsernames();
    } catch (error) {
      console.error("Failed to add admin user:", error);
      setError("Failed to add admin user.");
    } finally {
      setIsAdding(false);
    }
  };

  const removeUsername = async (username: string) => {
    setRemovingUsername(username);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/usernames`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message ?? `status ${response.status}`;
        setError(
          response.status === 401
            ? "You must be logged in to remove admin users."
            : `Failed to remove ${username}: ${message}`,
        );
        return;
      }

      setSuccess(`Removed ${username} from the admin users.`);
      await loadUsernames();
    } catch (error) {
      console.error("Failed to remove admin user:", error);
      setError("Failed to remove admin user.");
    } finally {
      setRemovingUsername(null);
    }
  };

  return (
    <>
      <Button
        variant="filled"
        leftSection={<IconUserPlus size="20" />}
        onClick={openModal}
      >
        Admin Users
      </Button>

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title="Admin Users"
        centered
        styles={{
          header: { paddingBottom: 5 }
        }}
      >
        <Stack gap="sm">
          {isLoadingUsernames ? (
            <Loader />
          ) : usernames.length > 0 ? (
            <Stack gap={4} style={{ marginRight: ROW_ACTION_EDGE_OFFSET }}>
              {usernames.map((username) => (
                <Group key={username} justify="space-between" wrap="nowrap">
                  <Text>{username}</Text>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    aria-label={`Remove ${username}`}
                    loading={removingUsername === username}
                    // One removal at a time keeps the reloaded list consistent.
                    disabled={removingUsername !== null}
                    onClick={() => removeUsername(username)}
                  >
                    <IconTrash size="18" />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">No admin users added.</Text>
          )}

          <TextInput
            label="Add a new admin user"
            placeholder="username"
            value={newUsername}
            onChange={(event) => setNewUsername(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addUsername();
              }
            }}
          />
          <Button
            loading={isAdding}
            loaderProps={{ type: "dots" }}
            disabled={!newUsername.trim()}
            onClick={addUsername}
          >
            Add
          </Button>

          {success && (
            <Notification color="green" onClose={() => setSuccess(null)}>
              {success}
            </Notification>
          )}
          {error && (
            <Notification color="red" onClose={() => setError(null)}>
              {error}
            </Notification>
          )}
        </Stack>
      </Modal>
    </>
  );
}
