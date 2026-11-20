package com.rtplan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rtplan.config.GoogleApiProperties;
import com.rtplan.exception.ExternalApiException;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    private final RestClient restClient;
    private final GoogleApiProperties properties;
    private final ObjectMapper objectMapper;

    @Getter
    @Builder
    public static class OptimizableStop {
        private final int originalIndex;
        private final String address;
        private final BigDecimal latitude;
        private final BigDecimal longitude;
    }

    @Getter
    @Builder
    public static class SequencedStop {
        private final OptimizableStop stop;
        private final int optimizedSequence;
    }

    /**
     * Solves the Traveling Salesperson Problem (TSP) using Google Routes API
     * with optimizeWaypointOrder: true. Falls back to nearest-neighbor TSP algorithm
     * if the external API key is unconfigured or call fails.
     *
     * @param stops List of stops with geocoded coordinates
     * @return List of sequenced stops in optimal visiting order
     */
    public List<SequencedStop> optimizeRouteSequence(List<OptimizableStop> stops) {
        if (stops == null || stops.isEmpty()) {
            return Collections.emptyList();
        }

        if (stops.size() <= 2) {
            List<SequencedStop> result = new ArrayList<>();
            for (int i = 0; i < stops.size(); i++) {
                result.add(SequencedStop.builder()
                        .stop(stops.get(i))
                        .optimizedSequence(i)
                        .build());
            }
            return result;
        }

        var mapsProps = properties.getIntegrations().getGoogleMaps();
        String apiKey = mapsProps.getApiKey();

        if (apiKey != null && !apiKey.isBlank() && !apiKey.equals("YOUR_GOOGLE_MAPS_API_KEY")) {
            try {
                return optimizeWithGoogleRoutesApi(stops, mapsProps.getRoutesUrl(), apiKey);
            } catch (Exception ex) {
                log.warn("Google Routes API TSP optimization failed, falling back to local TSP solver: {}", ex.getMessage());
            }
        } else {
            log.info("Google Maps API key not set. Using local TSP heuristic optimization.");
        }

        return solveTspLocally(stops);
    }

    private List<SequencedStop> optimizeWithGoogleRoutesApi(List<OptimizableStop> stops, String routesUrl, String apiKey) {
        OptimizableStop origin = stops.get(0);
        OptimizableStop destination = stops.get(stops.size() - 1);
        List<OptimizableStop> intermediates = stops.subList(1, stops.size() - 1);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("origin", formatWaypoint(origin));
        requestPayload.put("destination", formatWaypoint(destination));
        requestPayload.put("travelMode", "DRIVE");
        requestPayload.put("optimizeWaypointOrder", true);

        List<Map<String, Object>> intermediateList = new ArrayList<>();
        for (OptimizableStop stop : intermediates) {
            intermediateList.add(formatWaypoint(stop));
        }
        requestPayload.put("intermediates", intermediateList);

        String responseBody = restClient.post()
                .uri(routesUrl)
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", "routes.optimizedIntermediateWaypointIndex")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(String.class);

        return parseRoutesApiResponse(responseBody, origin, destination, intermediates);
    }

    private Map<String, Object> formatWaypoint(OptimizableStop stop) {
        if (stop.getLatitude() != null && stop.getLongitude() != null) {
            return Map.of("location", Map.of("latLng", Map.of(
                    "latitude", stop.getLatitude().doubleValue(),
                    "longitude", stop.getLongitude().doubleValue()
            )));
        } else {
            return Map.of("address", stop.getAddress());
        }
    }

    private List<SequencedStop> parseRoutesApiResponse(
            String responseBody,
            OptimizableStop origin,
            OptimizableStop destination,
            List<OptimizableStop> intermediates) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode routes = root.path("routes");
            if (routes.isEmpty()) {
                throw new ExternalApiException("Google Routes API returned empty routes array");
            }

            JsonNode indexArray = routes.get(0).path("optimizedIntermediateWaypointIndex");
            List<SequencedStop> orderedStops = new ArrayList<>();

            // 0: Origin
            orderedStops.add(SequencedStop.builder()
                    .stop(origin)
                    .optimizedSequence(0)
                    .build());

            // 1 to N-2: Optimized intermediates
            int sequence = 1;
            if (indexArray.isArray() && indexArray.size() == intermediates.size()) {
                for (JsonNode idxNode : indexArray) {
                    int originalIntermediateIdx = idxNode.asInt();
                    orderedStops.add(SequencedStop.builder()
                            .stop(intermediates.get(originalIntermediateIdx))
                            .optimizedSequence(sequence++)
                            .build());
                }
            } else {
                // Default order if index array is missing or mismatch
                for (OptimizableStop inter : intermediates) {
                    orderedStops.add(SequencedStop.builder()
                            .stop(inter)
                            .optimizedSequence(sequence++)
                            .build());
                }
            }

            // N-1: Destination
            orderedStops.add(SequencedStop.builder()
                    .stop(destination)
                    .optimizedSequence(sequence)
                    .build());

            return orderedStops;
        } catch (Exception ex) {
            log.error("Failed to parse Routes API response: {}", responseBody, ex);
            throw new ExternalApiException("Error parsing Google Routes API response: " + ex.getMessage(), ex);
        }
    }

    /**
     * Local Nearest-Neighbor TSP heuristic solver for robust offline operation.
     */
    private List<SequencedStop> solveTspLocally(List<OptimizableStop> stops) {
        List<OptimizableStop> unvisited = new ArrayList<>(stops);
        List<SequencedStop> result = new ArrayList<>();

        // Start from first stop
        OptimizableStop current = unvisited.remove(0);
        result.add(SequencedStop.builder().stop(current).optimizedSequence(0).build());

        int seq = 1;
        while (!unvisited.isEmpty()) {
            OptimizableStop nearest = null;
            double minDistance = Double.MAX_VALUE;

            for (OptimizableStop candidate : unvisited) {
                double dist = calculateDistance(current, candidate);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = candidate;
                }
            }

            unvisited.remove(nearest);
            result.add(SequencedStop.builder().stop(nearest).optimizedSequence(seq++).build());
            current = nearest;
        }

        return result;
    }

    private double calculateDistance(OptimizableStop a, OptimizableStop b) {
        if (a.getLatitude() == null || a.getLongitude() == null ||
                b.getLatitude() == null || b.getLongitude() == null) {
            return 1.0;
        }
        double lat1 = Math.toRadians(a.getLatitude().doubleValue());
        double lon1 = Math.toRadians(a.getLongitude().doubleValue());
        double lat2 = Math.toRadians(b.getLatitude().doubleValue());
        double lon2 = Math.toRadians(b.getLongitude().doubleValue());

        double dlat = lat2 - lat1;
        double dlon = lon2 - lon1;

        double h = Math.pow(Math.sin(dlat / 2), 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
        return 2 * 6371.0 * Math.asin(Math.sqrt(h));
    }
}
