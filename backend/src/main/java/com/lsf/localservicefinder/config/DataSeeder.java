package com.lsf.localservicefinder.config;

import com.lsf.localservicefinder.entity.ServiceCategory;
import com.lsf.localservicefinder.repository.ServiceCategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ServiceCategoryRepository categoryRepository;

    public DataSeeder(ServiceCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            List<String> defaults = List.of(
                    "Electrician", "Plumber", "Carpenter", "AC Repair",
                    "House Cleaning", "Painter", "Pest Control", "Appliance Repair",
                    "Salon at Home", "Gardening"
            );
            defaults.forEach(name -> categoryRepository.save(
                    ServiceCategory.builder().name(name).build()));
        }
    }
}
