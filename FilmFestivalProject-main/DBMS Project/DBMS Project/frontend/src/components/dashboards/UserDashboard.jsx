import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './dashboards.css';

export const UserDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [films, setFilms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('films');
  
  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingStatus, setBookingStatus] = useState({ loading: false, error: '', success: false });

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const filmsRes = await fetch('http://localhost:8080/api/public/films', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (filmsRes.ok) {
        const data = await filmsRes.json();
        console.log('[Dashboard Data] Films:', data);
        setFilms(data);
      }

      const bookingsRes = await fetch('http://localhost:8080/api/user/my-bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (bookingsRes.ok) setBookings(await bookingsRes.json());

      const lbRes = await fetch('http://localhost:8080/api/public/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        console.log('[Dashboard Data] Leaderboard:', lbData);
        setLeaderboard(lbData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = async (film) => {
    setSelectedFilm(film);
    setShowBookingModal(true);
    setBookingStatus({ loading: true, error: '', success: false });
    setScreenings([]);
    setSelectedScreening(null);
    setOccupiedSeats([]);
    setSelectedSeats([]);
    
    try {
      // FIX: Use public screenings endpoint with film_id
      const res = await fetch(`http://localhost:8080/api/public/screenings?film_id=${film.film_id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScreenings(data);
      }
    } catch (err) {
      setBookingStatus(prev => ({ ...prev, error: 'Failed to load screenings' }));
    } finally {
      setBookingStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSelectScreening = async (screening) => {
    setSelectedScreening(screening);
    setSelectedSeats([]);
    setBookingStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`http://localhost:8080/api/user/occupied-seats?screening_id=${screening.screening_id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setOccupiedSeats(await res.json());
      }
    } catch (err) {
      console.error('Failed to load occupied seats');
    } finally {
      setBookingStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleSeatSelection = (seatId) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleBookTicket = async (e) => {
    e.preventDefault();
    if (!selectedScreening || selectedSeats.length === 0) return;

    setBookingStatus({ loading: true, error: '', success: false });
    try {
      const res = await fetch('http://localhost:8080/api/user/book-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          screening_id: selectedScreening.screening_id,
          seat_numbers: selectedSeats
        })
      });

      if (res.ok) {
        setBookingStatus({ loading: false, error: '', success: true });
        loadDashboardData(); // Refresh bookings
        setTimeout(() => {
          setShowBookingModal(false);
          setSelectedScreening(null);
          setSelectedSeats([]);
        }, 2000);
      } else {
        const err = await res.json();
        setBookingStatus({ loading: false, error: err.error || 'Booking failed', success: false });
      }
    } catch (err) {
      setBookingStatus({ loading: false, error: 'Network error', success: false });
    }
  };

  const renderSeatMap = () => {
    if (!selectedScreening) return null;
    
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8];
    const totalPrice = selectedSeats.length * selectedScreening.ticket_price;
    
    return (
      <div className="seat-map-container">
        <div className="screen-visual"></div>
        <div className="seat-grid">
          {rows.map(row => (
            <div key={row} className="seat-row">
              <span className="row-label">{row}</span>
              {cols.map(col => {
                const seatId = `${row}${col}`;
                const isOccupied = occupiedSeats.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);
                
                return (
                  <div 
                    key={seatId} 
                    className={`seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isOccupied && toggleSeatSelection(seatId)}
                    title={isOccupied ? 'Occupied' : `Seat ${seatId}`}
                  >
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-box available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-box occupied"></div>
            <span>Occupied</span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <div className="selected-seat-info-premium">
            <div className="info-row">
              <span>Selected Seats: </span>
              <strong>{selectedSeats.join(', ')}</strong>
            </div>
            <div className="info-row">
              <span>Quantity: </span>
              <strong>{selectedSeats.length}</strong>
            </div>
            <div className="info-total">
              <span>Total Price: </span>
              <strong>₹{totalPrice}</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Loading your festival experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'films' ? 'active' : ''}`}
            onClick={() => setActiveTab('films')}
          >
            <i className="fas fa-film me-2"></i>Browse Films ({films.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="fas fa-ticket-alt me-2"></i>My Bookings ({bookings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <i className="fas fa-trophy me-2"></i>Leaderboard
          </button>
        </div>

        {activeTab === 'films' && (
          <div className="dashboard-content fade-in">
            <div className="section-header">
              <h2>Available Films</h2>
              <p>Select a film to view screenings and book tickets</p>
            </div>
            
            {films.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-film fa-3x"></i>
                <p>No films are currently scheduled for the festival.</p>
              </div>
            ) : (
              <div className="films-grid">
                {films.map((film) => (
                  <div key={film.film_id} className="film-card-premium">
                    <div className="film-card-body">
                      <h3>{film.title}</h3>
                      <div className="film-meta">
                        <span><i className="fas fa-globe me-1"></i>{film.language}</span>
                        <span><i className="fas fa-clock me-1"></i>{film.runtime}m</span>
                        <span className="genre-tag">{film.genre}</span>
                      </div>
                      {(() => {
                        const score = film.avg_score ?? film.AVG_SCORE;
                        const count = film.evaluation_count ?? film.EVALUATION_COUNT;
                        return score ? (
                          <div className="film-rating">
                            <span className="stars">★★★★★</span>
                            <span className="score">{Number(score).toFixed(1)}</span>
                            <span className="count">({count})</span>
                          </div>
                        ) : (
                          <div className="film-rating no-rating">Not yet rated</div>
                        );
                      })()}
                      <button className="book-btn-premium" onClick={() => handleOpenBooking(film)}>
                        <i className="fas fa-calendar-plus me-2"></i>Book Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="dashboard-content fade-in">
            <div className="section-header">
              <h2>My Tickets</h2>
              <p>All your upcoming festival bookings</p>
            </div>
            
            {bookings.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-ticket-alt fa-3x"></i>
                <p>You haven't booked any tickets yet. Browse films to get started!</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map((booking) => (
                  <div key={booking.ticket_id} className="ticket-item-premium">
                    <div className="ticket-left">
                      <div className="ticket-circle"></div>
                    </div>
                    <div className="ticket-main">
                      <h4>{booking.film_title}</h4>
                      <div className="ticket-details">
                        <div><i className="fas fa-calendar me-2"></i>{new Date(booking.screening_date).toLocaleDateString()}</div>
                        <div><i className="fas fa-chair me-2"></i>Seat: {booking.seat_number}</div>
                        <div><i className="fas fa-map-marker-alt me-2"></i>{booking.venue_name}</div>
                      </div>
                    </div>
                    <div className="ticket-right">
                      <div className="ticket-price">₹{booking.total_price?.toFixed(0) || booking.ticket_price}</div>
                      <div className="ticket-id">#{booking.ticket_id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="dashboard-content fade-in">
            <div className="section-header">
              <h2>Festival Leaderboard</h2>
              <p>Top-rated films according to our expert jury</p>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-award fa-3x"></i>
                <p>No ratings have been submitted yet.</p>
              </div>
            ) : (
              <div className="leaderboard-container-premium">
                {leaderboard.map((film, index) => (
                  <div key={film.film_id} className={`leaderboard-item-premium rank-${index + 1}`}>
                    <div className="rank-badge">{index + 1}</div>
                    <div className="film-info">
                      <h4>{film.title}</h4>
                      <div className="film-meta-small">
                        <span>{film.genre}</span> • <span>{film.language}</span>
                      </div>
                    </div>
                    <div className="rating-stats">
                      <div className="avg-score">
                        <span className="score-val">{Number(film.avg_score || film.rating).toFixed(1)}</span>
                        <span className="score-max">/10</span>
                      </div>
                      <div className="eval-count">
                        <i className="fas fa-user-edit me-1"></i>
                        {film.evaluation_count} jury reviews
                      </div>
                    </div>
                    {film.award_name && (
                      <div className="award-badge-mini">
                        <i className="fas fa-medal me-1"></i>
                        {film.award_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="modal-overlay">
            <div className="modal-content-premium">
              <div className="modal-header">
                <h3>Book Ticket: {selectedFilm?.title}</h3>
                <button className="close-btn" onClick={() => setShowBookingModal(false)}>&times;</button>
              </div>
              <div className="booking-form">
                {bookingStatus.error && <div className="alert alert-danger">{bookingStatus.error}</div>}
                {bookingStatus.success && <div className="alert alert-success">Booking Successful! Redirecting...</div>}
                
                <div className="form-group">
                  <label>1. Select Screening</label>
                  {bookingStatus.loading && !screenings.length ? (
                    <p>Loading screenings...</p>
                  ) : screenings.length === 0 ? (
                    <p className="text-danger">No screenings available for this film.</p>
                  ) : (
                    <div className="screening-selector">
                      {screenings.map(s => (
                        <div 
                          key={s.screening_id} 
                          className={`screening-opt ${selectedScreening?.screening_id === s.screening_id ? 'active' : ''}`}
                          onClick={() => handleSelectScreening(s)}
                        >
                          <div className="date">{new Date(s.screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                          <div className="time">{s.start_time.substring(0, 5)}</div>
                          <div className="venue">{s.venue_name}</div>
                          <div className="price">₹{s.ticket_price}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedScreening && (
                  <div className="form-group">
                    <label>2. Choose Your Seat</label>
                    {renderSeatMap()}
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowBookingModal(false)}>Cancel</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleBookTicket}
                    disabled={!selectedScreening || selectedSeats.length === 0 || bookingStatus.loading || bookingStatus.success}
                  >
                    {bookingStatus.loading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
