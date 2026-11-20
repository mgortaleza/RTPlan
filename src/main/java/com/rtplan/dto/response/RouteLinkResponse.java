package com.rtplan.dto.response;

import com.rtplan.entity.RouteLink;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteLinkResponse {

    private Long linkId;
    private Long manifestId;
    private Integer sequenceChunk;
    private String googleMapsUrl;
    private LocalDateTime createdAt;

    public static RouteLinkResponse fromEntity(RouteLink entity) {
        return RouteLinkResponse.builder()
                .linkId(entity.getLinkId())
                .manifestId(entity.getManifest() != null ? entity.getManifest().getManifestId() : null)
                .sequenceChunk(entity.getSequenceChunk())
                .googleMapsUrl(entity.getGoogleMapsUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
