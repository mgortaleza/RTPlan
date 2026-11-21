package com.rtplan.controller;

import com.rtplan.dto.request.UserCreateRequest;
import com.rtplan.dto.request.UserUpdateRequest;
import com.rtplan.dto.response.SystemMetricsResponse;
import com.rtplan.dto.response.UserResponse;
import com.rtplan.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping(value = "/users", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping(value = "/users/pending", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<UserResponse>> listPendingUsers() {
        return ResponseEntity.ok(adminService.getPendingUsers());
    }

    @PostMapping(value = "/users", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        log.info("Admin creating new user: {}", request.getUsername());
        UserResponse created = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/users/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable("id") Long id,
            @RequestBody UserUpdateRequest request) {
        log.info("Admin updating user ID: {}", id);
        UserResponse updated = adminService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping(value = "/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable("id") Long id,
            @RequestParam(value = "requestingUser", required = false) String requestingUser) {
        log.info("Admin deleting user ID: {} (requested by: {})", id, requestingUser);
        adminService.deleteUser(id, requestingUser);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully", "userId", String.valueOf(id)));
    }

    @PostMapping(value = "/users/{id}/approve", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable("id") Long id,
            @RequestParam(value = "role", required = false) String role) {
        log.info("Admin approving user ID: {} with role: {}", id, role);
        UserResponse approved = adminService.approveUser(id, role);
        return ResponseEntity.ok(approved);
    }

    @PostMapping(value = "/users/{id}/reject", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserResponse> rejectUser(@PathVariable("id") Long id) {
        log.info("Admin rejecting user ID: {}", id);
        UserResponse rejected = adminService.rejectUser(id);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping(value = "/metrics", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SystemMetricsResponse> getSystemMetrics() {
        return ResponseEntity.ok(adminService.getSystemMetrics());
    }
}
