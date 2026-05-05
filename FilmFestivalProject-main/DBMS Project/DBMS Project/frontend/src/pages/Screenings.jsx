import React, { useEffect, useState } from 'react';
import { getScreenings, createScreening, updateScreening, deleteScreening, getFilms, getVenues } from '../api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, useModal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

function Screenings() {
  const [screenings, setScreenings] = useState([]);
  const [films, setFilms] = useState([]);
  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const formModal = useModal();
  const [editingScreening, setEditingScreening] = useState(null);
  const [formData, setFormData] = useState({ 
    screening_id: '', 
    film_id: '', 
    venue_id: '', 
    screening_date: '', 
    start_time: '', 
    end_time: '', 
    ticket_price: '' 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [screeningsData, filmsData, venuesData] = await Promise.all([
        getScreenings(),
        getFilms(),
        getVenues()
      ]);
      setScreenings(Array.isArray(screeningsData) ? screeningsData.map(s => ({ ...s, id: s.screening_id })) : []);
      setFilms(Array.isArray(filmsData) ? filmsData : []);
      setVenues(Array.isArray(venuesData) ? venuesData : []);
    } catch (error) {
      showToast('Failed to load screenings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredScreenings = screenings.filter(screening =>
    (screening.film_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (screening.venue_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (screening.screening_date || '').includes(searchTerm)
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.film_id) newErrors.film_id = 'Select a film';
    if (!formData.venue_id) newErrors.venue_id = 'Select a venue';
    if (!formData.screening_date) newErrors.screening_date = 'Date is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    if (!formData.ticket_price || Number(formData.ticket_price) <= 0) newErrors.ticket_price = 'Price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      film_id: Number(formData.film_id),
      venue_id: Number(formData.venue_id),
      screening_date: formData.screening_date,
      start_time: formData.start_time.length === 5 ? formData.start_time + ':00' : formData.start_time,
      end_time: formData.end_time.length === 5 ? formData.end_time + ':00' : formData.end_time,
      ticket_price: Number(formData.ticket_price),
    };
    if (formData.screening_id) payload.screening_id = Number(formData.screening_id);

    try {
      if (editingScreening) {
        await updateScreening(editingScreening.id, payload);
        showToast('Screening updated successfully', 'success');
      } else {
        await createScreening(payload);
        showToast('Screening created successfully', 'success');
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      showToast(error.message || 'Failed to save screening', 'error');
    }
  };

  const handleEdit = (screening) => {
    setEditingScreening(screening);
    setFormData({ 
      screening_id: screening.id, 
      film_id: screening.film_id, 
      venue_id: screening.venue_id, 
      screening_date: screening.screening_date,
      start_time: screening.start_time,
      end_time: screening.end_time,
      ticket_price: screening.ticket_price
    });
    formModal.open();
  };

  const handleDelete = async (id) => {
    console.log('Deleting screening with ID:', id);
    if (!id) {
      showToast('Invalid screening ID', 'error');
      return;
    }
    if (!window.confirm('Delete this screening?')) return;
    try {
      await deleteScreening(id);
      showToast('Screening deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to delete screening', 'error');
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setEditingScreening(null);
    setFormData({ screening_id: '', film_id: '', venue_id: '', screening_date: '', start_time: '', end_time: '', ticket_price: '' });
    setErrors({});
  };

  const handleAddNew = () => {
    setEditingScreening(null);
    setFormData({ screening_id: '', film_id: '', venue_id: '', screening_date: '', start_time: '', end_time: '', ticket_price: '' });
    formModal.open();
  };

  return (
    <div className="page-films">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">📽️</span>
            Screenings
          </h1>
          <p className="page-subtitle">Schedule and manage film screenings</p>
        </div>
      </div>

      <div className="page-content">
        <div className="page-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search screenings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Add Screening
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredScreenings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📽️</div>
            <h3>No screenings found</h3>
            <Button variant="primary" onClick={handleAddNew}>Add Screening</Button>
          </div>
        ) : (
          <div className="films-grid">
            {filteredScreenings.map(screening => (
              <Card key={screening.id} hoverable className="film-card">
                <div className="film-poster">📽️</div>
                <CardBody>
                  <h3 className="film-title">{screening.film_title || `Film #${screening.film_id}`}</h3>
                  <div className="film-meta">
                    <div className="meta-item">
                      <span className="label">Venue</span>
                      <span className="value">{screening.venue_name || screening.venue_id}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Date</span>
                      <span className="value">{screening.screening_date}</span>
                    </div>
                  </div>
                  <div className="film-meta">
                    <div className="meta-item">
                      <span className="label">Time</span>
                      <span className="value">{screening.start_time.substring(0, 5)} - {screening.end_time.substring(0, 5)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Price</span>
                      <span className="badge">${screening.ticket_price}</span>
                    </div>
                  </div>
                  <div className="film-actions">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(screening)} icon="✏️">Edit</Button>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(screening.id); }}
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
        title={editingScreening ? '✏️ Edit Screening' : '➕ Add Screening'}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingScreening ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <Select
            label="Select Film"
            value={formData.film_id}
            onChange={(e) => setFormData({...formData, film_id: e.target.value})}
            error={errors.film_id}
            required
            options={[
              { value: '', label: '-- Select Film --' },
              ...films.map(f => ({ value: f.film_id, label: f.title }))
            ]}
          />
          <Select
            label="Select Venue"
            value={formData.venue_id}
            onChange={(e) => setFormData({...formData, venue_id: e.target.value})}
            error={errors.venue_id}
            required
            options={[
              { value: '', label: '-- Select Venue --' },
              ...venues.map(v => ({ value: v.venue_id, label: v.name }))
            ]}
          />
          <Input
            label="Screening Date"
            type="date"
            value={formData.screening_date}
            onChange={(e) => setFormData({...formData, screening_date: e.target.value})}
            error={errors.screening_date}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              error={errors.start_time}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              error={errors.end_time}
              required
            />
          </div>
          <Input
            label="Ticket Price ($)"
            type="number"
            step="0.01"
            value={formData.ticket_price}
            onChange={(e) => setFormData({...formData, ticket_price: e.target.value})}
            error={errors.ticket_price}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export default Screenings;