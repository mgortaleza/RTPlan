package com.rtplan.dto.response;

import com.rtplan.entity.RouteStop;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStopResponse {

    private Long stopId;
    private Long manifestId;
    private String originalExtractedText;
    private String correctedAddress;
    private Boolean isManuallyEdited;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer optimizedSequence;

    public static RouteStopResponse fromEntity(RouteStop entity) {
        return RouteStopResponse.builder()
                .stopId(entity.getStopId())
                .manifestId(entity.getManifest() != null ? entity.getManifest().getManifestId() : null)
                .originalExtractedText(entity.getOriginalExtractedText())
                .correctedAddress(entity.getCorrectedAddress())
                .isManuallyEdited(entity.getIsManuallyEdited())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .optimizedSequence(entity.getOptimizedSequence())
                .build();
    }
}
