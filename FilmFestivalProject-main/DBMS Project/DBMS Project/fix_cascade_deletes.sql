-- Fix Delete functionality by adding CASCADE to foreign keys

-- Films dependencies
ALTER TABLE evaluation DROP FOREIGN KEY evaluation_ibfk_2;
ALTER TABLE evaluation ADD CONSTRAINT evaluation_ibfk_2 FOREIGN KEY (film_id) REFERENCES film(film_id) ON DELETE CASCADE;

ALTER TABLE film_award DROP FOREIGN KEY film_award_ibfk_1;
ALTER TABLE film_award ADD CONSTRAINT film_award_ibfk_1 FOREIGN KEY (film_id) REFERENCES film(film_id) ON DELETE CASCADE;

ALTER TABLE film_crew DROP FOREIGN KEY film_crew_ibfk_1;
ALTER TABLE film_crew ADD CONSTRAINT film_crew_ibfk_1 FOREIGN KEY (film_id) REFERENCES film(film_id) ON DELETE CASCADE;

ALTER TABLE jury_assignment DROP FOREIGN KEY jury_assignment_ibfk_2;
ALTER TABLE jury_assignment ADD CONSTRAINT jury_assignment_ibfk_2 FOREIGN KEY (film_id) REFERENCES film(film_id) ON DELETE CASCADE;

ALTER TABLE screening DROP FOREIGN KEY screening_ibfk_1;
ALTER TABLE screening ADD CONSTRAINT screening_ibfk_1 FOREIGN KEY (film_id) REFERENCES film(film_id) ON DELETE CASCADE;

-- Venue dependencies
ALTER TABLE screening DROP FOREIGN KEY screening_ibfk_2;
ALTER TABLE screening ADD CONSTRAINT screening_ibfk_2 FOREIGN KEY (venue_id) REFERENCES venue(venue_id) ON DELETE CASCADE;

-- Screening dependencies
ALTER TABLE ticket DROP FOREIGN KEY ticket_ibfk_1;
ALTER TABLE ticket ADD CONSTRAINT ticket_ibfk_1 FOREIGN KEY (screening_id) REFERENCES screening(screening_id) ON DELETE CASCADE;

-- Attendee dependencies
ALTER TABLE ticket DROP FOREIGN KEY ticket_ibfk_2;
ALTER TABLE ticket ADD CONSTRAINT ticket_ibfk_2 FOREIGN KEY (attendee_id) REFERENCES attendee(attendee_id) ON DELETE CASCADE;

-- User dependencies (for complete cleanup)
ALTER TABLE attendee DROP FOREIGN KEY attendee_ibfk_1;
ALTER TABLE attendee ADD CONSTRAINT attendee_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE jury DROP FOREIGN KEY jury_ibfk_1;
ALTER TABLE jury ADD CONSTRAINT jury_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE ticket DROP FOREIGN KEY ticket_ibfk_3;
ALTER TABLE ticket ADD CONSTRAINT ticket_ibfk_3 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
