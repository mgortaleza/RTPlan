package com.rtplan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverCreateRequest {

    @NotBlank(message = "Driver full name is required")
    private String fullName;

    private String phoneNumber;

    @Builder.Default
    private Boolean isActive = true;
}
