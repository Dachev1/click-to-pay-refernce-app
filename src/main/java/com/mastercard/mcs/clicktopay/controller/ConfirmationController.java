package com.mastercard.mcs.clicktopay.controller;

import java.io.IOException;
import java.security.GeneralSecurityException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mastercard.mcs.clicktopay.service.MasterCardC2PConfirmationService;
import com.mcs.clicktopay.confirmations.model.ConfirmationRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@CrossOrigin(origins = "*")
public class ConfirmationController {

    private final MasterCardC2PConfirmationService masterCardC2PConfirmationService;

    public ConfirmationController(MasterCardC2PConfirmationService masterCardC2PConfirmationService) {
        this.masterCardC2PConfirmationService = masterCardC2PConfirmationService;
    }

    @PostMapping("/confirmations")
    public ResponseEntity<Object> postConfirmation(
            @RequestBody ConfirmationRequest confirmationRequest,
            HttpServletRequest request) throws IOException, GeneralSecurityException {

        final String flowId = request.getHeader("X-SRC-CX-FLOW-ID");

        return masterCardC2PConfirmationService.postConfirmation(confirmationRequest, flowId);
    }
}