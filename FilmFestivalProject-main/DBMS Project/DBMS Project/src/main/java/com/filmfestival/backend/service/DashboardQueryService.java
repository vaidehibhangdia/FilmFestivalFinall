package com.filmfestival.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DashboardQueryService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> getFilmsWithRatings() {
        String sql = "SELECT f.*, " +
                     "avg_eval.avg_score as avg_score, " +
                     "COALESCE(avg_eval.eval_count, 0) as evaluation_count " +
                     "FROM film f " +
                     "LEFT JOIN ( " +
                     "    SELECT film_id, AVG(score) as avg_score, COUNT(*) as eval_count " +
                     "    FROM evaluation " +
                     "    GROUP BY film_id " +
                     ") avg_eval ON f.film_id = avg_eval.film_id " +
                     "ORDER BY f.title ASC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllTickets() {
        String sql = "SELECT t.ticket_id, t.screening_id, t.attendee_id, t.seat_number, t.booking_time, " +
                     "s.screening_date, s.start_time, s.ticket_price, a.name AS attendee_name " +
                     "FROM ticket t " +
                     "LEFT JOIN screening s ON t.screening_id = s.screening_id " +
                     "LEFT JOIN attendee a ON t.attendee_id = a.attendee_id " +
                     "ORDER BY t.booking_time DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllScreenings() {
        String sql = "SELECT s.*, f.title as film_title, v.name as venue_name, " +
                     "(SELECT COUNT(*) FROM ticket t WHERE t.screening_id = s.screening_id) as ticket_count " +
                     "FROM screening s " +
                     "LEFT JOIN film f ON s.film_id = f.film_id " +
                     "LEFT JOIN venue v ON s.venue_id = v.venue_id " +
                     "ORDER BY s.screening_date DESC, s.start_time DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllAttendees() {
        String sql = "SELECT a.*, " +
                     "(SELECT COUNT(*) FROM ticket t WHERE t.attendee_id = a.attendee_id) as total_bookings " +
                     "FROM attendee a " +
                     "ORDER BY a.name ASC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getJuryAssignments() {
        String sql = "SELECT ja.id, ja.jury_id, ja.film_id, ja.assigned_at, " +
                     "f.title AS film_title, u.name AS jury_name " +
                     "FROM jury_assignment ja " +
                     "LEFT JOIN jury j ON ja.jury_id = j.jury_id " +
                     "LEFT JOIN users u ON j.user_id = u.user_id " +
                     "LEFT JOIN film f ON ja.film_id = f.film_id " +
                     "ORDER BY ja.assigned_at DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAwardEligibleFilms() {
        // Movies with high jury ratings or already assigned awards
        String sql = "SELECT f.*, " +
                     "COALESCE(avg_eval.avg_score, f.rating) as avg_score, " +
                     "COALESCE(avg_eval.eval_count, 0) as evaluation_count, " +
                     "a.award_name " +
                     "FROM film f " +
                     "LEFT JOIN ( " +
                     "    SELECT film_id, AVG(score) as avg_score, COUNT(*) as eval_count " +
                     "    FROM evaluation " +
                     "    GROUP BY film_id " +
                     ") avg_eval ON f.film_id = avg_eval.film_id " +
                     "LEFT JOIN award a ON f.film_id = a.film_id " +
                     "ORDER BY avg_score DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllAwards() {
        String sql = "SELECT * FROM award ORDER BY award_name ASC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllJuries() {
        String sql = "SELECT j.jury_id, u.user_id, u.name, u.email " +
                     "FROM jury j " +
                     "JOIN users u ON j.user_id = u.user_id " +
                     "WHERE u.role = 'JURY' AND u.is_active = 1";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAllFilmCrew() {
        String sql = "SELECT fc.id as id, fc.film_id, fc.crew_id, fc.role, fc.name, " +
                     "f.title as film_title, " +
                     "COALESCE(fc.name, c.name, 'Unknown') as crew_name " +
                     "FROM film_crew fc " +
                     "LEFT JOIN film f ON fc.film_id = f.film_id " +
                     "LEFT JOIN crew c ON fc.crew_id = c.crew_id " +
                     "ORDER BY f.title ASC";
        return jdbcTemplate.queryForList(sql);
    }
    public List<Map<String, Object>> getAssignedFilmsForJury(Integer juryId) {
        String sql = "SELECT ja.id, ja.jury_id, ja.film_id, ja.assigned_at, " +
                     "f.title, f.director, f.genre " +
                     "FROM jury_assignment ja " +
                     "JOIN film f ON ja.film_id = f.film_id " +
                     "WHERE ja.jury_id = ? " +
                     "ORDER BY ja.assigned_at DESC";
        return jdbcTemplate.queryForList(sql, juryId);
    }

    public List<Map<String, Object>> getEvaluationsForJury(Integer juryId) {
        String sql = "SELECT e.*, f.title AS film_title " +
                     "FROM evaluation e " +
                     "JOIN film f ON e.film_id = f.film_id " +
                     "WHERE e.jury_id = ? " +
                     "ORDER BY e.created_at DESC";
        return jdbcTemplate.queryForList(sql, juryId);
    }
    public List<Map<String, Object>> getScreeningsByFilmId(Integer filmId) {
        String sql = "SELECT s.*, f.title as film_title, v.name as venue_name, v.capacity " +
                     "FROM screening s " +
                     "LEFT JOIN film f ON s.film_id = f.film_id " +
                     "LEFT JOIN venue v ON s.venue_id = v.venue_id " +
                     "WHERE s.film_id = ? " +
                     "ORDER BY s.screening_date ASC, s.start_time ASC";
        return jdbcTemplate.queryForList(sql, filmId);
    }

    public List<String> getOccupiedSeats(Integer screeningId) {
        String sql = "SELECT seat_number FROM ticket WHERE screening_id = ?";
        return jdbcTemplate.queryForList(sql, String.class, screeningId);
    }

    public List<Map<String, Object>> getBookingsForUser(Integer userId) {
        String sql = "SELECT t.ticket_id, t.screening_id, t.seat_number, t.booking_time, " +
                     "s.screening_date, s.start_time, s.ticket_price, " +
                     "f.title AS film_title, v.name AS venue_name " +
                     "FROM ticket t " +
                     "JOIN screening s ON t.screening_id = s.screening_id " +
                     "JOIN film f ON s.film_id = f.film_id " +
                     "JOIN venue v ON s.venue_id = v.venue_id " +
                     "WHERE t.user_id = ? " +
                     "ORDER BY t.booking_time DESC";
        return jdbcTemplate.queryForList(sql, userId);
    }
}
