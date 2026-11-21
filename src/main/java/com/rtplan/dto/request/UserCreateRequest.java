package com.rtplan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreateRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 2, max = 50, message = "Username must be between 2 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 4, max = 100, message = "Password must be at least 4 characters")
    private String password;

    @NotBlank(message = "Full Name is required")
    @Size(max = 150, message = "Full Name cannot exceed 150 characters")
    private String fullName;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN, DISPATCH, DRIVER

    private String status; // APPROVED, PENDING, REJECTED

    private Boolean isActive;
}
