package com.rtplan.service;

import com.rtplan.dto.request.AuthRequest;
import com.rtplan.dto.request.RegisterRequest;
import com.rtplan.dto.response.AuthResponse;
import com.rtplan.entity.Driver;
import com.rtplan.entity.User;
import com.rtplan.repository.DriverRepository;
import com.rtplan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional(readOnly = true)
    public AuthResponse authenticate(AuthRequest request) {
        String username = request.getUsername().trim();
        log.info("Authenticating user: {}", username);

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        // Check account status
        if ("PENDING".equalsIgnoreCase(user.getStatus())) {
            log.warn("Login denied: User '{}' is pending administrator approval", username);
            throw new IllegalArgumentException("Your account is pending administrator approval. Please contact an administrator.");
        }

        if ("REJECTED".equalsIgnoreCase(user.getStatus())) {
            log.warn("Login denied: User '{}' was rejected", username);
            throw new IllegalArgumentException("Your account access request was not approved. Please contact an administrator.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Login denied: User '{}' is disabled", username);
            throw new IllegalArgumentException("Account is disabled. Contact your administrator.");
        }

        // Support direct database entry (plain text) or BCrypt hash
        boolean passwordMatches = request.getPassword().equals(user.getPassword());
        if (!passwordMatches) {
            try {
                passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
            } catch (Exception ignored) {
                passwordMatches = false;
            }
        }

        if (!passwordMatches) {
            log.warn("Authentication failed for user: {}", username);
            throw new IllegalArgumentException("Invalid username or password");
        }

        log.info("Authentication successful for user: {} (role: {}, status: {})",
                username, user.getRole(), user.getStatus());
        String sessionToken = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(sessionToken)
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        log.info("Received registration request for username: {}", username);

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken. Please choose another.");
        }

        String rawRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "DRIVER";
        String normalizedRole = switch (rawRole) {
            case "ADMIN" -> "ADMIN";
            case "DISPATCH", "DISPATCHER" -> "DISPATCH";
            default -> "DRIVER";
        };

        String fullName = request.getFullName() != null && !request.getFullName().isBlank()
                ? request.getFullName().trim()
                : username;

        // Hash password with BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .username(username)
                .password(hashedPassword)
                .fullName(fullName)
                .role(normalizedRole)
                .status("PENDING")
                .isActive(false) // Inactive until approved by admin
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user ID: {}, username: {}, role: {}, status: PENDING",
                savedUser.getUserId(), savedUser.getUsername(), savedUser.getRole());

        // If registered as Driver, ensure driver record exists
        if ("DRIVER".equalsIgnoreCase(normalizedRole)) {
            if (!driverRepository.existsByFullNameIgnoreCase(fullName)) {
                driverRepository.save(Driver.builder()
                        .fullName(fullName)
                        .isActive(false) // Activates when approved
                        .build());
            }
        }

        return AuthResponse.builder()
                .success(true)
                .message("Your account request has been submitted and is pending administrator approval.")
                .userId(savedUser.getUserId())
                .username(savedUser.getUsername())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .status(savedUser.getStatus())
                .build();
    }
}
