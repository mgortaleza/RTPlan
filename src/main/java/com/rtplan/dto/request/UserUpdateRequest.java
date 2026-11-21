package com.rtplan.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {

    private String fullName;

    private String role; // ADMIN, DISPATCH, DRIVER

    private String password; // Optional - only updated if non-blank

    private String status; // APPROVED, PENDING, REJECTED

    private Boolean isActive;
}
