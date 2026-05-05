import React, { useEffect, useState } from 'react';
import { getAttendees, createAttendee, updateAttendee, deleteAttendee } from '../api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, useModal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

function Attendees() {
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const formModal = useModal();
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [formData, setFormData] = useState({ 
    attendee_id: '', 
    name: '', 
    email: '', 
    phone: '' 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAttendees();
  }, []);

  const loadAttendees = async () => {
    setLoading(true);
    try {
      const data = await getAttendees();
      setAttendees(Array.isArray(data) ? data.map(a => ({ ...a, id: a.attendee_id })) : []);
    } catch (error) {
      showToast('Failed to load attendees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendees = attendees.filter(attendee =>
    (attendee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendee.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (formData.attendee_id && Number(formData.attendee_id) <= 0) newErrors.attendee_id = 'ID must be positive';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingAttendee) {
        await updateAttendee(editingAttendee.id, formData);
        showToast('Attendee updated successfully', 'success');
      } else {
        const payload = { ...formData };
        if (!payload.attendee_id) delete payload.attendee_id;
        await createAttendee(payload);
        showToast('Attendee created successfully', 'success');
      }
      await loadAttendees();
      handleCloseModal();
    } catch (error) {
      showToast(error.message || 'Failed to save attendee', 'error');
    }
  };

  const handleEdit = (attendee) => {
    setEditingAttendee(attendee);
    setFormData({
      attendee_id: attendee.id,
      name: attendee.name || '',
      email: attendee.email || '',
      phone: attendee.phone || '',
    });
    formModal.open();
  };

  const handleDelete = async (id) => {
    console.log('Deleting attendee with ID:', id);
    if (!id) {
      showToast('Invalid attendee ID', 'error');
      return;
    }
    if (!window.confirm('Delete this attendee?')) return;
    try {
      await deleteAttendee(id);
      showToast('Attendee deleted successfully', 'success');
      await loadAttendees();
    } catch (error) {
      showToast(error.message || 'Failed to delete attendee', 'error');
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setEditingAttendee(null);
    setFormData({ attendee_id: '', name: '', email: '', phone: '' });
    setErrors({});
  };

  const handleAddNew = () => {
    setEditingAttendee(null);
    setFormData({ attendee_id: '', name: '', email: '', phone: '' });
    formModal.open();
  };

  return (
    <div className="page-films"> {/* Reusing page class for consistency */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">👥</span>
            Attendees
          </h1>
          <p className="page-subtitle">Manage festival participants</p>
        </div>
      </div>

      <div className="page-content">
        <div className="page-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Add Attendee
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No attendees found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'Add your first attendee to get started'}</p>
            <Button variant="primary" onClick={handleAddNew}>Add Attendee</Button>
          </div>
        ) : (
          <div className="films-grid">
            {filteredAttendees.map(attendee => (
              <Card key={attendee.id} hoverable className="film-card">
                <div className="film-poster">👤</div>
                <CardBody>
                  <h3 className="film-title">{attendee.name}</h3>
                  <div className="film-meta">
                    <div className="meta-item">
                      <span className="label">Email</span>
                      <span className="value" style={{fontSize: '12px'}}>{attendee.email}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Phone</span>
                      <span className="value">{attendee.phone}</span>
                    </div>
                  </div>
                  <div className="film-actions">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(attendee)} icon="✏️">Edit</Button>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative', zIndex: 9999 }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alert('DEBUG: Delete clicked for ' + attendee.name);
                        handleDelete(attendee.id); 
                      }}
                    >
                      <span className="btn-icon">🗑️</span>
                      Delete
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={formModal.isOpen}
        onClose={handleCloseModal}
        title={editingAttendee ? '✏️ Edit Attendee' : '➕ Add Attendee'}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingAttendee ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Attendee ID (optional)"
            type="number"
            value={formData.attendee_id}
            onChange={(e) => setFormData({...formData, attendee_id: e.target.value})}
            disabled={Boolean(editingAttendee)}
            error={errors.attendee_id}
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            error={errors.phone}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export default Attendees;