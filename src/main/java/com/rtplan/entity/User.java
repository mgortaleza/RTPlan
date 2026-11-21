package com.rtplan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userid")
    private Long userId;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password", nullable = false, length = 150)
    private String password;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "role", nullable = false, length = 30)
    @Builder.Default
    private String role = "DRIVER"; // ADMIN, DISPATCH, DRIVER

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "APPROVED"; // PENDING, APPROVED, REJECTED

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
