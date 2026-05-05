package com.filmfestival.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "evaluation")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_id")
    @JsonProperty("evaluation_id")
    private Integer evaluationId;

    @Column(name = "jury_id")
    @JsonProperty("jury_id")
    private Integer juryId;

    @Column(name = "film_id")
    @JsonProperty("film_id")
    private Integer filmId;

    private Integer score;
    private String remarks;

    @Column(name = "ticket_id")
    @JsonProperty("ticket_id")
    private Integer ticketId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
