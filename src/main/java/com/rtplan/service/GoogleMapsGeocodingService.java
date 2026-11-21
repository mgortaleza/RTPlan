package com.rtplan.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.rtplan.config.GoogleApiProperties;
import com.rtplan.exception.ExternalApiException;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleMapsGeocodingService {

    private final RestClient restClient;
    private final GoogleApiProperties properties;
    private final ObjectMapper objectMapper;

    @Getter
    @Builder
    public static class Coordinates {
        private final BigDecimal latitude;
        private final BigDecimal longitude;
        private final String formattedAddress;
    }

    /**
     * Converts a string address into geographic coordinates (Latitude, Longitude).
     *
     * @param address Full or partial street address
     * @return Coordinates containing BigDecimal latitude, longitude, and formatted address
     */
    public Coordinates geocodeAddress(String address) {
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Address cannot be empty for geocoding");
        }

        var mapsProps = properties.getIntegrations().getGoogleMaps();
        String apiKey = mapsProps.getApiKey();

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GOOGLE_MAPS_API_KEY")) {
            log.warn("Google Maps API key not configured. Using deterministic mock coordinates for address: {}", address);
            return mockCoordinatesForAddress(address);
        }

        try {
            URI uri = UriComponentsBuilder.fromUriString(mapsProps.getGeocodingUrl())
                    .queryParam("address", address)
                    .queryParam("key", apiKey)
                    .build()
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            return parseGeocodingResponse(response, address);
        } catch (Exception ex) {
            log.error("Geocoding failed for address: {}", address, ex);
            throw new ExternalApiException("Google Maps Geocoding failed for address: " + address, ex);
        }
    }

    private Coordinates parseGeocodingResponse(String jsonResponse, String originalAddress) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            String status = root.path("status").asText();

            if (!"OK".equalsIgnoreCase(status)) {
                log.warn("Geocoding API status returned '{}' for address: {}", status, originalAddress);
                if ("ZERO_RESULTS".equalsIgnoreCase(status)) {
                    // Fallback to simulated coordinates rather than failing the whole batch
                    return mockCoordinatesForAddress(originalAddress);
                }
                throw new ExternalApiException("Google Geocoding error: " + status);
            }

            JsonNode firstResult = root.path("results").get(0);
            JsonNode location = firstResult.path("geometry").path("location");
            String formattedAddress = firstResult.path("formatted_address").asText(originalAddress);

            double lat = location.path("lat").asDouble();
            double lng = location.path("lng").asDouble();

            return Coordinates.builder()
                    .latitude(BigDecimal.valueOf(lat).setScale(6, RoundingMode.HALF_UP))
                    .longitude(BigDecimal.valueOf(lng).setScale(6, RoundingMode.HALF_UP))
                    .formattedAddress(formattedAddress)
                    .build();
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse geocoding response: {}", jsonResponse, e);
            throw new ExternalApiException("Failed to parse Geocoding API response", e);
        }
    }

    private Coordinates mockCoordinatesForAddress(String address) {
        // Deterministic offset centered around Springfield, IL (39.7817, -89.6501)
        int hash = Math.abs(address.hashCode());
        double latOffset = (hash % 1000) / 10000.0;
        double lngOffset = ((hash / 1000) % 1000) / 10000.0;

        double baseLat = 39.7817 + latOffset;
        double baseLng = -89.6501 + lngOffset;

        return Coordinates.builder()
                .latitude(BigDecimal.valueOf(baseLat).setScale(6, RoundingMode.HALF_UP))
                .longitude(BigDecimal.valueOf(baseLng).setScale(6, RoundingMode.HALF_UP))
                .formattedAddress(address)
                .build();
    }
}
