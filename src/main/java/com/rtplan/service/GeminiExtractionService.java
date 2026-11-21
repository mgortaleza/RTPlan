package com.rtplan.service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.rtplan.config.GoogleApiProperties;
import com.rtplan.dto.response.AddressExtractionResponse;
import com.rtplan.exception.ExternalApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiExtractionService {

    private final RestClient restClient;
    private final GoogleApiProperties properties;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            You are an expert OCR and logistics dispatch assistant specialized in delivery manifests and shipping invoices.
            Analyze all uploaded delivery manifest screenshots and extract:
            1. All "From" / Origin / Shipper / Pickup locations.
            2. All "To" / Destination / Customer / Delivery drop-off locations.

            Strict requirements:
            1. Return ONLY valid JSON in the exact structure shown below.
            2. Do NOT wrap the JSON in Markdown code fences (no ```json ... ```).
            3. Each address must be complete with street address, suite/apt/unit if present, city, state, and ZIP code.
            4. Remove duplicate addresses.
            5. In "fromAddresses", extract every unique origin, shipper, or pickup facility found across all screenshots. If a facility/pharmacy/depot name is visible (e.g. "UCLA MP1 Pharmacy", "Ronald Reagan Pharmacy"), put that in "label". If no business name is present, use the street name or city for the label.
            6. In "primaryFromAddress", identify the single most frequent or prominent origin address where the driver will start the route. If only one From address is present, use that address. If multiple are present, determine the most prominent/frequent one. If no From address is found anywhere in the images, set primaryFromAddress to null.
            7. In "deliveryAddresses", extract all customer / drop-off delivery addresses.

            Example output structure:
            {
              "primaryFromAddress": "200 Medical Plaza Suite 135, Los Angeles, CA 90095",
              "fromAddresses": [
                { "label": "UCLA MP1 Pharmacy", "address": "200 Medical Plaza Suite 135, Los Angeles, CA 90095" },
                { "label": "Ronald Reagan Pharmacy", "address": "757 Westwood Plaza, Los Angeles, CA 90095" }
              ],
              "deliveryAddresses": [
                "10320 Almayo Ave Apt 2, Los Angeles, CA 90064",
                "2567 Veteran Ave, Rancho Park, CA 90064"
              ]
            }
            """;

    /**
     * Extracts addresses and origin presets from uploaded manifest screenshots using Gemini Vision.
     *
     * @param files Multipart images (manifest screenshots)
     * @return AddressExtractionResponse with primary origin, origin presets, and delivery stops
     */
    public AddressExtractionResponse extractAddressesFromImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("At least one image file must be uploaded");
        }

        var geminiProps = properties.getIntegrations().getGemini();
        String apiKey = geminiProps.getApiKey();
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GEMINI_API_KEY")) {
            log.warn("Gemini API key is not configured. Falling back to mock extracted addresses for testing.");
            return generateMockExtractedAddresses();
        }

        String url = String.format("%s/models/%s:generateContent?key=%s",
                geminiProps.getBaseUrl(), geminiProps.getModel(), apiKey);

        try {
            Map<String, Object> requestPayload = buildGeminiPayload(files);

            String responseBody = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            return parseGeminiResponse(responseBody);
        } catch (Exception ex) {
            log.error("Failed to extract addresses via Gemini API: {}", ex.getMessage(), ex);
            throw new ExternalApiException("Error communicating with Gemini API: " + ex.getMessage(), ex);
        }
    }

    private Map<String, Object> buildGeminiPayload(MultipartFile[] files) throws IOException {
        List<Map<String, Object>> contentParts = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String base64Data = Base64.getEncoder().encodeToString(file.getBytes());

            Map<String, Object> inlineData = Map.of(
                    "mimeType", mimeType,
                    "data", base64Data
            );
            contentParts.add(Map.of("inlineData", inlineData));
        }

        contentParts.add(Map.of("text", "Extract all origin/from facilities and delivery stops from these manifest screenshots into the required JSON format."));

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
        );

        Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "temperature", 0.1
        );

        return Map.of(
                "systemInstruction", systemInstruction,
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", contentParts
                )),
                "generationConfig", generationConfig
        );
    }

    private AddressExtractionResponse parseGeminiResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return new AddressExtractionResponse();
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) {
                log.warn("Gemini API returned no candidates");
                return new AddressExtractionResponse();
            }

            JsonNode textNode = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                return new AddressExtractionResponse();
            }

            String rawJson = textNode.asText().trim();
            if (rawJson.startsWith("```json")) {
                rawJson = rawJson.substring(7);
            } else if (rawJson.startsWith("```")) {
                rawJson = rawJson.substring(3);
            }
            if (rawJson.endsWith("```")) {
                rawJson = rawJson.substring(0, rawJson.length() - 3);
            }
            rawJson = rawJson.trim();

            JsonNode parsed = objectMapper.readTree(rawJson);

            // Case A: Structured response matching AddressExtractionResponse
            if (parsed.isObject()) {
                List<String> deliveryAddrs = new ArrayList<>();
                JsonNode deliveryNode = parsed.path("deliveryAddresses");
                if (deliveryNode.isArray()) {
                    for (JsonNode item : deliveryNode) {
                        if (item.isTextual() && !item.asText().isBlank()) {
                            deliveryAddrs.add(item.asText().trim());
                        }
                    }
                } else {
                    // Fallback to "addresses"
                    JsonNode addrsNode = parsed.path("addresses");
                    if (addrsNode.isArray()) {
                        for (JsonNode item : addrsNode) {
                            if (item.isTextual() && !item.asText().isBlank()) {
                                deliveryAddrs.add(item.asText().trim());
                            }
                        }
                    }
                }

                String primaryFrom = parsed.hasNonNull("primaryFromAddress") 
                        ? parsed.get("primaryFromAddress").asText().trim() 
                        : null;

                List<AddressExtractionResponse.FromAddressPreset> fromList = new ArrayList<>();
                JsonNode fromNode = parsed.path("fromAddresses");
                if (fromNode.isArray()) {
                    for (JsonNode item : fromNode) {
                        if (item.isObject()) {
                            String addr = item.path("address").asText("").trim();
                            String label = item.path("label").asText("").trim();
                            if (!addr.isBlank()) {
                                fromList.add(new AddressExtractionResponse.FromAddressPreset(
                                        label.isBlank() ? addr.split(",")[0].trim() : label,
                                        addr
                                ));
                            }
                        } else if (item.isTextual() && !item.asText().isBlank()) {
                            String addr = item.asText().trim();
                            fromList.add(new AddressExtractionResponse.FromAddressPreset(
                                    addr.split(",")[0].trim(),
                                    addr
                                ));
                        }
                    }
                }

                // If primaryFrom is missing but fromList has items, designate the first one as primary
                if ((primaryFrom == null || primaryFrom.isBlank()) && !fromList.isEmpty()) {
                    primaryFrom = fromList.get(0).getAddress();
                }

                log.info("Extracted {} delivery stops and {} origin presets (primary: {})",
                        deliveryAddrs.size(), fromList.size(), primaryFrom);

                return AddressExtractionResponse.builder()
                        .deliveryAddresses(deliveryAddrs)
                        .primaryFromAddress(primaryFrom)
                        .fromAddresses(fromList)
                        .build();
            }

            // Case B: Legacy array of address strings
            if (parsed.isArray()) {
                List<String> addresses = objectMapper.readValue(rawJson, new TypeReference<List<String>>() {});
                log.info("Extracted legacy array of {} addresses from manifest screenshots", addresses.size());
                return AddressExtractionResponse.builder()
                        .deliveryAddresses(addresses)
                        .build();
            }

            return new AddressExtractionResponse();
        } catch (Exception e) {
            log.error("Failed to parse Gemini JSON response: {}", responseBody, e);
            throw new ExternalApiException("Failed to parse Gemini address extraction response: " + e.getMessage(), e);
        }
    }

    private AddressExtractionResponse generateMockExtractedAddresses() {
        return AddressExtractionResponse.builder()
                .primaryFromAddress("200 Medical Plaza Suite 135, Los Angeles, CA 90095")
                .fromAddresses(List.of(
                        new AddressExtractionResponse.FromAddressPreset("UCLA MP1 Pharmacy", "200 Medical Plaza Suite 135, Los Angeles, CA 90095"),
                        new AddressExtractionResponse.FromAddressPreset("Ronald Reagan Pharmacy", "757 Westwood Plaza, Los Angeles, CA 90095")
                ))
                .deliveryAddresses(List.of(
                        "100 N Main St, Springfield, IL 62701",
                        "450 S 6th St, Springfield, IL 62701",
                        "1100 S Grand Ave E, Springfield, IL 62703",
                        "2501 Wabash Ave, Springfield, IL 62704",
                        "3200 Clear Lake Ave, Springfield, IL 62702"
                ))
                .build();
    }
}
