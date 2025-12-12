package com.mastercard.mcs.clicktopay.controller;

import java.io.IOException;
import java.net.URISyntaxException;
import java.security.GeneralSecurityException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mastercard.mcs.clicktopay.service.MasterCardC2PCheckoutService;
import com.mcs.clicktopay.checkout.model.CheckoutRequest;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class CheckoutController {

    private final MasterCardC2PCheckoutService masterCardC2PCheckoutService;

    public CheckoutController(MasterCardC2PCheckoutService service) {
        this.masterCardC2PCheckoutService = service;
    }

    @PostMapping("/transaction/credentials")
    public ResponseEntity<Object> processTransactionCredentials(
            @RequestBody CheckoutRequest checkoutRequest, HttpServletRequest request)
            throws IOException, GeneralSecurityException, URISyntaxException {

        final String flowId = request.getHeader("X-SRC-CX-FLOW-ID");
        final String responseHost = request.getHeader("X-SRC-RESPONSE-HOST");

        return masterCardC2PCheckoutService.customFetchTransactionCredentials(checkoutRequest, flowId, responseHost);
    }

}