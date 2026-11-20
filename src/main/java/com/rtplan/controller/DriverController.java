package com.rtplan.controller;

import com.rtplan.dto.request.DriverCreateRequest;
import com.rtplan.dto.response.DriverResponse;
import com.rtplan.entity.Driver;
import com.rtplan.exception.ResourceNotFoundException;
import com.rtplan.repository.DriverRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository driverRepository;

    @GetMapping
    public ResponseEntity<List<DriverResponse>> listActiveDrivers() {
        List<DriverResponse> drivers = driverRepository.findByIsActiveTrue().stream()
                .map(DriverResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverResponse> getDriverById(@PathVariable("id") Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with ID: " + id));
        return ResponseEntity.ok(DriverResponse.fromEntity(driver));
    }

    @PostMapping
    public ResponseEntity<DriverResponse> createDriver(@Valid @RequestBody DriverCreateRequest request) {
        Driver driver = Driver.builder()
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        Driver saved = driverRepository.save(driver);
        log.info("Created driver with ID: {}", saved.getDriverId());
        return ResponseEntity.status(HttpStatus.CREATED).body(DriverResponse.fromEntity(saved));
    }
}
