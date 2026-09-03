package com.lsf.localservicefinder.controller;

import com.lsf.localservicefinder.dto.ProviderSearchResult;
import com.lsf.localservicefinder.entity.AvailabilitySlot;
import com.lsf.localservicefinder.entity.ServiceProvider;
import com.lsf.localservicefinder.repository.AvailabilitySlotRepository;
import com.lsf.localservicefinder.repository.ServiceProviderRepository;
import com.lsf.localservicefinder.security.AuthenticatedUser;
import com.lsf.localservicefinder.service.ProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderService providerService;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final ServiceProviderRepository providerRepository;

    /**
     * GET /api/providers/search?lat=..&lng=..&radiusKm=5&categoryId=3
     * Finds providers within radiusKm (default 5km) of the given point.
     * This endpoint is public so users can browse before logging in.
     */
    @GetMapping("/search")
    public List<ProviderSearchResult> search(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) Long categoryId) {
        return providerService.search(lat, lng, radiusKm, categoryId);
    }

    @GetMapping("/{id}")
    public ServiceProvider getById(@PathVariable Long id) {
        return providerService.getById(id);
    }

    @GetMapping("/{id}/availability")
    public List<AvailabilitySlot> getAvailability(@PathVariable Long id) {
        return availabilitySlotRepository.findByProviderId(id);
    }

    /** Provider adds a recurring weekly availability slot to their own profile. */
    @PostMapping("/me/availability")
    public AvailabilitySlot addMyAvailability(@RequestBody AvailabilitySlot slot) {
        AuthenticatedUser me = (AuthenticatedUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        ServiceProvider provider = providerRepository.findByUserId(me.userId())
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user is not a registered provider"));

        slot.setId(null);
        slot.setProvider(provider);
        return availabilitySlotRepository.save(slot);
    }

    /** Provider toggles whether they are currently accepting new bookings. */
    @PatchMapping("/me/availability-toggle")
    public ServiceProvider toggleAvailable(@RequestParam boolean available) {
        AuthenticatedUser me = (AuthenticatedUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        ServiceProvider provider = providerRepository.findByUserId(me.userId())
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user is not a registered provider"));
        provider.setAvailable(available);
        return providerRepository.save(provider);
    }
}
