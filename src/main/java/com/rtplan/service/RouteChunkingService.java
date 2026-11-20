package com.rtplan.service;

import com.rtplan.entity.RouteLink;
import com.rtplan.entity.RouteStop;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class RouteChunkingService {

    private static final int MAX_DESTINATIONS_PER_CHUNK = 9; // 1 origin + 9 destinations = 10 stops max

    /**
     * Chunks an ordered list of RouteStops into consecutive Google Maps deep links.
     * Each link has at most 1 origin and 9 destinations (max 10 stops per link),
     * carrying the last stop of chunk N over as the origin of chunk N+1.
     *
     * @param stops Ordered list of RouteStops (must be sorted by optimizedSequence)
     * @return List of RouteLink entities with sequenceChunk and googleMapsUrl populated
     */
    public List<RouteLink> generateChunkedLinks(List<RouteStop> stops) {
        if (stops == null || stops.isEmpty()) {
            return Collections.emptyList();
        }

        List<RouteLink> links = new ArrayList<>();
        int totalStops = stops.size();

        if (totalStops == 1) {
            String url = buildSingleStopUrl(stops.get(0));
            links.add(RouteLink.builder()
                    .sequenceChunk(1)
                    .googleMapsUrl(url)
                    .build());
            return links;
        }

        int chunkIndex = 1;
        int startIndex = 0;

        while (startIndex < totalStops - 1) {
            int endIndex = Math.min(startIndex + MAX_DESTINATIONS_PER_CHUNK, totalStops - 1);
            List<RouteStop> chunkStops = stops.subList(startIndex, endIndex + 1);

            String googleMapsUrl = buildGoogleMapsDirectionsUrl(chunkStops);
            links.add(RouteLink.builder()
                    .sequenceChunk(chunkIndex++)
                    .googleMapsUrl(googleMapsUrl)
                    .build());

            // The last stop of this chunk becomes the origin of the next chunk
            startIndex = endIndex;
        }

        log.info("Generated {} Google Maps route links for {} stops", links.size(), totalStops);
        return links;
    }

    /**
     * Builds a standard Google Maps Directions URL:
     * https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
     */
    public String buildGoogleMapsDirectionsUrl(List<RouteStop> chunkStops) {
        if (chunkStops.isEmpty()) {
            return "";
        }

        RouteStop origin = chunkStops.get(0);
        RouteStop destination = chunkStops.get(chunkStops.size() - 1);

        StringBuilder url = new StringBuilder("https://www.google.com/maps/dir/?api=1");
        url.append("&origin=").append(formatStopPoint(origin));
        url.append("&destination=").append(formatStopPoint(destination));

        // Intermediates between origin and destination
        if (chunkStops.size() > 2) {
            url.append("&waypoints=");
            for (int i = 1; i < chunkStops.size() - 1; i++) {
                if (i > 1) {
                    url.append("%7C"); // URL-encoded pipe '|'
                }
                url.append(formatStopPoint(chunkStops.get(i)));
            }
        }

        return url.toString();
    }

    private String buildSingleStopUrl(RouteStop stop) {
        return "https://www.google.com/maps/search/?api=1&query=" + formatStopPoint(stop);
    }

    private String formatStopPoint(RouteStop stop) {
        if (stop.getLatitude() != null && stop.getLongitude() != null) {
            return stop.getLatitude().toPlainString() + "," + stop.getLongitude().toPlainString();
        }
        return URLEncoder.encode(stop.getCorrectedAddress(), StandardCharsets.UTF_8);
    }
}
