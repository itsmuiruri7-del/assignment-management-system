'use client';

import { useState } from 'react';
import api from '@/services/api';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { AxiosError } from 'axios';

interface GradingFormProps {
  submissionId: string;
  onGradeSuccess: () => void;
}

export default function GradingForm({ submissionId, onGradeSuccess }: GradingFormProps) {
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/submissions/${submissionId}/grade`, { marks, feedback });
      onGradeSuccess(); // Refresh the list
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to grade submission.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <InputGroup size="sm">
        <Form.Control
          type="number"
          placeholder="Marks / 100"
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          required
          disabled={submitting}
          min="0"
          max="100"
        />
        <Form.Control
          as="textarea"
          placeholder="Feedback (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={submitting}
          rows={1}
        />
        <Button type="submit" variant="outline-secondary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Grade'}
        </Button>
      </InputGroup>
    </Form>
  );
}
