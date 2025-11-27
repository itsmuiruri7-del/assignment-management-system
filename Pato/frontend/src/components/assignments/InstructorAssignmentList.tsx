'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Spinner, Alert, Button, Accordion, Table } from 'react-bootstrap';
import GradingForm from './GradingForm';

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
}

interface Submission {
  id: string;
  filePath: string;
  submittedAt: string;
  student: {
    name: string;
    email: string;
  };
  marks: number | null;
}

export default function InstructorAssignmentList({ refreshKey }: { refreshKey: number }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<{ [key: string]: Submission[] }>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/assignments/my-assignments');
        setAssignments(data);
      } catch (err) {
        console.error('Failed to load assignments:', err);
        setError('Failed to load your assignments.');
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [refreshKey]);

  const fetchSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(prev => ({ ...prev, [assignmentId]: data }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load submissions.');
    }
    setLoadingSubmissions(false);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Accordion>
      {assignments.map((assignment, index) => (
        <Accordion.Item eventKey={String(index)} key={assignment.id}>
          <Accordion.Header>{assignment.title} - Due: {new Date(assignment.dueDate).toLocaleDateString()}</Accordion.Header>
          <Accordion.Body>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => fetchSubmissions(assignment.id)}
              disabled={loadingSubmissions}
            >
              {loadingSubmissions ? 'Loading...' : 'View Submissions'}
            </Button>

            {submissions[assignment.id] && (
              <div className="mt-3">
                <h5>Submissions for {assignment.title}</h5>
                {submissions[assignment.id].length > 0 ? (
                  <Table striped bordered hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted At</th>
                        <th>File</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions[assignment.id].map(sub => (
                        <tr key={sub.id}>
                          <td>{sub.student.name} ({sub.student.email})</td>
                          <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td>
                            {(() => {
                              // Build a safe URL for downloaded files. `sub.filePath` may be
                              // an absolute filesystem path on the server (Windows backslashes).
                              // Normalize backslashes, extract the uploaded filename, and
                              // construct a URL under the backend `/uploads/submissions/<filename>` route.
                              const apiBase = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001').replace(/\/$/, '');
                              let p = sub.filePath || '';
                              // Replace single backslashes (Windows paths) with forward slashes
                              p = p.replace(/\\/g, '/');

                              // Try to find the uploads segment; otherwise fall back to filename
                              const lower = p.toLowerCase();
                              const idx = lower.indexOf('/uploads/');
                              let filename = '';
                              if (idx !== -1) {
                                // substring after '/uploads/' e.g. 'submissions/filename.ext'
                                const after = p.substring(idx + '/uploads/'.length);
                                const parts = after.split('/').filter(Boolean);
                                filename = parts[parts.length - 1] || '';
                              } else {
                                const parts = p.split('/').filter(Boolean);
                                filename = parts[parts.length - 1] || '';
                              }

                              // Build a safe, encoded URL that requests the backend download
                              // endpoint so the response is served with a Content-Disposition
                              // attachment header (prompts Save As in the browser).
                              const fileUrl = `${apiBase}/api/download/submissions/${encodeURIComponent(filename)}`;
                              return (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download</a>
                              );
                            })()}
                          </td>
                          <td>
                            {/* Grading form will go here */}
                            {sub.marks !== null ? (
                              <span className="text-success fw-bold">{sub.marks} / 100</span>
                            ) : (
                              <GradingForm 
                                submissionId={sub.id} 
                                onGradeSuccess={() => fetchSubmissions(assignment.id)} 
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>No submissions yet.</p>
                )}
              </div>
            )}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
