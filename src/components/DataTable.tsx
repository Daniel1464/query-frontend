import { Loader, Stack, Table } from "@mantine/core";
import { useMantineTheme } from "@mantine/core";
import { Input, Textarea } from "@mantine/core";
import PreviewCard from "./PreviewCard";

// Data table of the files/root page
interface DataTableProps {
  data?: MCAPFileInformation[];
  selectedRow?: string;
  selectedData: MCAPFileInformation | undefined;
  setSelectedRow: React.Dispatch<React.SetStateAction<string>>;
  setSelectedData: React.Dispatch<
    React.SetStateAction<MCAPFileInformation | undefined>
  >;
}

export default function DataTable({
  data,
  selectedRow,
  selectedData,
  setSelectedRow,
  setSelectedData,
}: DataTableProps) {
  const theme = useMantineTheme();

  const setPreviewData = (file: MCAPFileInformation) => {
    if (selectedRow === file.id) {
      setSelectedRow("");
      setSelectedData(undefined);
    } else {
      setSelectedRow(file.id);
      setSelectedData(file);
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
          {file.mcap_files
            ? getFileNameWithoutExtension(file.mcap_files[0].file_name)
            : null}
        </Table.Td>
        <Table.Td>{file.date}</Table.Td>
        <Table.Td>{file.event_type}</Table.Td>
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
      </Table.Tr>
    ))
  );
  return (
    <Stack>
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
              <Table.Th>Location</Table.Th>
              <Table.Th style={{ paddingRight: "25px" }}>Notes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <PreviewCard selectedRow={selectedRow} selectedData={selectedData}  />
    </Stack>
  );
}
