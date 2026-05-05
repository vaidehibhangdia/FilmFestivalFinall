package com.filmfestival.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "award")
public class Award {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "award_id")
    @JsonProperty("award_id")
    private Integer awardId;

    @Column(name = "award_name", nullable = false)
    @JsonProperty("award_name")
    private String awardName;

    private String category;

    @Column(name = "film_id")
    @JsonProperty("film_id")
    private Integer filmId;

    @Column(name = "crew_id")
    @JsonProperty("crew_id")
    private Integer crewId;

    private Integer year;
}
