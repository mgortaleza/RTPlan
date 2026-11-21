package com.rtplan.controller;

import com.rtplan.dto.request.OptimizeRouteRequest;
import com.rtplan.dto.response.ManifestResponse;
import com.rtplan.service.GeminiExtractionService;
import com.rtplan.service.RouteManifestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final GeminiExtractionService geminiExtractionService;
    private final RouteManifestService routeManifestService;

    /**
     * Extracts addresses from uploaded delivery manifest screenshots.
     * Consumed by React frontend (Phase 1) for human verification/editing.
     *
     * @param files Screenshot images (multipart/form-data)
     * @return List of extracted address strings
     */
    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<String>> extractAddresses(
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "screenshots", required = false) MultipartFile[] screenshots) {

        MultipartFile[] targetFiles = (files != null && files.length > 0) ? files : screenshots;
        if (targetFiles == null || targetFiles.length == 0) {
            throw new IllegalArgumentException("Upload at least one screenshot file via 'files' or 'screenshots'");
        }

        log.info("Received request to extract addresses from {} image(s)", targetFiles.length);
        List<String> addresses = geminiExtractionService.extractAddressesFromImages(targetFiles);
        return ResponseEntity.ok(addresses);
    }

    /**
     * Geocodes, optimizes route sequence (TSP), generates chunked deep links,
     * and persists the manifest, stops, and links to SQL Server.
     *
     * @param request JSON payload with driver ID and verified list of addresses
     * @return Full ManifestResponse with stops (for Android) and links (for React)
     */
    @PostMapping(value = "/optimize", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ManifestResponse> optimizeRoute(@Valid @RequestBody OptimizeRouteRequest request) {
        log.info("Received optimization request for driverId {} with {} stops",
                request.getDriverId(), request.getStops().size());
        ManifestResponse response = routeManifestService.optimizeAndSaveRoute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves recent saved route manifests with their ordered stops and chunked navigation links.
     *
     * @return List of recent ManifestResponses
     */
    @GetMapping(value = "/manifests", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ManifestResponse>> getRecentManifests() {
        log.info("Fetching recent route manifests");
        List<ManifestResponse> manifests = routeManifestService.getRecentManifests();
        return ResponseEntity.ok(manifests);
    }

    /**
     * Retrieves a saved manifest by ID with its ordered stops and chunked navigation links.
     *
     * @param id Manifest ID
     * @return Full ManifestResponse
     */
    @GetMapping(value = "/manifests/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ManifestResponse> getManifest(@PathVariable("id") Long id) {
        log.info("Fetching route manifest with ID: {}", id);
        ManifestResponse response = routeManifestService.getManifestById(id);
        return ResponseEntity.ok(response);
    }
}
