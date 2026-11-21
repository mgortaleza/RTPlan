package com.rtplan.service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.rtplan.config.GoogleApiProperties;
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
            You are an expert OCR and logistics dispatch assistant.
            Analyze all uploaded delivery manifest screenshots and extract every delivery/customer address.
            Strict requirements:
            1. Return ONLY a valid JSON array of address strings.
            2. Do NOT wrap the JSON in Markdown code fences (no ```json ... ```).
            3. Each address in the array must be complete with street number, street name, city, state, and ZIP code if present.
            4. Remove duplicate addresses and ignore manifest headers or driver notes.
            Example output format:
            ["123 Elm St, Springfield, IL 62701", "742 Evergreen Terrace, Springfield, IL 62704"]
            """;

    /**
     * Extracts addresses from uploaded manifest screenshots using Gemini 1.5 Flash.
     *
     * @param files Multipart images (manifest screenshots)
     * @return List of extracted address strings
     */
    public List<String> extractAddressesFromImages(MultipartFile[] files) {
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
            throw new ExternalApiException("Error communicating with Gemini 1.5 Flash API: " + ex.getMessage(), ex);
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

        contentParts.add(Map.of("text", "Extract all delivery addresses from these manifest screenshots into a JSON array."));

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

    private List<String> parseGeminiResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return Collections.emptyList();
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) {
                log.warn("Gemini API returned no candidates");
                return Collections.emptyList();
            }

            JsonNode textNode = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                return Collections.emptyList();
            }

            String rawJson = textNode.asText().trim();
            // Handle cases where model might wrap in code blocks despite prompt
            if (rawJson.startsWith("```json")) {
                rawJson = rawJson.substring(7);
            } else if (rawJson.startsWith("```")) {
                rawJson = rawJson.substring(3);
            }
            if (rawJson.endsWith("```")) {
                rawJson = rawJson.substring(0, rawJson.length() - 3);
            }
            rawJson = rawJson.trim();

            List<String> addresses = objectMapper.readValue(rawJson, new TypeReference<List<String>>() {});
            log.info("Successfully extracted {} addresses from manifest screenshots", addresses.size());
            return addresses;
        } catch (Exception e) {
            log.error("Failed to parse Gemini JSON response: {}", responseBody, e);
            throw new ExternalApiException("Failed to parse Gemini address extraction response: " + e.getMessage(), e);
        }
    }

    private List<String> generateMockExtractedAddresses() {
        return List.of(
                "100 N Main St, Springfield, IL 62701",
                "450 S 6th St, Springfield, IL 62701",
                "1100 S Grand Ave E, Springfield, IL 62703",
                "2501 Wabash Ave, Springfield, IL 62704",
                "3200 Clear Lake Ave, Springfield, IL 62702"
        );
    }
}
