# RTPlan - Multi-Stop Logistics & Routing API

Spring Boot 4.x REST API middleman for multi-stop logistics routing. Designed to serve both a **React Web Frontend (Phase 1)** and a **Native Kotlin Android App (Phase 2)**.

## Core Features
1. **Gemini 1.5 Flash OCR Address Extraction**:
   Accepts multipart delivery manifest screenshots and prompts Gemini 1.5 Flash using `responseMimeType: "application/json"` to extract an array of addresses for user verification.
2. **Google Maps Geocoding**:
   Converts raw and user-verified addresses to high-precision `DECIMAL(9,6)` Latitude/Longitude coordinates.
3. **Google Routes API TSP Optimization**:
   Sequences stops to solve the Traveling Salesperson Problem (with automatic 2-opt/nearest-neighbor heuristic fallback).
4. **Google Maps Deep Link Chunking**:
   Splits routes into deep links where each link contains at most 1 origin and 9 destinations (10 stops max per URL), carrying over the final stop of chunk $N$ as the origin of chunk $N+1$.
5. **Persistence on Microsoft SQL Server**:
   Connects to SQL Server at `db1.ads.netyx.net` using Windows Authentication (Integrated Security) and Spring Data JPA.

---

## Tech Stack
- **Java 25 LTS**
- **Spring Boot 4.2.0** (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`)
- **Microsoft SQL Server JDBC Driver** (`com.microsoft.sqlserver:mssql-jdbc`) with Windows Authentication (`mssql-jdbc_auth`)
- **Project Lombok** (1.18.48)
- **Jackson 3** (`tools.jackson`)
- **Spring 7 RestClient**

---

## Configuration & Environment Variables

Configure the following environment variables or update `src/main/resources/application.yml`:

| Environment Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `db1.ads.netyx.net` | Microsoft SQL Server host |
| `DB_PORT` | `1433` | SQL Server port |
| `DB_NAME` | `RTPlan` | SQL Server database name |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `GOOGLE_MAPS_API_KEY` | - | Google Maps / Routes API key |

---

## API Documentation

### 1. Extract Addresses from Manifest Images
**`POST /api/routes/extract`**
- **Content-Type**: `multipart/form-data`
- **Parameters**: `files` (one or more image files: PNG, JPEG, WEBP)
- **Response**: `200 OK`
```json
[
  "100 N Main St, Springfield, IL 62701",
  "450 S 6th St, Springfield, IL 62701",
  "1100 S Grand Ave E, Springfield, IL 62703"
]
```

### 2. Optimize & Persist Route
**`POST /api/routes/optimize`**
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "driverId": 1,
  "routeDate": "2026-11-20",
  "stops": [
    {
      "originalExtractedText": "100 N Main St",
      "correctedAddress": "100 N Main St, Springfield, IL 62701",
      "isManuallyEdited": false
    },
    {
      "originalExtractedText": "450 S 6th St",
      "correctedAddress": "450 S 6th St, Springfield, IL 62701",
      "isManuallyEdited": true
    },
    {
      "originalExtractedText": "1100 S Grand Ave",
      "correctedAddress": "1100 S Grand Ave E, Springfield, IL 62703",
      "isManuallyEdited": false
    }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "manifestId": 1,
  "driverId": 1,
  "driverName": "Jane Doe",
  "routeDate": "2026-11-20",
  "status": "OPTIMIZED",
  "createdAt": "2026-11-20T16:30:00",
  "stops": [
    {
      "stopId": 1,
      "manifestId": 1,
      "originalExtractedText": "100 N Main St",
      "correctedAddress": "100 N Main St, Springfield, IL 62701",
      "isManuallyEdited": false,
      "latitude": 39.801234,
      "longitude": -89.643210,
      "optimizedSequence": 0
    },
    {
      "stopId": 2,
      "manifestId": 1,
      "originalExtractedText": "450 S 6th St",
      "correctedAddress": "450 S 6th St, Springfield, IL 62701",
      "isManuallyEdited": true,
      "latitude": 39.794567,
      "longitude": -89.648901,
      "optimizedSequence": 1
    }
  ],
  "links": [
    {
      "linkId": 1,
      "manifestId": 1,
      "sequenceChunk": 1,
      "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&origin=39.801234,-89.643210&destination=39.794567,-89.648901",
      "createdAt": "2026-11-20T16:30:00"
    }
  ]
}
```

### 3. Retrieve Manifest
**`GET /api/routes/manifests/{id}`**
- **Response**: `200 OK` (Format matches `/optimize` response)

### 4. Driver Management (Utility)
- **`GET /api/drivers`**: List active drivers.
- **`POST /api/drivers`**: Register a new driver (`{ "fullName": "Jane Doe", "phoneNumber": "555-0199" }`).
- **`GET /api/drivers/{id}`**: Get driver details.
