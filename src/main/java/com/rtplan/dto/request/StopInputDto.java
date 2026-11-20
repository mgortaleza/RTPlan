package com.rtplan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StopInputDto {

    private String originalExtractedText;

    @NotBlank(message = "Corrected address is required")
    private String correctedAddress;

    @Builder.Default
    private Boolean isManuallyEdited = false;

    public static StopInputDto fromSimpleAddress(String address) {
        return StopInputDto.builder()
                .originalExtractedText(address)
                .correctedAddress(address)
                .isManuallyEdited(false)
                .build();
    }
}
