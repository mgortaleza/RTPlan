package com.rtplan.service;

import com.rtplan.dto.request.AuthRequest;
import com.rtplan.dto.response.AuthResponse;
import com.rtplan.entity.User;
import com.rtplan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthResponse authenticate(AuthRequest request) {
        String username = request.getUsername().trim();
        log.info("Authenticating user: {}", username);

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
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

        log.info("Authentication successful for user: {}", username);
        String sessionToken = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(sessionToken)
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
