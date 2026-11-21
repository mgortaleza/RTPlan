package com.rtplan.service;

import com.rtplan.dto.request.OptimizeRouteRequest;
import com.rtplan.dto.request.StopInputDto;
import com.rtplan.dto.response.ManifestResponse;
import com.rtplan.entity.Driver;
import com.rtplan.entity.ManifestStatus;
import com.rtplan.entity.RouteLink;
import com.rtplan.entity.RouteManifest;
import com.rtplan.entity.RouteStop;
import com.rtplan.exception.ResourceNotFoundException;
import com.rtplan.repository.DriverRepository;
import com.rtplan.repository.RouteManifestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteManifestService {

    private final DriverRepository driverRepository;
    private final RouteManifestRepository routeManifestRepository;
    private final GoogleMapsGeocodingService geocodingService;
    private final RouteOptimizationService optimizationService;
    private final RouteChunkingService chunkingService;

    /**
     * Geocodes, solves TSP optimization, chunks route into Google Maps deep links,
     * and saves the manifest, stops, and links to SQL Server.
     *
     * @param request The route optimization payload
     * @return Complete ManifestResponse with stops (for Android) and links (for React)
     */
    @Transactional
    public ManifestResponse optimizeAndSaveRoute(OptimizeRouteRequest request) {
        log.info("Processing route optimization for driverId: {}, stopCount: {}",
                request.getDriverId(), request.getStops().size());

        // 1. Verify Driver exists
        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + request.getDriverId()));

        // 2. Geocode all input addresses
        List<RouteOptimizationService.OptimizableStop> optimizableStops = new ArrayList<>();
        List<StopInputDto> inputStops = request.getStops();

        for (int i = 0; i < inputStops.size(); i++) {
            StopInputDto inputDto = inputStops.get(i);
            var coordinates = geocodingService.geocodeAddress(inputDto.getCorrectedAddress());

            optimizableStops.add(RouteOptimizationService.OptimizableStop.builder()
                    .originalIndex(i)
                    .address(inputDto.getCorrectedAddress())
                    .latitude(coordinates.getLatitude())
                    .longitude(coordinates.getLongitude())
                    .build());
        }

        // 3. Solve TSP to sequence stops
        List<RouteOptimizationService.SequencedStop> sequencedStops =
                optimizationService.optimizeRouteSequence(optimizableStops);

        // Sort by optimized sequence
        sequencedStops.sort(Comparator.comparingInt(RouteOptimizationService.SequencedStop::getOptimizedSequence));

        // 4. Initialize Manifest entity
        RouteManifest manifest = RouteManifest.builder()
                .driver(driver)
                .routeDate(request.getRouteDate() != null ? request.getRouteDate() : LocalDate.now())
                .createdBy(request.getCreatedBy() != null && !request.getCreatedBy().isBlank()
                        ? request.getCreatedBy().trim()
                        : driver.getFullName())
                .status(ManifestStatus.OPTIMIZED)
                .build();

        // 5. Create RouteStop entities in optimized sequence
        List<RouteStop> stopEntities = new ArrayList<>();
        for (RouteOptimizationService.SequencedStop seq : sequencedStops) {
            int originalIdx = seq.getStop().getOriginalIndex();
            StopInputDto originalInput = inputStops.get(originalIdx);

            RouteStop stop = RouteStop.builder()
                    .originalExtractedText(originalInput.getOriginalExtractedText())
                    .correctedAddress(originalInput.getCorrectedAddress())
                    .isManuallyEdited(Boolean.TRUE.equals(originalInput.getIsManuallyEdited()))
                    .latitude(seq.getStop().getLatitude())
                    .longitude(seq.getStop().getLongitude())
                    .optimizedSequence(seq.getOptimizedSequence())
                    .build();

            manifest.addStop(stop);
            stopEntities.add(stop);
        }

        // 6. Generate chunked Google Maps deep links
        List<RouteLink> linkEntities = chunkingService.generateChunkedLinks(stopEntities);
        for (RouteLink link : linkEntities) {
            manifest.addLink(link);
        }

        // 7. Persist to SQL Server
        RouteManifest savedManifest = routeManifestRepository.save(manifest);
        log.info("Successfully persisted manifest ID {} with {} stops and {} links",
                savedManifest.getManifestId(), savedManifest.getStops().size(), savedManifest.getLinks().size());

        return ManifestResponse.fromEntity(savedManifest);
    }

    /**
     * Retrieves a saved manifest by ID along with its stops and chunked links.
     *
     * @param manifestId Manifest PK
     * @return ManifestResponse
     */
    @Transactional(readOnly = true)
    public ManifestResponse getManifestById(Long manifestId) {
        RouteManifest manifest = routeManifestRepository.findById(manifestId)
                .orElseThrow(() -> new ResourceNotFoundException("Manifest not found with ID: " + manifestId));

        // Trigger lazy collections while in read-only transaction
        manifest.getStops().size();
        manifest.getLinks().size();

        return ManifestResponse.fromEntity(manifest);
    }

    /**
     * Retrieves recent route manifests for a specific user (or global top 15 if username not specified).
     *
     * @param username The username/creator filter
     * @return List of ManifestResponse objects ordered newest to oldest
     */
    @Transactional(readOnly = true)
    public List<ManifestResponse> getRecentManifests(String username) {
        return getRecentManifests(username, null);
    }

    /**
     * Retrieves recent route manifests matching either the creator username or assigned driver name.
     *
     * @param username The username/creator filter
     * @param fullName The driver full name filter
     * @return List of ManifestResponse objects ordered newest to oldest
     */
    @Transactional(readOnly = true)
    public List<ManifestResponse> getRecentManifests(String username, String fullName) {
        List<RouteManifest> manifests;
        boolean hasUser = username != null && !username.isBlank();
        boolean hasName = fullName != null && !fullName.isBlank();

        if (hasUser || hasName) {
            String primary = hasUser ? username.trim() : fullName.trim();
            String secondary = (hasName && !fullName.trim().equalsIgnoreCase(primary)) ? fullName.trim() : null;
            manifests = routeManifestRepository.findRecentByUserOrDriver(primary, secondary);
        } else {
            manifests = routeManifestRepository.findTop15ByOrderByManifestIdDesc();
        }
        manifests.forEach(m -> {
            m.getStops().size();
            m.getLinks().size();
        });
        return manifests.stream().map(ManifestResponse::fromEntity).toList();
    }

    /**
     * Deletes route manifests for a specific user, or all manifests if username is empty.
     *
     * @param username The username whose history should be cleared
     */
    @Transactional
    public void clearManifestHistory(String username) {
        if (username != null && !username.isBlank()) {
            List<RouteManifest> userManifests = routeManifestRepository.findRecentByUsername(username.trim());
            log.info("Deleting {} manifest(s) for user '{}'", userManifests.size(), username);
            routeManifestRepository.deleteAll(userManifests);
        } else {
            log.info("Deleting all manifests in the system");
            routeManifestRepository.deleteAll();
        }
    }

    /**
     * Deletes a single route manifest by its ID.
     *
     * @param manifestId Manifest PK
     */
    @Transactional
    public void deleteManifestById(Long manifestId) {
        log.info("Deleting manifest ID: {}", manifestId);
        routeManifestRepository.deleteById(manifestId);
    }
}
