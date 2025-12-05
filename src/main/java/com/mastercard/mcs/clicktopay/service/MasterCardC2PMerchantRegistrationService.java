package com.mastercard.mcs.clicktopay.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.mastercard.mcs.clicktopay.constants.AppConstants;
import com.mcs.clicktopay.merchantregistration.api.MerchantRegistrationApi;
import com.mcs.clicktopay.merchantregistration.invoker.ApiClient;
import com.mcs.clicktopay.merchantregistration.invoker.ApiException;
import com.mcs.clicktopay.merchantregistration.invoker.ApiResponse;
import com.mcs.clicktopay.merchantregistration.model.DpaAddUpdateRequest;
import com.mcs.clicktopay.merchantregistration.model.DpaAddUpdateResponse;
import com.mcs.clicktopay.merchantregistration.model.DpaBatchStatus;

@Service
public class MasterCardC2PMerchantRegistrationService extends MasterCardCommonService {

    private static final String ONBOARDING = "/onboarding";

    protected MerchantRegistrationApi createMerchantRegistrationApi(ApiClient apiClient) {
        return new MerchantRegistrationApi(apiClient);
    }

    public ResponseEntity<Object> submitDpaBatch(String srcClientId, DpaAddUpdateRequest requestBody,
            String correlationId) throws IOException, GeneralSecurityException {
        try {
            String basePath = production ? productionBaseUrl : sandboxBaseUrl;
            
            ApiClient apiClient = getMerchantApiClient();
            apiClient.setBasePath(basePath + ONBOARDING);

            MerchantRegistrationApi merchantRegistrationApi = createMerchantRegistrationApi(apiClient);
            
            // Use WithHttpInfo to get ApiResponse (body + headers + status)
            ApiResponse<DpaAddUpdateResponse> submitBatchApiResponse = merchantRegistrationApi.bulkAddUpdateDpaWithHttpInfo(
                    correlationId, srcClientId, requestBody);

            Map<String, Object> result = new HashMap<>();
            result.put(AppConstants.KEY_BODY, submitBatchApiResponse.getData());
            result.put(AppConstants.KEY_HEADERS, submitBatchApiResponse.getHeaders());
            result.put(AppConstants.KEY_STATUS_CODE, submitBatchApiResponse.getStatusCode());

            return ResponseEntity.status(submitBatchApiResponse.getStatusCode()).body(result);
        } catch (ApiException e) {
            // If ApiException provides headers, extract them; else provide error only
            Map<String, Object> error = new HashMap<>();
            error.put(AppConstants.KEY_BODY, e.getResponseBody());
            error.put(AppConstants.KEY_HEADERS, e.getResponseHeaders());
            error.put(AppConstants.KEY_STATUS_CODE, e.getCode());

            return ResponseEntity.status(e.getCode()).body(error);
        }
    }

    public ResponseEntity<Object> getDpaBatchStatus(String srcClientId, String batchId, String correlationId)
            throws IOException, GeneralSecurityException {
        try {
            String basePath = production ? productionBaseUrl : sandboxBaseUrl;

            ApiClient apiClient = getMerchantApiClient();
            apiClient.setBasePath(basePath + ONBOARDING);

            MerchantRegistrationApi merchantRegistrationApi = createMerchantRegistrationApi(apiClient);
            
            // Use WithHttpInfo to get headers and status if available
            ApiResponse<DpaBatchStatus> dpaBatchStatusResponse = merchantRegistrationApi.getDpaBatchStatusWithHttpInfo(
                    correlationId, srcClientId, batchId);

            Map<String, Object> result = new HashMap<>();
            result.put(AppConstants.KEY_BODY, dpaBatchStatusResponse.getData());
            result.put(AppConstants.KEY_HEADERS, dpaBatchStatusResponse.getHeaders());
            result.put(AppConstants.KEY_STATUS_CODE, dpaBatchStatusResponse.getStatusCode());

            return ResponseEntity.status(dpaBatchStatusResponse.getStatusCode()).body(result);
        } catch (ApiException e) {
            Map<String, Object> error = new HashMap<>();
            error.put(AppConstants.KEY_BODY, e.getResponseBody());
            error.put(AppConstants.KEY_HEADERS, e.getResponseHeaders());
            error.put(AppConstants.KEY_STATUS_CODE, e.getCode());

            return ResponseEntity.status(e.getCode()).body(error);
        }
    }
}