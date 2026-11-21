package com.rtplan.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizeRouteRequest {

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    private String createdBy;

    private LocalDate routeDate;

    @NotEmpty(message = "At least one stop must be provided")
    @Valid
    private List<StopInputDto> stops;
}
