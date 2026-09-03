package com.lsf.localservicefinder.controller;

import com.lsf.localservicefinder.entity.ServiceCategory;
import com.lsf.localservicefinder.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class ServiceCategoryController {

    private final ServiceCategoryRepository categoryRepository;

    @GetMapping
    public List<ServiceCategory> getAll() {
        return categoryRepository.findAll();
    }
}
