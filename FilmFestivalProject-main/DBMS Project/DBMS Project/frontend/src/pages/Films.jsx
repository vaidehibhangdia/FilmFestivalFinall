import { useEffect, useState } from 'react';
import { getFilms, createFilm, updateFilm, deleteFilm } from '../api';
import './Films.css';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, useModal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { showToast } from '../components/ui/Toast';

function Films() {
  const [films, setFilms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const formModal = useModal();
  const [editingFilm, setEditingFilm] = useState(null);
  const [formData, setFormData] = useState({ 
    film_id: '', 
    title: '', 
    runtime: '', 
    language: '', 
    genre: '',
    director: '',
    release_year: '',
    country: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadFilms();
    const onSearch = (e) => {
      const q = (e && e.detail) || '';
      setSearchTerm(q || '');
    };
    window.addEventListener('app-search', onSearch);
    return () => window.removeEventListener('app-search', onSearch);
  }, []);

  const loadFilms = async () => {
    try {
      setLoading(true);
      const filmData = await getFilms();
      setFilms(Array.isArray(filmData) ? filmData.map(f => ({ ...f, id: f.film_id })) : []);
    } catch (error) {
      showToast('Failed to load films', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredFilms = films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         film.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || film.genre.toLowerCase() === filterGenre.toLowerCase();
    const matchesLanguage = !filterLanguage || film.language.toLowerCase() === filterLanguage.toLowerCase();
    return matchesSearch && matchesGenre && matchesLanguage;
  });

  const uniqueGenres = [...new Set(films.map(f => f.genre))];
  const uniqueLanguages = [...new Set(films.map(f => f.language))];

  const validateForm = () => {
    const newErrors = {};
    if (formData.film_id && Number(formData.film_id) <= 0) newErrors.film_id = 'ID must be positive';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.language.trim()) newErrors.language = 'Language is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (!formData.runtime || Number(formData.runtime) <= 0) newErrors.runtime = 'Runtime is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: formData.title,
      director: formData.director.trim() || null,
      genre: formData.genre,
      description: formData.description.trim() || null,
      duration_minutes: Number(formData.runtime),
      release_year: formData.release_year ? Number(formData.release_year) : null,
      country: formData.country.trim() || null,
      language: formData.language,
    };
    if (formData.film_id) payload.film_id = Number(formData.film_id);

    try {
      if (editingFilm) {
        const updatePayload = {
          ...payload,
          duration_minutes: Number(formData.runtime),
          release_year: formData.release_year ? Number(formData.release_year) : null,
        };
        await updateFilm(editingFilm.id, updatePayload);
        showToast('Film updated successfully', 'success');
      } else {
        await createFilm(payload);
        showToast('Film created successfully', 'success');
      }
      await loadFilms();
      formModal.close();
      resetForm();
    } catch (error) {
      showToast(error.message || 'Failed to save film', 'error');
    }
  };

  const handleEdit = (film) => {
    setEditingFilm(film);
    setFormData({
      film_id: film.id,
      title: film.title,
      runtime: film.runtime,
      language: film.language,
      genre: film.genre,
      director: film.director || '',
      release_year: film.release_year || '',
      country: film.country || '',
      description: film.description || ''
    });
    formModal.open();
  };

  const handleDelete = async (id) => {
    console.log('Deleting film with ID:', id);
    if (!id) {
      showToast('Invalid film ID', 'error');
      return;
    }
    if (!window.confirm('Delete this film?')) return;
    try {
      await deleteFilm(id);
      showToast('Film deleted successfully', 'success');
      await loadFilms();
    } catch (error) {
      showToast(error.message || 'Failed to delete film', 'error');
    }
  };

  const handleAddNew = () => {
    setEditingFilm(null);
    resetForm();
    formModal.open();
  };

  const resetForm = () => {
    setFormData({
      film_id: '',
      title: '',
      runtime: '',
      language: '',
      genre: '',
      director: '',
      release_year: '',
      country: '',
      description: ''
    });
    setErrors({});
  };

  const handleCloseModal = () => {
    formModal.close();
    resetForm();
  };

  return (
    <div className="page-films">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <span className="page-icon">🎬</span>
            Films Catalog
          </h1>
          <p className="page-subtitle">Manage your film collection</p>
        </div>
      </div>

      <div className="page-content">
        {/* TOOLBAR */}
        <div className="page-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search films..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <button 
              className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button 
              className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ≡
            </button>
            <button 
              className={`view-toggle ${viewMode === 'circular' ? 'active' : ''}`}
              onClick={() => setViewMode('circular')}
              title="Circular view"
            >
              ◎
            </button>
            <button 
              className="btn btn-danger"
              style={{ background: 'red', border: '5px solid yellow', color: 'white', fontWeight: 'bold' }}
              onClick={() => {
                if (filteredFilms.length > 0) {
                  const firstFilm = filteredFilms[0];
                  alert('EMERGENCY: Attempting to delete ' + firstFilm.title);
                  handleDelete(firstFilm.id || firstFilm.film_id);
                } else {
                  alert('No films to delete!');
                }
              }}
            >
              🔥 EMERGENCY: DELETE FIRST
            </button>
            <Button variant="primary" onClick={handleAddNew} icon="➕">
              Add Film
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-section">
          <div className="filter-item">
            <label>Genre</label>
            <select 
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">All Genres</option>
              {uniqueGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>Language</label>
            <select 
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="filter-select"
            >
              <option value="">All Languages</option>
              {uniqueLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          {(filterGenre || filterLanguage || searchTerm) && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchTerm('');
                setFilterGenre('');
                setFilterLanguage('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* RESULTS */}
        {loading ? (
          <div className="loading-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        ) : filteredFilms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No films found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'Add your first film to get started'}</p>
            <Button variant="primary" onClick={handleAddNew}>
              Add Film
            </Button>
          </div>
        ) : (
          <div className={`films-${viewMode}`}>
            {viewMode === 'grid' ? (
              <div className="films-grid">
                {filteredFilms.map(film => (
                  <Card key={film.id} hoverable className="film-card">
                    <div className="film-poster">📽️</div>
                    <CardBody>
                      <h3 className="film-title">{film.title}</h3>
                      <div className="film-meta">
                        <div className="meta-item">
                          <span className="label">ID</span>
                          <span className="value">{film.film_id}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">Genre</span>
                          <span className="badge">{film.genre || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="film-meta">
                        <div className="meta-item">
                          <span className="label">Language</span>
                          <span className="value">{film.language || 'N/A'}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">Runtime</span>
                          <span className="value">{film.runtime || 0} min</span>
                        </div>
                      </div>
                      <div className="film-actions" style={{ position: 'relative', zIndex: 100 }}>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleEdit(film)}
                          icon="✏️"
                        >
                          Edit
                        </Button>
                        <button 
                          className="btn btn-danger btn-sm"
                          style={{ cursor: 'pointer', background: 'red', color: 'white', border: '1px solid white' }}
                          onClick={() => { 
                            alert('Delete clicked for ' + film.title); 
                            handleDelete(film.id || film.film_id); 
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : viewMode === 'circular' ? (
              <div className="films-grid circular" style={{ position: 'relative' }}>
                {filteredFilms.map((film, idx) => {
                  const total = filteredFilms.length || 1;
                  const angle = (idx / total) * Math.PI * 2;
                  const radius = Math.min(260, 120 + total * 6);
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                  return (
                    <div key={film.id} style={{ position: 'absolute', left: '50%', top: '50%', transform }}>
                      <Card hoverable className="film-card" style={{ width: 200 }}>
                        <div className="film-poster">📽️</div>
                        <CardBody>
                          <h3 className="film-title">{film.title}</h3>
                          <div className="film-meta">
                            <div className="meta-item"><span className="label">{film.genre || 'N/A'}</span></div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="films-list">
                {filteredFilms.map(film => (
                  <div key={film.id} className="film-list-item">
                    <div className="list-poster">📽️</div>
                    <div className="list-content">
                      <h4>{film.title}</h4>
                      <div className="list-meta">
                        <span>ID: {film.film_id}</span>
                        <span>Genre: {film.genre || 'N/A'}</span>
                        <span>Language: {film.language || 'N/A'}</span>
                        <span>Runtime: {film.runtime || 0} min</span>
                      </div>
                    </div>
                    <div className="list-actions">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(film)} icon="✏️">Edit</Button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative', zIndex: 9999 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          alert('DEBUG: Delete clicked for ' + film.title); 
                          handleDelete(film.id); 
                        }}
                      >
                        <span className="btn-icon">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={handleCloseModal}
        title={editingFilm ? '✏️ Edit Film' : '🎬 Add Film'}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingFilm ? 'Update' : 'Create'} Film
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            label="Film ID (optional)"
            type="number"
            value={formData.film_id}
            onChange={(e) => setFormData({...formData, film_id: e.target.value})}
            disabled={Boolean(editingFilm)}
            error={errors.film_id}
          />
          <Input
            label="Title"
            type="text"
            placeholder="Enter film title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            error={errors.title}
            required
          />
          <Input
            label="Director"
            type="text"
            placeholder="e.g., Ava Williams"
            value={formData.director}
            onChange={(e) => setFormData({...formData, director: e.target.value})}
          />
          <Input
            label="Language"
            type="text"
            placeholder="e.g., English, Spanish"
            value={formData.language}
            onChange={(e) => setFormData({...formData, language: e.target.value})}
            error={errors.language}
            required
          />
          <Input
            label="Genre"
            type="text"
            placeholder="e.g., Action, Drama"
            value={formData.genre}
            onChange={(e) => setFormData({...formData, genre: e.target.value})}
            error={errors.genre}
            required
          />
          <Input
            label="Runtime (minutes)"
            type="number"
            placeholder="e.g., 120"
            value={formData.runtime}
            onChange={(e) => setFormData({...formData, runtime: e.target.value})}
            error={errors.runtime}
            required
          />
          <Input
            label="Release Year"
            type="number"
            placeholder="e.g., 2025"
            value={formData.release_year}
            onChange={(e) => setFormData({...formData, release_year: e.target.value})}
          />
          <Input
            label="Country"
            type="text"
            placeholder="e.g., USA"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
          />
          <Textarea
            label="Description"
            placeholder="Describe the film..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </form>
      </Modal>
    </div>
  );
}

export default Films;