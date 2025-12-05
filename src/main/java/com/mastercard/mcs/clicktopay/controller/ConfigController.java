package com.mastercard.mcs.clicktopay.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    @Value("${srcClientId}")
    private String srcClientId;

    @Value("${srcDpaId}")
    private String srcDpaId;

    @Value("${service.id:}")
    private String serviceId;

    @GetMapping
    public Map<String, String> getConfigValues() {
        Map<String, String> configValues = new HashMap<>();
        configValues.put("srcClientId", srcClientId);
        configValues.put("srcDpaId", srcDpaId);
        configValues.put("serviceId", serviceId);

        return configValues;
    }
}
