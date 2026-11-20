package com.rtplan.service;

import com.rtplan.entity.RouteLink;
import com.rtplan.entity.RouteStop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RouteChunkingServiceTest {

    private RouteChunkingService chunkingService;

    @BeforeEach
    void setUp() {
        chunkingService = new RouteChunkingService();
    }

    private List<RouteStop> createMockStops(int count) {
        List<RouteStop> stops = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            stops.add(RouteStop.builder()
                    .stopId((long) (i + 1))
                    .optimizedSequence(i)
                    .correctedAddress("Address " + i + ", City, State")
                    .latitude(BigDecimal.valueOf(39.7800 + (i * 0.001)))
                    .longitude(BigDecimal.valueOf(-89.6500 - (i * 0.001)))
                    .build());
        }
        return stops;
    }

    @Test
    @DisplayName("Should return empty list when stops are empty")
    void testEmptyStops() {
        List<RouteLink> links = chunkingService.generateChunkedLinks(List.of());
        assertTrue(links.isEmpty());
    }

    @Test
    @DisplayName("Should return 1 link for a single stop")
    void testSingleStop() {
        List<RouteStop> stops = createMockStops(1);
        List<RouteLink> links = chunkingService.generateChunkedLinks(stops);

        assertEquals(1, links.size());
        assertEquals(1, links.get(0).getSequenceChunk());
        assertTrue(links.get(0).getGoogleMapsUrl().contains("maps/search/"));
    }

    @Test
    @DisplayName("Should generate 1 chunk for 5 stops (origin + 4 destinations)")
    void testSmallRouteChunk() {
        List<RouteStop> stops = createMockStops(5);
        List<RouteLink> links = chunkingService.generateChunkedLinks(stops);

        assertEquals(1, links.size());
        RouteLink link1 = links.get(0);
        assertEquals(1, link1.getSequenceChunk());

        String url = link1.getGoogleMapsUrl();
        assertTrue(url.contains("origin=" + stops.get(0).getLatitude()));
        assertTrue(url.contains("destination=" + stops.get(4).getLatitude()));
        assertTrue(url.contains("waypoints="));
    }

    @Test
    @DisplayName("Should generate 1 chunk for exactly 10 stops (1 origin + 9 destinations)")
    void testExactlyTenStops() {
        List<RouteStop> stops = createMockStops(10);
        List<RouteLink> links = chunkingService.generateChunkedLinks(stops);

        assertEquals(1, links.size());
        RouteLink link = links.get(0);
        assertEquals(1, link.getSequenceChunk());
        assertTrue(link.getGoogleMapsUrl().contains("origin=" + stops.get(0).getLatitude()));
        assertTrue(link.getGoogleMapsUrl().contains("destination=" + stops.get(9).getLatitude()));
    }

    @Test
    @DisplayName("Should generate 2 consecutive chunks for 11 stops with carry-over origin")
    void testElevenStopsChunking() {
        List<RouteStop> stops = createMockStops(11);
        List<RouteLink> links = chunkingService.generateChunkedLinks(stops);

        assertEquals(2, links.size());

        // Chunk 1: Stops 0 -> 9 (1 origin + 9 destinations)
        RouteLink chunk1 = links.get(0);
        assertEquals(1, chunk1.getSequenceChunk());
        assertTrue(chunk1.getGoogleMapsUrl().contains("origin=" + stops.get(0).getLatitude()));
        assertTrue(chunk1.getGoogleMapsUrl().contains("destination=" + stops.get(9).getLatitude()));

        // Chunk 2: Stops 9 -> 10 (Stop 9 carried over as origin!)
        RouteLink chunk2 = links.get(1);
        assertEquals(2, chunk2.getSequenceChunk());
        assertTrue(chunk2.getGoogleMapsUrl().contains("origin=" + stops.get(9).getLatitude()),
                "Chunk 2 origin must match the last stop of Chunk 1");
        assertTrue(chunk2.getGoogleMapsUrl().contains("destination=" + stops.get(10).getLatitude()));
    }

    @Test
    @DisplayName("Should generate 3 consecutive chunks for 25 stops carrying over boundary stops")
    void testTwentyFiveStopsChunking() {
        List<RouteStop> stops = createMockStops(25);
        List<RouteLink> links = chunkingService.generateChunkedLinks(stops);

        assertEquals(3, links.size());

        // Chunk 1: Stops 0 to 9
        assertEquals(1, links.get(0).getSequenceChunk());
        assertTrue(links.get(0).getGoogleMapsUrl().contains("origin=" + stops.get(0).getLatitude()));
        assertTrue(links.get(0).getGoogleMapsUrl().contains("destination=" + stops.get(9).getLatitude()));

        // Chunk 2: Stops 9 to 18
        assertEquals(2, links.get(1).getSequenceChunk());
        assertTrue(links.get(1).getGoogleMapsUrl().contains("origin=" + stops.get(9).getLatitude()));
        assertTrue(links.get(1).getGoogleMapsUrl().contains("destination=" + stops.get(18).getLatitude()));

        // Chunk 3: Stops 18 to 24
        assertEquals(3, links.get(2).getSequenceChunk());
        assertTrue(links.get(2).getGoogleMapsUrl().contains("origin=" + stops.get(18).getLatitude()));
        assertTrue(links.get(2).getGoogleMapsUrl().contains("destination=" + stops.get(24).getLatitude()));
    }
}
