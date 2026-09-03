package com.lsf.localservicefinder.repository;

import com.lsf.localservicefinder.entity.ServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {

    Optional<ServiceProvider> findByUserId(Long userId);

    /**
     * Finds providers within `radiusKm` of (lat, lng) using the Haversine formula,
     * computed directly in SQL so distance can also be used for ORDER BY.
     * categoryId is optional - pass null to search across all categories.
     *
     * 6371 = Earth's radius in kilometers.
     */
    @Query(value = """
            SELECT sp.*,
                   (6371 * acos(
                        cos(radians(:lat)) * cos(radians(sp.latitude)) *
                        cos(radians(sp.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(sp.latitude))
                   )) AS distance_km
            FROM service_providers sp
            WHERE sp.available = true
              AND (:categoryId IS NULL OR sp.category_id = :categoryId)
            HAVING distance_km <= :radiusKm
            ORDER BY distance_km ASC
            """, nativeQuery = true)
    List<ServiceProvider> findProvidersWithinRadius(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm,
            @Param("categoryId") Long categoryId
    );
}
