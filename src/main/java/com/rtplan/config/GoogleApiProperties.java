package com.rtplan.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app")
public class GoogleApiProperties {

    private Integrations integrations = new Integrations();
    private Cors cors = new Cors();

    @Getter
    @Setter
    public static class Integrations {
        private Gemini gemini = new Gemini();
        private GoogleMaps googleMaps = new GoogleMaps();
    }

    @Getter
    @Setter
    public static class Gemini {
        private String apiKey;
        private String model = "gemini-1.5-flash";
        private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }

    @Getter
    @Setter
    public static class GoogleMaps {
        private String apiKey;
        private String geocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json";
        private String routesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173");
        private List<String> allowedMethods = List.of("GET", "POST", "PUT", "DELETE", "OPTIONS");
        private List<String> allowedHeaders = List.of("*");
    }
}
