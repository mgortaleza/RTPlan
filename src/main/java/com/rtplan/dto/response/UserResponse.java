package com.rtplan.dto.response;

import com.rtplan.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String role;
    private String status;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
