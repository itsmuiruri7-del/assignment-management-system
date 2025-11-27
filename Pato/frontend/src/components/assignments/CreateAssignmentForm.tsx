'use client';

import { useState } from 'react';
import api from '@/services/api';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { AxiosError } from 'axios';

interface CreateAssignmentFormProps {
  onAssignmentCreated: () => void;
}

export default function CreateAssignmentForm({ onAssignmentCreated }: CreateAssignmentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('dueDate', dueDate);
      if (attachment) fd.append('attachment', attachment);

      // Let the browser/axios set the Content-Type (including multipart boundary)
      await api.post('/assignments', fd);
      setSuccess('Assignment created successfully!');
      // Clear form
      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachment(null);
      // Notify parent to refetch assignments
      onAssignmentCreated();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to create assignment.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Create New Assignment</Card.Title>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={submitting}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="dueDate">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={submitting}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="attachment">
            <Form.Label>Attachment (optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) setAttachment(e.target.files[0]);
              }}
              disabled={submitting}
              accept=".pdf,.doc,.docx,.txt,.zip,image/*"
            />
          </Form.Group>

          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
