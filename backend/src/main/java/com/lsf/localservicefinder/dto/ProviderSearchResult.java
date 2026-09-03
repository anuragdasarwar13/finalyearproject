package com.lsf.localservicefinder.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @Builder
public class ProviderSearchResult {
    private Long providerId;
    private String fullName;
    private String category;
    private String bio;
    private Double hourlyRate;
    private Double rating;
    private Integer totalReviews;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double distanceKm;
}
