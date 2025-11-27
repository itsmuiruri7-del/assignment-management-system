'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { ListGroup, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import SubmissionForm from './SubmissionForm';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string | null;
  instructor: {
    name: string;
  };
}

interface Submission {
  id: string;
  assignmentId: string;
  status: 'SUBMITTED' | 'GRADED';
  marks: number | null;
  feedback: string | null;
}

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Helper to load assignments and submissions for the current page.
  const fetchAndSet = async (currentPage = page) => {
    setLoading(true);
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get(`/assignments?page=${currentPage}&pageSize=10`),
        api.get('/submissions/me?page=1&pageSize=100'),
      ]);
      const a = assignmentsRes.data?.items ?? assignmentsRes.data ?? [];
      const s = submissionsRes.data?.items ?? submissionsRes.data ?? [];
      setAssignments(a);
      setSubmissions(s);
      setTotalPages(assignmentsRes.data?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load assignments or submissions.');
    } finally {
      setLoading(false);
    }
  };

  // Handle downloading attachment with robust URL construction and logging
  // Supports all file types and uses the most suitable method (direct download or fallback).
  const handleDownload = async (attachmentUrl: string, filename?: string) => {
    if (!attachmentUrl) return;

    // make fullUrl visible to catch/fallback
    let fullUrl = attachmentUrl;
    try {
      // Determine full URL:
      // - If attachmentUrl is already absolute, use it
      // - If relative (starts with /), prepend backend origin derived from NEXT_PUBLIC_API_URL or fallback
      if (!/^https?:\/\//i.test(attachmentUrl)) {
        const apiEnv = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const backendBase = apiEnv.replace(/\/api\/?$/, '').replace(/\/$/, '');
        fullUrl = `${backendBase}${attachmentUrl.startsWith('/') ? '' : '/'}${attachmentUrl}`;
      }

      // Logging to help debug failures in the wild
      // eslint-disable-next-line no-console
      console.debug('Attempting file download', { attachmentUrl, fullUrl, filename });

      // Primary method: Use anchor element with download attribute
      // This is the most reliable and works for all file types.
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = filename || 'attachment'; // Forces download instead of opening in browser
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Success message
      // eslint-disable-next-line no-console
      console.debug('Download initiated successfully', { fullUrl, filename });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Download initiation failed:', err);

      // Fallback 1: try opening the URL directly in a new tab/window.
      try {
        // eslint-disable-next-line no-console
        console.debug('Fallback 1: open fullUrl in new tab', fullUrl);
        const fallbackLink = document.createElement('a');
        fallbackLink.href = fullUrl;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        alert('File opened in a new tab. If it did not download, check the browser console or contact support.');
        return;
      } catch (fallbackErr) {
        // eslint-disable-next-line no-console
        console.error('Fallback 1 open failed:', fallbackErr);
      }

      // Final message with URL for debugging
      alert(`Failed to download file.\n\nAttempted URL: ${fullUrl}\n\nCheck console for details or contact support.`);
    }
  };

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => {
      if (!mounted) return;
      await fetchAndSet(page);
    };
    void doLoad();
    return () => {
      mounted = false;
    };
  }, [page]);

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find((sub) => sub.assignmentId === assignmentId);
  };

  return (
    <div>
      <h2>Assignments</h2>
      {assignments.length === 0 ? (
        <p>No assignments available at the moment.</p>
      ) : (
        <ListGroup variant="flush">
          {assignments.map((assignment) => {
            const submission = getSubmissionStatus(assignment.id);
            return (
              <ListGroup.Item key={assignment.id} className="mb-3 p-3 border rounded">
                <div className="d-flex w-100 justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{assignment.title}</h5>
                    <small className="text-muted">Due: {new Date(assignment.dueDate).toLocaleDateString()}</small>
                  </div>
                  {assignment.attachmentUrl && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        const filename = assignment.attachmentUrl?.split('/').pop() || 'attachment';
                        // eslint-disable-next-line no-console
                        console.debug(`Downloading assignment attachment:`, { id: assignment.id, title: assignment.title, attachmentUrl: assignment.attachmentUrl });
                        void handleDownload(assignment.attachmentUrl!, filename);
                      }}
                      title="Download attachment from instructor"
                    >
                      📥 Download
                    </Button>
                  )}
                </div>
                <p className="mb-1 text-muted">Instructor: {assignment.instructor.name}</p>
                <p>{assignment.description}</p>
                
                {submission ? (
                  <div>
                    <Alert variant={submission.status === 'GRADED' ? 'success' : 'info'}>
                      <p className="fw-bold">Status: <Badge bg={submission.status === 'GRADED' ? 'success' : 'primary'}>{submission.status}</Badge></p>
                      {submission.status === 'GRADED' && (
                        <>
                          <hr />
                          <p><strong>Marks:</strong> {submission.marks ?? 'Not graded'} / 100</p>
                          <p><strong>Feedback:</strong> {submission.feedback || 'No feedback provided.'}</p>
                        </>
                      )}
                    </Alert>
                  </div>
                ) : (
                  <SubmissionForm
                    assignmentId={assignment.id}
                    onSubmissionSuccess={(submission) => {
                      // If parent receives the created submission, update local state
                      // so the UI reflects the new submission immediately. Otherwise
                      // fall back to refetching all data.
                      if (submission) {
                        // Normalize fields to match Submission type (no undefined)
                        const normalized = {
                          id: submission.id,
                          assignmentId: submission.assignmentId,
                          status: submission.status,
                          marks: submission.marks ?? null,
                          feedback: submission.feedback ?? null,
                        };
                        setSubmissions((prev) => {
                          // Avoid duplicates
                          if (prev.find((p) => p.id === normalized.id)) return prev;
                          return [...prev, normalized];
                        });
                      } else {
                        void fetchAndSet();
                      }
                    }}
                  />
                )}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
      {/* Simple pager */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="small">Page {page} of {totalPages}</span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
