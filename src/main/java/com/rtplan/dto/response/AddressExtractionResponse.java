package com.rtplan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressExtractionResponse {

    @Builder.Default
    private List<String> deliveryAddresses = new ArrayList<>();

    private String primaryFromAddress;

    @Builder.Default
    private List<FromAddressPreset> fromAddresses = new ArrayList<>();

    /**
     * Alias getter to provide backwards-compatibility with clients expecting 'addresses'
     */
    public List<String> getAddresses() {
        return deliveryAddresses;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FromAddressPreset {
        private String label;
        private String address;
    }
}
