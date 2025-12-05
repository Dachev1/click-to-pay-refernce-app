package com.mastercard.mcs.clicktopay.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class.getName());

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleException(Exception ex) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        com.mcs.clicktopay.checkout.model.Error error = getErrorErrorsError(ex);
        String errorJson = gson.toJson(error);
        LOGGER.error(errorJson);

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private com.mcs.clicktopay.checkout.model.Error getErrorErrorsError(Exception ex) {
        com.mcs.clicktopay.checkout.model.Error standardError = new com.mcs.clicktopay.checkout.model.Error();
        standardError.setReason("UNKNOWN");
        standardError.setMessage(ex.getMessage());
        return standardError;
    }
}
