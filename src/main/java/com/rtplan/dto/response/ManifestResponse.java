package com.rtplan.dto.response;

import com.rtplan.entity.ManifestStatus;
import com.rtplan.entity.RouteManifest;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManifestResponse {

    private Long manifestId;
    private Long driverId;
    private String driverName;
    private String createdBy;
    private LocalDate routeDate;
    private ManifestStatus status;
    private LocalDateTime createdAt;
    private List<RouteStopResponse> stops;
    private List<RouteLinkResponse> links;

    public static ManifestResponse fromEntity(RouteManifest entity) {
        return ManifestResponse.builder()
                .manifestId(entity.getManifestId())
                .driverId(entity.getDriver() != null ? entity.getDriver().getDriverId() : null)
                .driverName(entity.getDriver() != null ? entity.getDriver().getFullName() : null)
                .createdBy(entity.getCreatedBy())
                .routeDate(entity.getRouteDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .stops(entity.getStops() != null
                        ? entity.getStops().stream().map(RouteStopResponse::fromEntity).toList()
                        : Collections.emptyList())
                .links(entity.getLinks() != null
                        ? entity.getLinks().stream().map(RouteLinkResponse::fromEntity).toList()
                        : Collections.emptyList())
                .build();
    }
}
