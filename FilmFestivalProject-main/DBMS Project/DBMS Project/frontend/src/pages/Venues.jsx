import React, { useEffect, useState } from 'react';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, useModal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

function Venues() {
  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const formModal = useModal();
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({ 
    venue_id: '', 
    name: '', 
    location: '', 
    capacity: '' 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await getVenues();
      setVenues(Array.isArray(data) ? data.map(v => ({ ...v, id: v.venue_id })) : []);
    } catch (error) {
      showToast('Failed to load venues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter(venue =>
    (venue.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venue.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (formData.venue_id && Number(formData.venue_id) <= 0) newErrors.venue_id = 'ID must be positive';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.capacity || Number(formData.capacity) <= 0) newErrors.capacity = 'Capacity is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingVenue) {
        const payload = { 
          ...formData,
          capacity: Number(formData.capacity)
        };
        await updateVenue(editingVenue.id, payload);
        showToast('Venue updated successfully', 'success');
      } else {
        const payload = { ...formData };
        if (!payload.venue_id) delete payload.venue_id;
        await createVenue(payload);
        showToast('Venue created successfully', 'success');
      }
      await loadVenues();
      handleCloseModal();
    } catch (error) {
      showToast(error.message || 'Failed to save venue', 'error');
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      venue_id: venue.id,
      name: venue.name || '',
      location: venue.location || '',
      capacity: venue.capacity || '',
    });
    formModal.open();
  };

  const handleDelete = async (id) => {
    console.log('Deleting venue with ID:', id);
    if (!id) {
      showToast('Invalid venue ID', 'error');
      return;
    }
    if (!window.confirm('Delete this venue?')) return;
    try {
      await deleteVenue(id);
      showToast('Venue deleted successfully', 'success');
      await loadVenues();
    } catch (error) {
      showToast(error.message || 'Failed to delete venue', 'error');
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setEditingVenue(null);
    setFormData({ venue_id: '', name: '', location: '', capacity: '' });
    setErrors({});
  };

  const handleAddNew = () => {
    setEditingVenue(null);
    setFormData({ venue_id: '', name: '', location: '', capacity: '' });
    formModal.open();
  };

  return (
    <div className="page-films">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">🎪</span>
            Venues
          </h1>
          <p className="page-subtitle">Manage festival screening locations</p>
        </div>
      </div>

      <div className="page-content">
        <div className="page-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Add Venue
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎪</div>
            <h3>No venues found</h3>
            <Button variant="primary" onClick={handleAddNew}>Add Venue</Button>
          </div>
        ) : (
          <div className="films-grid">
            {filteredVenues.map(venue => (
              <Card key={venue.id} hoverable className="film-card">
                <div className="film-poster">🏛️</div>
                <CardBody>
                  <h3 className="film-title">{venue.name}</h3>
                  <div className="film-meta">
                    <div className="meta-item">
                      <span className="label">Location</span>
                      <span className="value">{venue.location}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Capacity</span>
                      <span className="badge">{venue.capacity} seats</span>
                    </div>
                  </div>
                  <div className="film-actions">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(venue)} icon="✏️">Edit</Button>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative', zIndex: 9999 }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alert('DEBUG: Delete clicked for ' + venue.name);
                        handleDelete(venue.id); 
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
        title={editingVenue ? '✏️ Edit Venue' : '➕ Add Venue'}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingVenue ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Venue ID (optional)"
            type="number"
            value={formData.venue_id}
            onChange={(e) => setFormData({...formData, venue_id: e.target.value})}
            disabled={Boolean(editingVenue)}
            error={errors.venue_id}
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            error={errors.name}
            required
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            error={errors.location}
            required
          />
          <Input
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            error={errors.capacity}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export default Venues;