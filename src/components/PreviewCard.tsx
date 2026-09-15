import { useEffect, useState } from "react";
import EditInfo from "@/components/EditInfo";
import DeleteData from "@/components/DeleteData";
//import MatFileUpload from "./MatFileUpload";
// used for uploading mat and h5 files
import {
  Text,
  Button,
  Grid,
  Menu,
  rem,
  Table,
  ScrollArea,
  Notification,
  CopyButton,
  Modal,
  Select,
  Stack,
  ActionIcon,
  CloseButton,
} from "@mantine/core";
import {
  IconDownload,
  IconChevronDown,
  IconFile,
  IconPlayerPlay,
} from "@tabler/icons-react";

import "@/css/PreviewCard.css";

// Has multiple components in this file
// 1. Preview Card component (rectangular section at the bottom of roots/files page)
// 2. Data Div component -- goes in Preview card component
// 3. Data Div Header component -- goes in Preview card component
// 4. Download Button component (param : list of files | able to download multiple files)
// 5. Schema Table component in Preview card

interface PreviewCardProps {
  selectedData: MCAPFileInformation | undefined;
  clearSelectedData: () => void;
}

const origin = window.location.origin;

interface FunctionSignature {
  help: string;
  inputs: Array<{
    help: string;
    mwsize: number[];
    mwtype: string;
    name: string;
  }>;
  outputs: Array<{
    help: string;
    mwsize: number[];
    mwtype: string;
    name: string;
  }>;
}

interface FunctionDefinition {
  signatures: FunctionSignature[];
}

interface ArchiveData {
  archiveSchemaVersion: string;
  archiveUuid: string;
  functions: Record<string, FunctionDefinition>;
  matlabRuntimeRelease: string;
  matlabRuntimeVersion: string;
}

interface DiscoveryResponse {
  discoverySchemaVersion: string;
  archives: Record<string, ArchiveData>;
}

type MPSScript = {
  name: string;
  result: string;
};

type MPSPackage = {
  scripts: MPSScript[];
};

type MPSPackages = {
  [key: string]: MPSPackage;
};

function PreviewCard({ selectedData, clearSelectedData }: PreviewCardProps) {
  function formatMPSResult(version: string, funcName: string): string {
    // check if result exists
    if (selectedData?.mps_record?.[version]?.[funcName]?.result) {
      // If the result exists, check the type
      const result = selectedData.mps_record[version][funcName];
      if (result.type == "mat") {
        return `<a href="${result.result}" target="_blank" rel="noopener noreferrer">Download MAT</a>`;
      } else if (result.type == "image") {
        return `<a href="${result.result}" target="_blank" rel="noopener noreferrer">Download Image</a>`;
      } else {
        return result.result;
      }
    } else {
      return "";
    }
  }

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [scriptsModalOpened, setScriptsModalOpened] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>();
  // const [scriptOutput, setScriptOutput] = useState<string>("");
  const [availableScripts, setAvailableScripts] = useState<MPSPackages>({});

  async function runScript(
    scriptVersion: string,
    scriptName: string,
    id: string,
  ) {
    const resp = await fetch(
      `${import.meta.env.VITE_API_URL}/mcaps/${id}/process?version=${scriptVersion}&scripts=${scriptName}`,
      { method: "GET" },
    );

    if (!resp.ok) {
      const errorMsg = await resp.text();
      setError(`failed to run script: ${errorMsg}`);
    } else {
      setSuccess("job submitted successfully!");
    }
  }

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_MPS_URL}/api/discovery`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch scripts");
        }
        const data: DiscoveryResponse = await response.json();

        const packages: MPSPackages = {};

        Object.entries(data.archives).forEach(([version, archiveData]) => {
          console.log(selectedData);
          packages[version] = { scripts: [] };
          Object.keys(archiveData.functions).forEach((funcName) => {
            packages[version].scripts.push({
              name: funcName,
              result: formatMPSResult(version, funcName),
            });
          });
        });

        setAvailableScripts(packages);
      } catch (error) {
        console.error("Error fetching scripts:", error);
        setError("Failed to load available scripts");
      }
    };

    if (scriptsModalOpened) {
      fetchScripts();
    }
  }, [scriptsModalOpened]);

  if (!selectedData) {
    return <></>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileNameWithoutExtension = (fileNameWithExtension: string) => {
    const lastDotIndex = fileNameWithExtension.lastIndexOf(".");
    return lastDotIndex !== -1
      ? fileNameWithExtension.slice(0, lastDotIndex)
      : fileNameWithExtension;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const latImageUrl =
    selectedData?.content_files?.vn_lat_lon_plot?.[0]?.signed_url ??
    "https://camo.githubusercontent.com/25de56138803873d9ea83567c55b9a022ad86d0acb53bb7c733bb038583e2279/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f76322f726573697a653a6669743a3430302f312a7241676c6b664c4c316676384a6363697a4a33572d512e706e67";
  const velImageUrl =
    selectedData?.content_files?.vn_time_vel_plot?.[0]?.signed_url ??
    "https://camo.githubusercontent.com/25de56138803873d9ea83567c55b9a022ad86d0acb53bb7c733bb038583e2279/68747470733a2f2f6d69726f2e6d656469756d2e636f6d2f76322f726573697a653a6669743a3430302f312a7241676c6b664c4c316676384a6363697a4a33572d512e706e67";

  return (
    <div className="preview-container">
      <CloseButton
        style={{ position: "absolute", top: 0 }}
        size="md"
        onClick={clearSelectedData}
      />
      <Grid>
        <Grid.Col span={3} h={260} className="image-column">
          <img src={latImageUrl} alt="Preview" className="preview-image" />
        </Grid.Col>
        <Grid.Col span={3} h={260} className="image-column">
          <img src={velImageUrl} alt="Preview" className="preview-image" />
        </Grid.Col>
        <Grid.Col span={6} h={260}>
          <ScrollArea scrollbars="y" h={260} pb={20}>
            <PreviewDataDivHeader
              name={getFileNameWithoutExtension(
                selectedData.mcap_files[0].file_name,
              )}
              val={""}
            />
            {success && (
              <Notification
                color="green"
                onClose={() => setSuccess(null)}
                style={{ marginTop: 10 }}
              >
                {success}
              </Notification>
            )}
            {error && (
              <Notification
                color="red"
                onClose={() => setError(null)}
                style={{ marginTop: 10 }}
              >
                {error}
              </Notification>
            )}
            <PreviewDataDiv
              name={"Car Model"}
              val={selectedData.car_model ?? "NA"}
            />
            <PreviewDataDiv name={"Time"} val={formatTime(selectedData.date)} />
            <PreviewDataDiv name={"Date"} val={formatDate(selectedData.date)} />
            <PreviewDataDiv name={"Location"} val={selectedData.location} />
            <PreviewDataDiv
              name={"Event Type"}
              val={selectedData.event_type ?? null}
            />
            <PreviewDataDiv name={"Notes"} val={selectedData.notes ?? null} />
            <PreviewDataDiv name={"Location"} val={selectedData.location} />
            <div>
              <DeleteData selectedData={selectedData} />
              <CopyButton
                value={`${origin}${import.meta.env.BASE_URL}?id=${selectedData.id}`}
              >
                {({ copied, copy }) => (
                  <Button
                    color={copied ? "green" : "#B3A369"}
                    onClick={copy}
                    size="compact-md"
                  >
                    {copied ? "Copied" : "Copy URL"}
                  </Button>
                )}
              </CopyButton>
              <Button
                size="compact-md"
                color="violet"
                onClick={() => setScriptsModalOpened(true)}
              >
                Scripts
              </Button>
              <EditInfo selectedData={selectedData} />

              {selectedData.mcap_files.map((item) => (
                <DownloadButton
                  buttonText="MCAP"
                  fileName={item.file_name}
                  signedUrl={item.signed_url ?? null}
                  id={selectedData.id}
                />
              ))}
              {selectedData.mat_files.map((item) => (
                <DownloadButton
                  buttonText={(
                    item.file_name.split(".").pop() || ""
                  ).toUpperCase()}
                  fileName={item.file_name}
                  signedUrl={item.signed_url}
                  id={selectedData.id}
                />
              ))}
              {/*<MatFileUpload fileName={getFileNameWithoutExtension(selectedData.mcap_files[0].file_name)} uniqueID={selectedData.id} uploadUrl={""}/>*/}
              {/* Will be available once route is ready */}
            </div>
          </ScrollArea>
        </Grid.Col>
      </Grid>

      <Modal
        opened={scriptsModalOpened}
        onClose={() => setScriptsModalOpened(false)}
        title={<Text fw={700}>Run MATLAB Scripts</Text>}
        centered
        size="lg"
      >
        <Stack>
          <Text size="sm">
            Viewing:{" "}
            {getFileNameWithoutExtension(selectedData.mcap_files[0].file_name)}
          </Text>

          <Select
            label="Select MATLAB Script Version"
            placeholder={
              Object.keys(availableScripts).length != 0
                ? "Choose an archive version to see results and run scripts"
                : "Loading archive versions..."
            }
            data={Object.keys(availableScripts)}
            value={selectedVersion}
            onChange={setSelectedVersion}
            disabled={Object.keys(availableScripts).length == 0}
            searchable
          />

          {selectedVersion && (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th colSpan={2}>Run Scripts</Table.Th>
                  <Table.Th>Results</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {availableScripts[selectedVersion ?? ""]?.scripts.map(
                  (script, index) => (
                    <Table.Tr key={index}>
                      <Table.Td style={{ width: "16px" }}>
                        <ActionIcon
                          variant="filled"
                          color="green"
                          onClick={() => {
                            runScript(
                              selectedVersion,
                              script.name,
                              selectedData!.id,
                            );
                          }}
                        >
                          <IconPlayerPlay
                            style={{ width: "70%", height: "70%" }}
                            stroke={1.5}
                          />
                        </ActionIcon>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "left" }}>
                        {script.name}
                      </Table.Td>
                      <Table.Td
                        style={{ textAlign: "left" }}
                        dangerouslySetInnerHTML={{ __html: script.result }}
                      />
                    </Table.Tr>
                  ),
                )}
              </Table.Tbody>
            </Table>
          )}

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

          {/* {scriptOutput && (
            <div>
              <Text fw={700} mb="xs">
                Script Returns:
              </Text>
              <Code block style={{ maxHeight: "300px", overflow: "auto" }}>
                {scriptOutput}
              </Code>
            </div>
          )} */}
        </Stack>
      </Modal>
    </div>
  );
}
export default PreviewCard;

interface PreviewDataDivProps {
  name: string;
  val: string | null;
}

export function PreviewDataDiv({ name, val }: PreviewDataDivProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <Text size="xs" fw={700}>
        {name}:{" "}
      </Text>
      <span style={{ marginLeft: "5px" }} />
      <Text size="xs" fw={400}>
        {val}
      </Text>
    </div>
  );
}

export function PreviewDataDivHeader({ name, val }: PreviewDataDivProps) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Text size="m" fw={700}>
        {name}:{" "}
      </Text>
      <span style={{ marginLeft: "5px" }} />
      <Text size="m" fw={400}>
        {val}
      </Text>
    </div>
  );
}

interface DownloadButtonProps {
  buttonText: string;
  fileName: string;
  signedUrl: string | null;
  id: string;
}

export function DownloadButton({
  // add id parameter to pass into API call (use /id call on backend)
  buttonText,
  fileName,
  id,
}: DownloadButtonProps) {
  return (
    <Menu
      transitionProps={{ transition: "pop-top-right" }}
      position="top-end"
      width={150}
      withinPortal
    >
      <Menu.Target>
        <Button
          variant="filled"
          size="xs"
          rightSection={<IconChevronDown size={20} />}
          leftSection={<IconDownload size={20} />}
        >
          {buttonText}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          style={{
            fontSize: "10px",
          }}
          leftSection={
            <IconFile
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={async () => {
            // make a call to server to get new sign url
            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/mcaps/${id}`,
              );
              if (!res.ok)
                throw new Error(
                  `Failed to fetch: ${res.status} ${res.statusText}`,
                );

              const json = await res.json();

              let signedUrl = json.data[0]?.mcap_files?.[0]?.signed_url;
              if (buttonText == "H5") {
                signedUrl = json.data[0].mat_files[0].signed_url;
              }

              if (signedUrl) {
                window.open(signedUrl, "_blank"); // triggers download in new tab
              } else {
                console.error("No signed URL available for this MCAP file");
              }
            } catch (err) {
              console.error("Download error:", err);
            }
          }}
        >
          {fileName}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
