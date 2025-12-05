package com.mastercard.mcs.clicktopay.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.mastercard.mcs.clicktopay.constants.AppConstants;
import com.mcs.clicktopay.confirmations.api.DefaultApi;
import com.mcs.clicktopay.confirmations.invoker.ApiClient;
import com.mcs.clicktopay.confirmations.invoker.ApiException;
import com.mcs.clicktopay.confirmations.invoker.ApiResponse;
import com.mcs.clicktopay.confirmations.model.ConfirmationRequest;

@Service
public class MasterCardC2PConfirmationService extends MasterCardCommonService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MasterCardC2PConfirmationService.class);

    public ResponseEntity<Object> postConfirmation(ConfirmationRequest request, String flowId)
            throws IOException, GeneralSecurityException {
        LOGGER.info("Posting confirmation for flowId: {}", flowId);

        ApiClient apiClient = getConfirmationApiClient();
        DefaultApi defaultApi = getDefaultApi(apiClient);

        Map<String, Object> result = new HashMap<>();

        try {
            // Use WithHttpInfo to get status, headers, and (if present) body
            ApiResponse<Void> apiResponse = defaultApi.postConfirmationWithHttpInfo(request, flowId);

            result.put(AppConstants.KEY_BODY, null); // 204 No Content, no body
            result.put(AppConstants.KEY_HEADERS, apiResponse.getHeaders());
            result.put(AppConstants.KEY_STATUS_CODE, apiResponse.getStatusCode());

            return ResponseEntity.status(apiResponse.getStatusCode()).body(result);
        } catch (ApiException e) {
            result.put(AppConstants.KEY_BODY, e.getResponseBody());
            result.put(AppConstants.KEY_HEADERS, e.getResponseHeaders());
            result.put(AppConstants.KEY_STATUS_CODE, e.getCode());

            return ResponseEntity.status(e.getCode()).body(result);
        }
    }

    protected DefaultApi getDefaultApi(ApiClient apiClient) {
        return new DefaultApi(apiClient);
    }
}