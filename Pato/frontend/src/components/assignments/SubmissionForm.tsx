'use client';

import { useState } from 'react';
import api from '@/services/api';
import { Form, Button, ProgressBar, Alert } from 'react-bootstrap';
import { AxiosError, AxiosProgressEvent } from 'axios';

interface SubmissionFormProps {
  assignmentId: string;
  // Callback to refresh the assignment list. If a submission object is provided,
  // the parent can optimistically update without refetching.
  onSubmissionSuccess: (submission?: {
    id: string;
    assignmentId: string;
    status: 'SUBMITTED' | 'GRADED';
    marks?: number | null;
    feedback?: string | null;
  }) => void;
}

export default function SubmissionForm({ assignmentId, onSubmissionSuccess }: SubmissionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId);

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      };

      const res = await api.post('/submissions', formData, config);

      setSuccess('File uploaded successfully!');
      setFile(null);
      // Pass the created submission back to parent so UI can update immediately.
      onSubmissionSuccess(res.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'File upload failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Submit your work</Form.Label>
          <Form.Control type="file" onChange={handleFileChange} disabled={uploading} />
        </Form.Group>

        {uploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} className="mb-3" />}

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Button variant="primary" type="submit" disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Submit Assignment'}
        </Button>
      </Form>
    </div>
  );
}
