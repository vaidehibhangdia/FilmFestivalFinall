package com.filmfestival.backend.controller;

import com.filmfestival.backend.service.DashboardQueryService;
import com.filmfestival.backend.model.*;
import com.filmfestival.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.filmfestival.backend.payload.response.MessageResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    @Autowired
    private DashboardQueryService dashboardQueryService;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private AttendeeRepository attendeeRepository;

    @Autowired
    private JuryAssignmentRepository juryAssignmentRepository;

    @Autowired
    private JuryRepository juryRepository;

    @Autowired
    private FilmRepository filmRepository;

    @Autowired
    private AwardRepository awardRepository;

    @Autowired
    private FilmCrewRepository filmCrewRepository;

    // --- Evaluations (for dashboard count) ---
    @GetMapping("/evaluations")
    public List<Evaluation> getAllEvaluations() {
        return evaluationRepository.findAll();
    }

    // --- Films (JPA based) ---
    @GetMapping("/films")
    public List<Film> getAllFilms() {
        return filmRepository.findAll();
    }

    @PostMapping("/films")
    public Film createFilm(@RequestBody Film film) {
        return filmRepository.save(film);
    }

    @PutMapping("/films/{id}")
    public ResponseEntity<Film> updateFilm(@PathVariable Integer id, @RequestBody Film filmDetails) {
        return filmRepository.findById(id)
                .map(film -> {
                    film.setTitle(filmDetails.getTitle());
                    film.setDirector(filmDetails.getDirector());
                    film.setGenre(filmDetails.getGenre());
                    film.setLanguage(filmDetails.getLanguage());
                    film.setDurationMinutes(filmDetails.getDurationMinutes());
                    film.setReleaseYear(filmDetails.getReleaseYear());
                    film.setCountry(filmDetails.getCountry());
                    film.setDescription(filmDetails.getDescription());
                    return ResponseEntity.ok(filmRepository.save(film));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/films/{id}")
    public ResponseEntity<?> deleteFilm(@PathVariable Integer id) {
        System.out.println("DEBUG: Deleting film with ID: " + id);
        return filmRepository.findById(id)
                .map(film -> {
                    filmRepository.delete(film);
                    System.out.println("DEBUG: Film deleted successfully");
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    System.out.println("DEBUG: Film not found for ID: " + id);
                    return ResponseEntity.notFound().build();
                });
    }

    // --- Venues (JPA based) ---
    @GetMapping("/venues")
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    @PostMapping("/venues")
    public Venue createVenue(@RequestBody Venue venue) {
        return venueRepository.save(venue);
    }

    @PutMapping("/venues/{id}")
    public ResponseEntity<Venue> updateVenue(@PathVariable Integer id, @RequestBody Venue venueDetails) {
        return venueRepository.findById(id)
                .map(venue -> {
                    venue.setName(venueDetails.getName());
                    venue.setLocation(venueDetails.getLocation());
                    venue.setCapacity(venueDetails.getCapacity());
                    return ResponseEntity.ok(venueRepository.save(venue));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/venues/{id}")
    public ResponseEntity<?> deleteVenue(@PathVariable Integer id) {
        System.out.println("DEBUG: Deleting venue with ID: " + id);
        return venueRepository.findById(id)
                .map(venue -> {
                    venueRepository.delete(venue);
                    System.out.println("DEBUG: Venue deleted successfully");
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    System.out.println("DEBUG: Venue not found for ID: " + id);
                    return ResponseEntity.notFound().build();
                });
    }

    // --- Complex Queries (JdbcTemplate based) ---
    @GetMapping("/tickets")
    public List<Map<String, Object>> getAllTickets() {
        return dashboardQueryService.getAllTickets();
    }

    @GetMapping("/attendees")
    public List<Map<String, Object>> getAllAttendees() {
        return dashboardQueryService.getAllAttendees();
    }

    @PostMapping("/attendees")
    public Attendee createAttendee(@RequestBody Attendee attendee) {
        return attendeeRepository.save(attendee);
    }

    @PutMapping("/attendees/{id}")
    public ResponseEntity<Attendee> updateAttendee(@PathVariable Integer id, @RequestBody Attendee attendeeDetails) {
        return attendeeRepository.findById(id)
                .map(attendee -> {
                    attendee.setName(attendeeDetails.getName());
                    attendee.setEmail(attendeeDetails.getEmail());
                    attendee.setPhone(attendeeDetails.getPhone());
                    return ResponseEntity.ok(attendeeRepository.save(attendee));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/attendees/{id}")
    public ResponseEntity<?> deleteAttendee(@PathVariable Integer id) {
        System.out.println("DEBUG: Deleting attendee with ID: " + id);
        return attendeeRepository.findById(id)
                .map(attendee -> {
                    attendeeRepository.delete(attendee);
                    System.out.println("DEBUG: Attendee deleted successfully");
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    System.out.println("DEBUG: Attendee not found for ID: " + id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/screenings")
    public List<Map<String, Object>> getAllScreenings() {
        return dashboardQueryService.getAllScreenings();
    }

    @PostMapping("/screenings")
    public Screening createScreening(@RequestBody Screening screening) {
        return screeningRepository.save(screening);
    }

    @PutMapping("/screenings/{id}")
    public ResponseEntity<Screening> updateScreening(@PathVariable Integer id, @RequestBody Screening screeningDetails) {
        return screeningRepository.findById(id)
                .map(screening -> {
                    screening.setFilmId(screeningDetails.getFilmId());
                    screening.setVenueId(screeningDetails.getVenueId());
                    screening.setScreeningDate(screeningDetails.getScreeningDate());
                    screening.setStartTime(screeningDetails.getStartTime());
                    screening.setEndTime(screeningDetails.getEndTime());
                    screening.setTicketPrice(screeningDetails.getTicketPrice());
                    return ResponseEntity.ok(screeningRepository.save(screening));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/screenings/{id}")
    public ResponseEntity<?> deleteScreening(@PathVariable Integer id) {
        return screeningRepository.findById(id)
                .map(screening -> {
                    screeningRepository.delete(screening);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jury-assignments")
    public List<Map<String, Object>> getJuryAssignments() {
        return dashboardQueryService.getJuryAssignments();
    }

    @PostMapping("/assign-jury")
    public ResponseEntity<?> assignJury(@RequestBody Map<String, Object> payload) {
        try {
            Object juryIdObj = payload.get("jury_id");
            Object filmIdsObj = payload.get("film_ids");

            if (juryIdObj == null || filmIdsObj == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("jury_id and film_ids are required"));
            }

            Integer juryId = (juryIdObj instanceof Number) ? ((Number) juryIdObj).intValue() : Integer.parseInt(juryIdObj.toString());
            List<Integer> filmIds;
            
            if (filmIdsObj instanceof List) {
                filmIds = ((List<?>) filmIdsObj).stream()
                        .map(id -> (id instanceof Number) ? ((Number) id).intValue() : Integer.parseInt(id.toString()))
                        .collect(Collectors.toList());
            } else {
                return ResponseEntity.badRequest().body(new MessageResponse("film_ids must be a list"));
            }

            // Check if Jury exists
            if (!juryRepository.existsById(juryId)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Jury member with ID " + juryId + " does not exist. Please check the Jury ID."));
            }

            for (Integer filmId : filmIds) {
                if (!filmRepository.existsById(filmId)) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Film with ID " + filmId + " does not exist."));
                }
                
                JuryAssignment assignment = new JuryAssignment();
                assignment.setJuryId(juryId);
                assignment.setFilmId(filmId);
                juryAssignmentRepository.save(assignment);
            }

            return ResponseEntity.ok(new MessageResponse("Jury assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Database Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/jury-assignments/{id}")
    public ResponseEntity<?> deleteJuryAssignment(@PathVariable Integer id) {
        return juryAssignmentRepository.findById(id)
                .map(assignment -> {
                    juryAssignmentRepository.delete(assignment);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/award-eligible")
    public List<Map<String, Object>> getAwardEligibleFilms() {
        return dashboardQueryService.getAwardEligibleFilms();
    }

    @GetMapping("/awards")
    public List<Map<String, Object>> getAllAwards() {
        return dashboardQueryService.getAllAwards();
    }

    @PostMapping("/awards")
    public Award createAward(@RequestBody Award award) {
        return awardRepository.save(award);
    }

    @DeleteMapping("/awards/{id}")
    public ResponseEntity<?> deleteAward(@PathVariable Integer id) {
        return awardRepository.findById(id)
                .map(award -> {
                    awardRepository.delete(award);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/awards/{id}")
    public ResponseEntity<Award> updateAward(@PathVariable Integer id, @RequestBody Award awardDetails) {
        return awardRepository.findById(id)
                .map(award -> {
                    award.setAwardName(awardDetails.getAwardName());
                    award.setCategory(awardDetails.getCategory());
                    award.setYear(awardDetails.getYear());
                    award.setFilmId(awardDetails.getFilmId());
                    award.setCrewId(awardDetails.getCrewId());
                    return ResponseEntity.ok(awardRepository.save(award));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/juries")
    public List<Map<String, Object>> getAllJuries() {
        return dashboardQueryService.getAllJuries();
    }

    @GetMapping("/filmcrew")
    public List<Map<String, Object>> getAllFilmCrew() {
        return dashboardQueryService.getAllFilmCrew();
    }

    @PostMapping("/filmcrew")
    public FilmCrew createFilmCrew(@RequestBody FilmCrew filmCrew) {
        return filmCrewRepository.save(filmCrew);
    }

    @DeleteMapping("/filmcrew/{id}")
    public ResponseEntity<?> deleteFilmCrew(@PathVariable Integer id) {
        return filmCrewRepository.findById(id)
                .map(filmCrew -> {
                    filmCrewRepository.delete(filmCrew);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/filmcrew/{id}")
    public ResponseEntity<FilmCrew> updateFilmCrew(@PathVariable Integer id, @RequestBody FilmCrew crewDetails) {
        return filmCrewRepository.findById(id)
                .map(crew -> {
                    crew.setName(crewDetails.getName());
                    crew.setRole(crewDetails.getRole());
                    crew.setFilmId(crewDetails.getFilmId());
                    return ResponseEntity.ok(filmCrewRepository.save(crew));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
