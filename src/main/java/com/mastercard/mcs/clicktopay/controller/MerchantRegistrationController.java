package com.mastercard.mcs.clicktopay.controller;

import java.io.IOException;
import java.security.GeneralSecurityException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mastercard.mcs.clicktopay.service.MasterCardC2PMerchantRegistrationService;
import com.mcs.clicktopay.merchantregistration.model.DpaAddUpdateRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/srci")
public class MerchantRegistrationController {

    private final MasterCardC2PMerchantRegistrationService masterCardC2PMerchantRegistrationService;

    public MerchantRegistrationController(
            MasterCardC2PMerchantRegistrationService masterCardC2PMerchantRegistrationService) {
        this.masterCardC2PMerchantRegistrationService = masterCardC2PMerchantRegistrationService;
    }

    @PostMapping("/{srcClientId}/dpas/batch")
    public ResponseEntity<Object> submitDpaBatch(
            @PathVariable String srcClientId,
            @RequestBody DpaAddUpdateRequest requestBody,
            HttpServletRequest request) throws IOException, GeneralSecurityException {

        final String correlationId = request.getHeader("correlation-id");
        if (correlationId == null || correlationId.isEmpty()) {
            throw new IllegalArgumentException("Missing required header: correlation-id");
        }

        return masterCardC2PMerchantRegistrationService.submitDpaBatch(srcClientId, requestBody, correlationId);
    }

    @GetMapping("/{srcClientId}/dpas/batch/status/{batchId}")
    public ResponseEntity<Object> getBatchStatus(
            @PathVariable String srcClientId,
            @PathVariable String batchId,
            HttpServletRequest request) throws IOException, GeneralSecurityException {

        final String correlationId = request.getHeader("correlation-id");
        if (correlationId == null || correlationId.isEmpty()) {
            throw new IllegalArgumentException("Missing required header: correlation-id");
        }

        return masterCardC2PMerchantRegistrationService.getDpaBatchStatus(srcClientId, batchId, correlationId);
    }
}