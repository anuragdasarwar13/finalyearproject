package com.lsf.localservicefinder.service;

import com.lsf.localservicefinder.dto.ProviderSearchResult;
import com.lsf.localservicefinder.entity.ServiceProvider;
import com.lsf.localservicefinder.repository.ServiceProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ServiceProviderRepository providerRepository;

    private static final double DEFAULT_RADIUS_KM = 5.0;

    /**
     * Search providers around (lat, lng) within radiusKm (defaults to 5km).
     * categoryId is optional - null means "search all categories".
     */
    public List<ProviderSearchResult> search(Double lat, Double lng, Double radiusKm, Long categoryId) {
        double radius = (radiusKm != null) ? radiusKm : DEFAULT_RADIUS_KM;

        List<ServiceProvider> providers =
                providerRepository.findProvidersWithinRadius(lat, lng, radius, categoryId);

        return providers.stream()
                .map(p -> ProviderSearchResult.builder()
                        .providerId(p.getId())
                        .fullName(p.getUser().getFullName())
                        .category(p.getCategory().getName())
                        .bio(p.getBio())
                        .hourlyRate(p.getHourlyRate())
                        .rating(p.getRating())
                        .totalReviews(p.getTotalReviews())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .address(p.getAddress())
                        .distanceKm(round2(haversineKm(lat, lng, p.getLatitude(), p.getLongitude())))
                        .build())
                .toList();
    }

    public ServiceProvider getById(Long id) {
        return providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
    }

    /** Great-circle distance between two lat/lng points, in kilometers. */
    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
