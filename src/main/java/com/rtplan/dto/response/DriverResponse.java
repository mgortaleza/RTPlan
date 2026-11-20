package com.rtplan.dto.response;

import com.rtplan.entity.Driver;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverResponse {

    private Long driverId;
    private String fullName;
    private String phoneNumber;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static DriverResponse fromEntity(Driver entity) {
        return DriverResponse.builder()
                .driverId(entity.getDriverId())
                .fullName(entity.getFullName())
                .phoneNumber(entity.getPhoneNumber())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
