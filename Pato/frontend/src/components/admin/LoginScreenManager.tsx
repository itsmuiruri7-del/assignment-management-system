import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert, Image, Row, Col } from 'react-bootstrap';
import { FaTrash, FaCheck, FaUpload } from 'react-icons/fa';
import api from '../../services/api';

interface LoginScreenImage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

const LoginScreenManager: React.FC = () => {
  const [images, setImages] = useState<LoginScreenImage[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await api.get('/login-screen-images');
      setImages(response.data);
    } catch (err) {
      console.error('Error fetching login screen images:', err);
      setError('Failed to load login screen images');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.image) {
      setError('Name and image are required');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('image', formData.image);

      // Let the browser/axios set the Content-Type (multipart boundary)
      const res = await api.post('/login-screen-images', data);

      setSuccess('Image uploaded successfully');
      // Notify other parts of the app (e.g., login page) that the active login screen changed
      try {
        const imageUrl = res.data?.imageUrl || null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('login-screen:changed', { detail: { imageUrl } }));
        }
      } catch (e) {
        // ignore dispatch errors
      }
      setShowUploadModal(false);
      setFormData({ name: '', description: '', image: null });
      fetchImages();
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await api.patch(`/login-screen-images/${id}/activate`);
      setSuccess('Active image updated');
      fetchImages();
    } catch (err) {
      console.error('Error setting active image:', err);
      setError('Failed to set active image');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await api.delete(`/login-screen-images/${id}`);
      setSuccess('Image deleted successfully');
      fetchImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Login Screen Images</h5>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setShowUploadModal(true)}
        >
          <FaUpload className="me-1" /> Upload New
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        <Row xs={1} md={2} lg={3} className="g-4">
          {images.map((image) => (
            <Col key={image.id}>
              <Card>
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <Image 
                    src={image.imageUrl} 
                    alt={image.name} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                  />
                </div>
                <Card.Body>
                  <Card.Title>{image.name}</Card.Title>
                  {image.description && (
                    <Card.Text className="text-muted small">
                      {image.description}
                    </Card.Text>
                  )}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className={`badge ${image.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {image.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div>
                      {!image.isActive && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleSetActive(image.id)}
                        >
                          <FaCheck /> Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        disabled={image.isActive && images.length > 1}
                        title={image.isActive && images.length > 1 ? 
                          "Cannot delete the only active image" : ""}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {images.length === 0 && (
            <Col>
              <div className="text-center py-5 text-muted">
                <p>No login screen images found.</p>
                <Button 
                  variant="primary" 
                  onClick={() => setShowUploadModal(true)}
                >
                  <FaUpload className="me-1" /> Upload Your First Image
                </Button>
              </div>
            </Col>
          )}
        </Row>
      </Card.Body>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Login Screen Image</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Recommended size: 1920x1080px, JPG or PNG format
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isUploading || !formData.name || !formData.image}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default LoginScreenManager;
