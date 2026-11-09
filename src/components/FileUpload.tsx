import React, { useState } from "react";
import {
  Modal,
  Button,
  Notification,
  FileInput,
  Progress,
  Checkbox,
  Center,
} from "@mantine/core";
import "@/css/FileUpload.css";

// File upload Modal and Button

interface FileUploadProps {
  uploadUrl: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ uploadUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadHiddenFiles, setUploadHiddenFiles] = useState(true);

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
    }
  };

  async function uploadMultipart(file: File, partSize = 64 * 1024 * 1024, concurrency = 4) {
    const contentType = file.type || "application/octet-stream";
    const initiateResp = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/uploads/initiate`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        contentType,
        size: file.size,
      })
    });
    const init = await initiateResp.json();

    const totalParts = Math.ceil(file.size / partSize);
    const partNumbers = Array.from({ length: totalParts }, (_, index) => index + 1);
    const urls = new Map();

    for (let index = 0; index < partNumbers.length; index += 100) {
      const batch = partNumbers.slice(index, index + 100);
      console.log(JSON.stringify(init));
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/uploads/parts`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          key: init.key,
          uploadId: init.uploadId,
          partNumbers: batch,
        })
      });
      if (resp.status !== 200) {
        throw new Error(await resp.text());
      }
      const { parts } = await resp.json();
      console.log(parts);
      for (const part of parts) urls.set(part.partNumber, part.url);
    }

    const completed = new Array(totalParts);
    let next = 0;

    async function worker() {
      while (next < partNumbers.length) {
        const partNumber = partNumbers[next++];
        const start = (partNumber - 1) * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));
        const response = await fetch(urls.get(partNumber), { method: "PUT", body: blob });
        if (response.status !== 200 && response.status !== 403) throw new Error(`part ${partNumber} failed: ${response.status}`);
        completed[partNumber - 1] = {
          partNumber,
          eTag: response.headers.get("ETag"),
        };
        setUploadProgress(100 * next / totalParts)
      }
    }

    try {
      await Promise.all(Array.from({ length: concurrency }, worker));
      await fetch(`${import.meta.env.VITE_API_URL}/api/v2/uploads/complete`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          key: init.key,
          uploadId: init.uploadId,
          parts: completed,
        })
      });
      await fetch(`${import.meta.env.VITE_API_URL}/api/v2/uploads/finalize`, { 
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ key: init.key })
      });
    } catch (error) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v2/uploads/abort`, { 
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ key: init.key, uploadId: init.uploadId })
      });
      throw error;
    }
  }

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    try {
      await Promise.all(selectedFiles.map(file => uploadMultipart(file)));
      setSuccess("File(s) uploaded successfully!");
      setSelectedFiles([]);
      setUploadProgress(100);
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (e) {
      setLoading(false);
      setError("An unexpected error occurred before sending the request: " + e);
      setUploadProgress(0);
      throw e
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedFiles([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      <Button onClick={toggleModal}>Upload Files</Button>

      <Modal
        opened={showModal}
        onClose={handleClose}
        title="Select files to upload"
        centered
      >
        <div className="files">
          <FileInput
            multiple
            accept=".mcap"
            onChange={handleFileChange}
            placeholder="Select files to upload"
            label="Choose files"
            style={{ display: "block", margin: "0 auto" }}
          />
          {selectedFiles.length > 0 && (
            <div>
              <h3>Chosen Files:</h3>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Center>
          <Checkbox
            mt={10}
            label="Hide Files from non-logged in users"
            defaultChecked={uploadHiddenFiles}
            onChange={() => setUploadHiddenFiles((v) => !v)}
          />
        </Center>

        <Center>
          <Button
            loading={loading}
            loaderProps={{ type: "dots" }}
            onClick={handleUpload}
            style={{ marginTop: 10 }}
            disabled={loading}
          >
            Upload
          </Button>
        </Center>
        <Progress value={uploadProgress}></Progress>

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
      </Modal>
    </div>
  );
};

export default FileUpload;
