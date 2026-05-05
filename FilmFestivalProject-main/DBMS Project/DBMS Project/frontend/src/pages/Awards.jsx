import React, { useEffect, useState } from 'react';
import './Awards.css';
import { getAwards, createAward, deleteAward, getFilms, getFilmCrew, getAwardEligibleFilms } from '../api';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { useModal, Modal } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';

function Awards() {
  const [awards, setAwards] = useState([]);
  const [films, setFilms] = useState([]);
  const [crewList, setCrewList] = useState([]);
  const [eligibleFilms, setEligibleFilms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const formModal = useModal();

  const emptyForm = {
    award_id: '',
    award_name: '',
    film_id: '',
    crew_id: '',
    award_type: 'film',
    year: new Date().getFullYear(),
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [awardsData, filmsData, crewData, eligibleData] = await Promise.all([
        getAwards(),
        getFilms(),
        getFilmCrew(),
        getAwardEligibleFilms()
      ]);
      setAwards(Array.isArray(awardsData) ? awardsData.map(a => ({ ...a, id: a.award_id })) : []);
      setFilms(Array.isArray(filmsData) ? filmsData : []);
      setCrewList(Array.isArray(crewData) ? crewData : []);
      setEligibleFilms(Array.isArray(eligibleData) ? eligibleData : []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAwards = awards.filter(award =>
    (award.award_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(award.year).includes(searchTerm)
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.award_name?.trim()) newErrors.award_name = 'Award name is required';
    const yr = Number(formData.year);
    if (!formData.year || isNaN(yr) || yr < 1900 || yr > 2100) newErrors.year = 'Invalid year';
    if (formData.award_type === 'film' && !formData.film_id) newErrors.film_id = 'Select a film';
    if (formData.award_type === 'crew' && !formData.crew_id) newErrors.crew_id = 'Select a crew member';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        award_name: formData.award_name.trim(),
        year: Number(formData.year),
      };
      if (formData.award_type === 'film') payload.film_id = Number(formData.film_id);
      else payload.crew_id = Number(formData.crew_id);

      if (formData.award_id) {
        await updateAward(formData.award_id, payload);
        showToast('Award updated successfully', 'success');
      } else {
        await createAward(payload);
        showToast('Award declared successfully', 'success');
      }
      await loadData();
      formModal.close();
    } catch (error) {
      showToast(error.message || 'Failed to save award', 'error');
    }
  };

  const handleEdit = (award) => {
    setFormData({
      award_id: award.id,
      award_name: award.award_name,
      film_id: award.film_id || '',
      crew_id: award.crew_id || '',
      award_type: award.film_id ? 'film' : 'crew',
      year: award.year,
    });
    setErrors({});
    formModal.open();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this award?')) return;
    try {
      await deleteAward(id);
      showToast('Award deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to delete award', 'error');
    }
  };

  const handleAddNew = () => {
    setFormData(emptyForm);
    setErrors({});
    formModal.open();
  };

  const handleDeclareFromSuggestion = (film) => {
    setFormData({
      ...emptyForm,
      award_name: `Best Film - ${film.title}`,
      film_id: film.film_id,
      award_type: 'film'
    });
    setErrors({});
    formModal.open();
  };

  return (
    <div className="page-films">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">🏆</span>
            Awards & Recognitions
          </h1>
          <p className="page-subtitle">Declare awards based on jury evaluations</p>
        </div>
      </div>

      <div className="page-content">
        {/* SUGGESTIONS SECTION */}
        {eligibleFilms.length > 0 && (
          <div className="page-section">
            <h2 className="section-title">✨ Award Suggestions</h2>
            <div className="films-grid">
              {eligibleFilms.slice(0, 3).map(film => (
                <Card key={film.film_id} className="film-card highlight">
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="film-title">{film.title}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{film.genre}</p>
                      </div>
                      <div className="badge accent">{(film.avg_score || film.rating || 0).toFixed(1)} / 10</div>
                    </div>
                    <p style={{ fontSize: '13px', margin: '12px 0', color: 'var(--text-secondary)' }}>
                      Highly rated {film.evaluation_count > 0 ? `by ${film.evaluation_count} jury members` : '(System Rating)'}.
                    </p>
                    <Button variant="primary" size="sm" fullWidth onClick={() => handleDeclareFromSuggestion(film)}>
                      Declare Award
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="page-toolbar" style={{ marginTop: '40px' }}>
          <div className="toolbar-left">
            <h2 className="section-title" style={{ margin: 0 }}>📋 Declared Awards</h2>
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search awards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Declare Manually
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>No awards declared yet</h3>
            <Button variant="primary" onClick={handleAddNew}>Declare Award</Button>
          </div>
        ) : (
          <div className="films-grid">
            {filteredAwards.map(award => {
              const film = films.find(f => Number(f.film_id) === Number(award.film_id));
              const crew = crewList.find(c => Number(c.crew_id) === Number(award.crew_id));
              return (
                <Card key={award.id} hoverable className="film-card">
                  <div className="film-poster">🏆</div>
                  <CardBody>
                    <h3 className="film-title">{award.award_name}</h3>
                    <div className="film-meta">
                      <div className="meta-item">
                        <span className="label">Year</span>
                        <span className="value">{award.year}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Winner</span>
                        <span className="value" style={{ fontSize: '12px' }}>
                          {film ? `🎬 ${film.title}` : crew ? `🎭 ${crew.name}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="film-actions">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(award)} icon="✏️">Edit</Button>
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(award.id); }}
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
        onClose={formModal.close}
        title={formData.award_id ? "✏️ Edit Award" : "🏆 Declare New Award"}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={formModal.close}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{formData.award_id ? 'Update Award' : 'Declare Award'}</Button>
          </div>
        }
      >
        <div className="form-grid">
          <Input
            label="Award Name"
            value={formData.award_name}
            onChange={e => setFormData({ ...formData, award_name: e.target.value })}
            error={errors.award_name}
            placeholder="e.g. Best Picture, Best Actor"
            required
          />
          <div className="form-group">
            <label>Award Recipient Type</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="award_type"
                  checked={formData.award_type === 'film'}
                  onChange={() => setFormData({ ...formData, award_type: 'film', crew_id: '' })}
                /> Film
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="award_type"
                  checked={formData.award_type === 'crew'}
                  onChange={() => setFormData({ ...formData, award_type: 'crew', film_id: '' })}
                /> Crew Member
              </label>
            </div>
          </div>

          {formData.award_type === 'film' ? (
            <Select
              label="Select Film"
              value={formData.film_id}
              onChange={e => setFormData({ ...formData, film_id: e.target.value })}
              error={errors.film_id}
              options={[
                { value: '', label: '-- Select Film --' },
                ...films.map(f => ({ value: f.film_id, label: f.title }))
              ]}
            />
          ) : (
            <Select
              label="Select Crew Member"
              value={formData.crew_id}
              onChange={e => setFormData({ ...formData, crew_id: e.target.value })}
              error={errors.crew_id}
              options={[
                { value: '', label: '-- Select Crew --' },
                ...crewList.map(c => ({ value: c.crew_id, label: c.name }))
              ]}
            />
          )}

          <Input
            label="Year"
            type="number"
            value={formData.year}
            onChange={e => setFormData({ ...formData, year: e.target.value })}
            error={errors.year}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

export default Awards;
