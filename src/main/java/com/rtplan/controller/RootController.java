package com.rtplan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping({"/", "/api"})
    public ResponseEntity<Map<String, Object>> getRootStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "RTPlan Multi-Stop Logistics & Routing API",
                "version", "1.0.0-SNAPSHOT",
                "timestamp", LocalDateTime.now().toString(),
                "endpoints", Map.of(
                        "drivers", "GET /api/drivers, POST /api/drivers",
                        "extractAddresses", "POST /api/routes/extract",
                        "optimizeRoute", "POST /api/routes/optimize",
                        "manifestById", "GET /api/routes/manifests/{id}",
                        "manifestsByDriver", "GET /api/routes/manifests/driver/{driverId}"
                )
        ));
    }
}
