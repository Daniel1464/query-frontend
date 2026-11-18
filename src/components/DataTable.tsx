import {
  Group,
  Input,
  Loader,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import PreviewCard from "./PreviewCard";

// Data table of the files/root page
interface DataTableProps {
  data?: MCAPFileInformation[];
  selectedRow?: string;
  pendingUploads: string[];
  selectedData: MCAPFileInformation | undefined;
  setSelectedRow: React.Dispatch<React.SetStateAction<string>>;
  setSelectedData: React.Dispatch<
    React.SetStateAction<MCAPFileInformation | undefined>
  >;
}

function formatDuration(seconds: number | undefined) {
  if (seconds == null) return "Unknown";

  const useMinutes = seconds > 60;
  const value = useMinutes ? seconds / 60 : seconds;
  const unit = useMinutes ? "min" : "s";
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

export default function DataTable({
  data,
  selectedRow,
  pendingUploads,
  selectedData,
  setSelectedRow,
  setSelectedData,
}: DataTableProps) {
  const theme = useMantineTheme();

  // The Hidden column and its toggles are only rendered for logged-in users (team leads).
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Optimistic per-file visibility, keyed by file id, so a switch reflects the
  // result of its request without waiting for the parent to refetch.
  const [hiddenOverrides, setHiddenOverrides] = useState<
    Record<string, boolean>
  >({});
  // File ids whose visibility request is in flight, so only that switch is disabled.
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            credentials: "include",
          },
        );
        // A 401 means there is no active session, so the column stays hidden.
        setIsLoggedIn(response.ok);
      } catch (error) {
        console.error("Failed to load auth status:", error);
        setIsLoggedIn(false);
      }
    };

    loadAuthStatus();
  }, []);

  const setPreviewData = (file: MCAPFileInformation) => {
    if (selectedRow === file.id) {
      setSelectedRow("");
      setSelectedData(undefined);
    } else {
      setSelectedRow(file.id);
      setSelectedData(file);
    }
  };

  const changeVisibility = async (
    file: MCAPFileInformation,
    nextHidden: boolean,
  ) => {
    const fileLabel = file.mcap_files
      ? getFileNameWithoutExtension(file.mcap_files[0].file_name)
      : file.id;
    const showError = (error: string) => {
      notifications.show({
        title: `Failed to update visibility for ${fileLabel}`,
        message: error,
        color: "red",
      });
      console.error("Error sending visibility request:", error);
    };

    setPendingIds((prev) => ({ ...prev, [file.id]: true }));
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/mcaps/${file.id}/changeVisibilityTo/${
          nextHidden ? "hidden" : "visible"
        }`,
        { method: "POST", credentials: "include" },
      );

      if (response.status === 401) {
        showError("You must be logged in to change file visibility.");
        return;
      }
      if (!response.ok) {
        showError(
          `Invalid status: ${response.status}. Error Msg: ${await response.text()}`,
        );
        return;
      }
      setHiddenOverrides((prev) => ({ ...prev, [file.id]: nextHidden }));
    } catch (error) {
      showError(`${error}`);
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev };
        delete next[file.id];
        return next;
      });
    }
  };

  // Take out when API server team implements filename id in their get route
  const getFileNameWithoutExtension = (fileNameWithExtension: string) => {
    const lastDotIndex = fileNameWithExtension.lastIndexOf(".");
    return lastDotIndex !== -1
      ? fileNameWithExtension.slice(0, lastDotIndex)
      : fileNameWithExtension;
  };

  const rows = !data ? (
    <Table.Tr>
      <Table.Td colSpan={100} ta="center">
        <Loader />
      </Table.Td>
    </Table.Tr>
  ) : data.length === 0 ? (
    <Table.Tr>
      <Table.Td colSpan={100} ta="center">
        No results found
      </Table.Td>
    </Table.Tr>
  ) : (
    data.map((file) => (
      <Table.Tr
        key={file.id}
        onClick={() => setPreviewData(file)}
        bg={selectedRow === file.id ? theme.primaryColor : ""}
      >
        <Table.Td style={{ paddingLeft: "25px", size: "xs" }}>
          {file.mcap_files?.map((mcap) => (
            <div key={mcap.file_name}>
              {getFileNameWithoutExtension(mcap.file_name)}
            </div>
          ))}
        </Table.Td>
        <Table.Td>{file.date}</Table.Td>
        <Table.Td>{file.event_type}</Table.Td>
        <Table.Td>
          {file.mcap_files?.map((mcap) => (
            <div key={mcap.file_name}>
              {formatDuration(mcap.duration_seconds)}
            </div>
          ))}
        </Table.Td>
        <Table.Td style={{ size: "xs" }}>
          <Input.Wrapper>
            <Textarea
              variant="unstyled"
              value={file.location}
              style={{ whiteSpace: "normal", wordWrap: "break-word" }}
              readOnly
              autosize
              placeholder="No Location Available"
              minRows={1}
              maxRows={2}
            />
          </Input.Wrapper>
        </Table.Td>

        <Table.Td style={{ paddingRight: "25px" }}>
          <Input.Wrapper>
            <Textarea
              variant="unstyled"
              value={file.notes}
              style={{ whiteSpace: "normal", wordWrap: "break-word" }}
              readOnly
              autosize
              placeholder="No Note Available"
              minRows={1}
              maxRows={2}
            />
          </Input.Wrapper>
        </Table.Td>

        {isLoggedIn ? (
          <Table.Td onClick={(event) => event.stopPropagation()}>
            <Switch
              aria-label={`Toggle visibility for ${
                file.mcap_files
                  ? getFileNameWithoutExtension(file.mcap_files[0].file_name)
                  : file.id
              }`}
              checked={hiddenOverrides[file.id] ?? file.hidden ?? false}
              disabled={pendingIds[file.id] ?? false}
              onChange={(event) =>
                changeVisibility(file, event.currentTarget.checked)
              }
              color="darkblue"
            />
          </Table.Td>
        ) : null}
      </Table.Tr>
    ))
  );

  const pendingUploadsRows = pendingUploads.map((upload, index) => (
    <Table.Tr key={"pendingUpload" + index}>
      <Table.Td style={{ paddingLeft: "25px", size: "xs" }}>
        <Group align="center" gap="sm">
          <Text fz={14}>{upload.replace(".mcap", "")}</Text>
          <Loader size="xs" />
        </Group>
      </Table.Td>
      <Table.Td />
      <Table.Td />
      <Table.Td />
      <Table.Td />
      <Table.Td />
      {isLoggedIn ? <Table.Td /> : null}
    </Table.Tr>
  ));

  return (
    <Stack miw="60%" style={{ flexGrow: 1 }}>
      <Table.ScrollContainer
        h="100%"
        minWidth="100%"
        style={{ overflowY: "auto", position: "relative" }}
      >
        <Table
          stickyHeader
          highlightOnHover={data && data.length > 0}
          highlightOnHoverColor={"#F8F9FA"}
        >
          <Table.Thead bg={"#D1BF80"}>
            <Table.Tr>
              <Table.Th style={{ paddingLeft: "25px" }}>Name</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Event Type</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th
                style={{ paddingRight: isLoggedIn ? undefined : "25px" }}
              >
                Notes
              </Table.Th>
              {isLoggedIn && (
                <Table.Th>
                  <Group gap={4} wrap="nowrap">
                    <Text fw={700} fz={14}>
                      Hidden
                    </Text>
                    <Tooltip
                      label="Hidden files are not visible to people who aren't team leads."
                      withArrow
                      multiline
                      position="bottom"
                      w={220}
                    >
                      <IconInfoCircle size={16} />
                    </Tooltip>
                  </Group>
                </Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pendingUploadsRows}
            {rows}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <PreviewCard
        selectedData={selectedData}
        clearSelectedData={() => {
          setSelectedData(undefined);
          setSelectedRow("");
        }}
      />
    </Stack>
  );
}
