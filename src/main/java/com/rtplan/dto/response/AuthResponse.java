package com.rtplan.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private boolean success;
    private String message;
    private String token;
    private Long userId;
    private String username;
    private String fullName;
    private String role;
    private String status;
}
