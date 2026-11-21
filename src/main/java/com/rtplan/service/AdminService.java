package com.rtplan.service;

import com.rtplan.dto.request.UserCreateRequest;
import com.rtplan.dto.request.UserUpdateRequest;
import com.rtplan.dto.response.SystemMetricsResponse;
import com.rtplan.dto.response.UserResponse;
import com.rtplan.entity.Driver;
import com.rtplan.entity.User;
import com.rtplan.exception.ResourceNotFoundException;
import com.rtplan.repository.*;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final RouteManifestRepository manifestRepository;
    private final RouteStopRepository stopRepository;
    private final RouteLinkRepository linkRepository;
    private final DataSource dataSource;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.integrations.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.integrations.google-maps.api-key:}")
    private String googleMapsApiKey;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByUserIdDesc().stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getPendingUsers() {
        return userRepository.findByStatusIgnoreCase("PENDING").stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already in use.");
        }

        String role = normalizeRole(request.getRole());
        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().trim().toUpperCase()
                : "APPROVED";
        boolean isActive = request.getIsActive() != null ? request.getIsActive() : true;

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .username(username)
                .fullName(request.getFullName().trim())
                .password(encodedPassword)
                .role(role)
                .status(status)
                .isActive(isActive)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user ID: {}, username: {}, role: {}", saved.getUserId(), saved.getUsername(), saved.getRole());

        // If user is a DRIVER, sync to drivers table
        if ("DRIVER".equalsIgnoreCase(role)) {
            syncDriver(saved.getFullName(), isActive && "APPROVED".equalsIgnoreCase(status));
        }

        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(normalizeRole(request.getRole()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(request.getStatus().trim().toUpperCase());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        log.info("Admin updated user ID: {}, username: {}", updated.getUserId(), updated.getUsername());

        // Sync driver record
        if ("DRIVER".equalsIgnoreCase(updated.getRole())) {
            syncDriver(updated.getFullName(), Boolean.TRUE.equals(updated.getIsActive()) && "APPROVED".equalsIgnoreCase(updated.getStatus()));
        }

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteUser(Long userId, String requestingUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (requestingUsername != null && requestingUsername.equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("You cannot delete your own logged-in account.");
        }

        // Prevent deleting the only administrator
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()) && Boolean.TRUE.equals(u.getIsActive()))
                    .count();
            if (adminCount <= 1) {
                throw new IllegalArgumentException("Cannot delete the only active administrator in the system.");
            }
        }

        log.info("Deleting user ID: {}, username: {}", userId, user.getUsername());
        userRepository.delete(user);
    }

    @Transactional
    public UserResponse approveUser(Long userId, String assignedRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setStatus("APPROVED");
        user.setIsActive(true);

        if (assignedRole != null && !assignedRole.isBlank()) {
            user.setRole(normalizeRole(assignedRole));
        }

        User saved = userRepository.save(user);
        log.info("Approved user ID: {}, username: {}, role: {}", saved.getUserId(), saved.getUsername(), saved.getRole());

        if ("DRIVER".equalsIgnoreCase(saved.getRole())) {
            syncDriver(saved.getFullName(), true);
        }

        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public UserResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setStatus("REJECTED");
        user.setIsActive(false);

        User saved = userRepository.save(user);
        log.info("Rejected user ID: {}, username: {}", saved.getUserId(), saved.getUsername());
        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public SystemMetricsResponse getSystemMetrics() {
        // Server & JVM Metrics
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;

        long heapUsedMb = usedMemory / (1024 * 1024);
        long heapTotalMb = totalMemory / (1024 * 1024);
        long heapMaxMb = maxMemory / (1024 * 1024);
        double heapUsedPercent = maxMemory > 0 ? ((double) usedMemory / maxMemory) * 100.0 : 0.0;

        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        long uptimeSeconds = uptimeMillis / 1000;
        String formattedUptime = formatUptime(uptimeSeconds);

        // Database Metrics
        String dbStatus = "HEALTHY";
        String dbProductName = "Microsoft SQL Server";
        String dbProductVersion = "Unknown";
        long dbLatencyMs = -1;

        long startPing = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            dbLatencyMs = System.currentTimeMillis() - startPing;
            DatabaseMetaData metaData = conn.getMetaData();
            dbProductName = metaData.getDatabaseProductName();
            dbProductVersion = metaData.getDatabaseProductVersion();
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage());
            dbStatus = "DOWN";
            dbLatencyMs = -1;
        }

        // HikariCP connection pool metrics
        Integer activeConns = null;
        Integer idleConns = null;
        Integer totalConns = null;
        Integer maxConns = null;

        if (dataSource instanceof HikariDataSource hikariDataSource) {
            maxConns = hikariDataSource.getMaximumPoolSize();
            HikariPoolMXBean poolMx = hikariDataSource.getHikariPoolMXBean();
            if (poolMx != null) {
                activeConns = poolMx.getActiveConnections();
                idleConns = poolMx.getIdleConnections();
                totalConns = poolMx.getTotalConnections();
            }
        }

        // Table counts
        Map<String, Long> tableCounts = new LinkedHashMap<>();
        long totalUsers = userRepository.count();
        long pendingUsers = userRepository.countByStatusIgnoreCase("PENDING");
        long totalDrivers = driverRepository.count();
        long totalManifests = manifestRepository.count();
        long totalStops = stopRepository.count();
        long totalLinks = linkRepository.count();

        tableCounts.put("app_users", totalUsers);
        tableCounts.put("drivers", totalDrivers);
        tableCounts.put("route_manifests", totalManifests);
        tableCounts.put("route_stops", totalStops);
        tableCounts.put("route_links", totalLinks);

        boolean geminiConfigured = geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.contains("YOUR_");
        boolean googleMapsConfigured = googleMapsApiKey != null && !googleMapsApiKey.isBlank() && !googleMapsApiKey.contains("YOUR_");

        return SystemMetricsResponse.builder()
                .osName(System.getProperty("os.name"))
                .osVersion(System.getProperty("os.version"))
                .osArch(System.getProperty("os.arch"))
                .jvmVersion(System.getProperty("java.version"))
                .jvmVendor(System.getProperty("java.vendor"))
                .uptimeSeconds(uptimeSeconds)
                .formattedUptime(formattedUptime)
                .availableProcessors(runtime.availableProcessors())
                .heapUsedMb(heapUsedMb)
                .heapTotalMb(heapTotalMb)
                .heapMaxMb(heapMaxMb)
                .heapUsedPercent(Math.round(heapUsedPercent * 10.0) / 10.0)
                .dbStatus(dbStatus)
                .dbProductName(dbProductName)
                .dbProductVersion(dbProductVersion)
                .dbLatencyMs(dbLatencyMs)
                .hikariActiveConnections(activeConns)
                .hikariIdleConnections(idleConns)
                .hikariTotalConnections(totalConns)
                .hikariMaxConnections(maxConns)
                .tableCounts(tableCounts)
                .totalManifests(totalManifests)
                .totalStops(totalStops)
                .totalUsers(totalUsers)
                .pendingUsersCount(pendingUsers)
                .totalDrivers(totalDrivers)
                .geminiConfigured(geminiConfigured)
                .googleMapsConfigured(googleMapsConfigured)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    private void syncDriver(String fullName, boolean active) {
        if (fullName == null || fullName.isBlank()) return;
        driverRepository.findByFullNameIgnoreCase(fullName.trim()).ifPresentOrElse(
                driver -> {
                    driver.setIsActive(active);
                    driverRepository.save(driver);
                },
                () -> {
                    driverRepository.save(Driver.builder()
                            .fullName(fullName.trim())
                            .isActive(active)
                            .build());
                }
        );
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) return "DRIVER";
        return switch (role.trim().toUpperCase()) {
            case "ADMIN" -> "ADMIN";
            case "DISPATCH", "DISPATCHER" -> "DISPATCH";
            default -> "DRIVER";
        };
    }

    private String formatUptime(long totalSeconds) {
        long days = totalSeconds / (24 * 3600);
        long hours = (totalSeconds % (24 * 3600)) / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        if (days > 0) {
            return String.format("%dd %dh %dm", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
