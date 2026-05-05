import React, { useEffect, useState } from 'react';
import { getFilmCrew, createFilmCrew, updateFilmCrew, deleteFilmCrew, getFilms } from '../api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, useModal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

function FilmCrew() {
  const [crew, setCrew] = useState([]);
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const formModal = useModal();
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({ 
    crew_id: '', 
    film_id: '', 
    name: '', 
    role: '' 
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [crewData, filmsData] = await Promise.all([
        getFilmCrew(),
        getFilms()
      ]);
      setCrew(Array.isArray(crewData) ? crewData.map(item => ({ 
        ...item, 
        id: item.id || item.ID 
      })) : []);
      setFilms(Array.isArray(filmsData) ? filmsData : []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCrew = crew.filter(member =>
    (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.role?.trim()) newErrors.role = 'Role is required';
    if (!formData.film_id) newErrors.film_id = 'Select a film';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingMember) {
        await updateFilmCrew(editingMember.id, formData);
        showToast('Crew member updated successfully', 'success');
      } else {
        const payload = { ...formData };
        if (!payload.crew_id) delete payload.crew_id;
        await createFilmCrew(payload);
        showToast('Crew member added successfully', 'success');
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      showToast(error.message || 'Failed to save crew member', 'error');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      crew_id: member.id || member.ID,
      name: member.name || '',
      role: member.role || '',
      film_id: member.film_id || '',
    });
    formModal.open();
  };

  const handleDelete = async (id) => {
    console.log('Deleting crew with ID:', id);
    if (!id) {
      showToast('Invalid crew ID', 'error');
      return;
    }
    if (!window.confirm('Delete this crew member?')) return;
    try {
      await deleteFilmCrew(id);
      showToast('Crew member deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to delete crew member', 'error');
    }
  };

  const handleCloseModal = () => {
    formModal.close();
    setEditingMember(null);
    setFormData({ crew_id: '', film_id: '', name: '', phone_no: '', role: '' });
    setErrors({});
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setFormData({ crew_id: '', film_id: '', name: '', phone_no: '', role: '' });
    formModal.open();
  };

  return (
    <div className="page-films">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">🎭</span>
            Film Crew
          </h1>
          <p className="page-subtitle">Manage film cast and crew members</p>
        </div>
      </div>

      <div className="page-content">
        <div className="page-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <input 
                type="text"
                className="search-input"
                placeholder="🔍 Search crew..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Add Member
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredCrew.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎭</div>
            <h3>No crew members found</h3>
            <Button variant="primary" onClick={handleAddNew}>Add Member</Button>
          </div>
        ) : (
          <div className="films-grid">
            {filteredCrew.map(member => {
              const film = films.find(f => Number(f.film_id) === Number(member.film_id));
              return (
                <Card key={member.id} hoverable className="film-card">
                  <div className="film-poster">🎭</div>
                  <CardBody>
                    <h3 className="film-title">{member.name}</h3>
                    <div className="film-meta">
                      <div className="meta-item">
                        <span className="label">Role</span>
                        <span className="badge">{member.role}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Film</span>
                        <span className="value" style={{fontSize: '12px'}}>{film?.title || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="film-actions">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(member)} icon="✏️">Edit</Button>
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                      >
                        <span className="btn-icon">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={formModal.isOpen}
        onClose={handleCloseModal}
        title={editingMember ? '✏️ Edit Member' : '➕ Add Member'}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingMember ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            error={errors.name}
            required
          />
          <Input
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            error={errors.role}
            required
          />
          <Select
            label="Associated Film"
            value={formData.film_id}
            onChange={(e) => setFormData({...formData, film_id: e.target.value})}
            error={errors.film_id}
            options={[
              { value: '', label: '-- Select Film --' },
              ...films.map(f => ({ value: f.film_id, label: f.title }))
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}

export default FilmCrew;