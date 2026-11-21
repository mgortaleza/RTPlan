package com.rtplan.dto.response;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMetricsResponse {

    // Server & JVM Metrics
    private String osName;
    private String osVersion;
    private String osArch;
    private String jvmVersion;
    private String jvmVendor;
    private long uptimeSeconds;
    private String formattedUptime;
    private int availableProcessors;
    private long heapUsedMb;
    private long heapTotalMb;
    private long heapMaxMb;
    private double heapUsedPercent;

    // Database Metrics
    private String dbStatus; // HEALTHY, DEGRADED, DOWN
    private String dbProductName;
    private String dbProductVersion;
    private long dbLatencyMs;
    private Integer hikariActiveConnections;
    private Integer hikariIdleConnections;
    private Integer hikariTotalConnections;
    private Integer hikariMaxConnections;
    private Map<String, Long> tableCounts;

    // Application Workflow Metrics
    private long totalManifests;
    private long totalStops;
    private long totalUsers;
    private long pendingUsersCount;
    private long totalDrivers;
    private boolean geminiConfigured;
    private boolean googleMapsConfigured;
    private String timestamp;
}
