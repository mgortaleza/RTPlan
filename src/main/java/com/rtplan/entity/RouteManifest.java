package com.rtplan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "route_manifests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteManifest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ManifestID")
    private Long manifestId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "DriverID", nullable = false)
    private Driver driver;

    @Column(name = "RouteDate", nullable = false)
    private LocalDate routeDate;

    @Column(name = "CreatedBy", length = 50)
    private String createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    @Builder.Default
    private ManifestStatus status = ManifestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "manifest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("optimizedSequence ASC")
    @Builder.Default
    private List<RouteStop> stops = new ArrayList<>();

    @OneToMany(mappedBy = "manifest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceChunk ASC")
    @Builder.Default
    private List<RouteLink> links = new ArrayList<>();

    public void addStop(RouteStop stop) {
        stops.add(stop);
        stop.setManifest(this);
    }

    public void addLink(RouteLink link) {
        links.add(link);
        link.setManifest(this);
    }
}
