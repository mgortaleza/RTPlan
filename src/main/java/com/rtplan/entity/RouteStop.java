package com.rtplan.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "route_stops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StopID")
    private Long stopId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ManifestID", nullable = false)
    private RouteManifest manifest;

    @Column(name = "OriginalExtractedText", length = 500)
    private String originalExtractedText;

    @Column(name = "CorrectedAddress", nullable = false, length = 500)
    private String correctedAddress;

    @Column(name = "IsManuallyEdited", nullable = false)
    @Builder.Default
    private Boolean isManuallyEdited = false;

    @Column(name = "Latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "Longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "OptimizedSequence", nullable = false)
    @Builder.Default
    private Integer optimizedSequence = 0;
}
