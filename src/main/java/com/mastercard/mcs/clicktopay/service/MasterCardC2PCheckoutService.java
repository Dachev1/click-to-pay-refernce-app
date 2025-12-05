package com.mastercard.mcs.clicktopay.service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.mastercard.developer.encryption.EncryptionException;
import com.mastercard.developer.encryption.JweEncryption;
import com.mastercard.developer.oauth.OAuth;
import com.mastercard.mcs.clicktopay.constants.AppConstants;
import com.mcs.clicktopay.checkout.api.CheckoutApi;
import com.mcs.clicktopay.checkout.invoker.ApiException;
import com.mcs.clicktopay.checkout.model.CheckoutRequest;
import com.mcs.clicktopay.checkout.model.CheckoutResponse;
import com.mcs.clicktopay.checkout.model.CheckoutResponseJWS;
import com.mcs.clicktopay.checkout.model.CheckoutResponseJWSPayload;
import com.mcs.clicktopay.checkout.model.Payload;
import com.nimbusds.jose.JWSObject;

@Service
public class MasterCardC2PCheckoutService extends MasterCardCommonService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Gson gson = new Gson();

    /*
     * You can use this method to fetch transaction credentials for the selected
     * card from Click to Pay.
     * 
     * Note: This currently does not work as is, due to the limitations of the
     * Mastercard client-encryption library.
     * And the way the Click to Pay Checkout API YAML is structured. Due to this,
     * the other method is being used.
     */
    public CheckoutResponse fetchTransactionCredentials(CheckoutRequest request, String flowId, String responseHost)
            throws IOException, GeneralSecurityException, ApiException, EncryptionException {
        CheckoutApi api = new CheckoutApi(getCheckoutApiClient());
        
        return api.postTransactionCredentials(request, flowId, responseHost);
    }

    public ResponseEntity<Object> customFetchTransactionCredentials(
            CheckoutRequest request, String flowId, String responseHost)
            throws URISyntaxException, IOException, GeneralSecurityException {

        String route = production ? productionBaseUrl : sandboxBaseUrl;
        route = route + "/api/digital/payments/transaction/credentials";
        URI uri = new URI(route);

        HttpHeaders requestHttpHeaders = new HttpHeaders();
        requestHttpHeaders.setContentType(MediaType.APPLICATION_JSON);

        if (flowId != null) {
            requestHttpHeaders.add("X-Src-Cx-Flow-Id", flowId);
        }
        if (responseHost != null) {
            requestHttpHeaders.add("X-Src-Response-Host", responseHost);
            requestHttpHeaders.add("SRC-DSA-Id", srcDpaId);
        }

        String payload = gson.toJson(request);

        String authHeader = OAuth.getAuthorizationHeader(
                uri,
                HttpMethod.POST.name(),
                payload,
                StandardCharsets.UTF_8,
                consumerKey,
                getSigningKey());

        requestHttpHeaders.add(OAuth.AUTHORIZATION_HEADER_NAME, authHeader);

        HttpEntity<String> entity = new HttpEntity<>(payload, requestHttpHeaders);

        try {
            ResponseEntity<String> responseEntity = restTemplate.postForEntity(uri, entity, String.class);

            String responseBody = responseEntity.getBody();

            Map<String, Object> checkoutResponseMap = gson.fromJson(responseBody, new TypeToken<Map<String, Object>>() {
            });
            JWSObject jwsObject = JWSObject.parse(checkoutResponseMap.get("checkoutResponseJWS").toString());
            Map<String, Object> jwsResponsePayload = jwsObject.getPayload().toJSONObject();

            String decryptedPayload = JweEncryption.decryptPayload(gson.toJson(jwsResponsePayload),
                    getDecryptionConfig());

            jwsResponsePayload.put("encryptedPayload", gson.fromJson(decryptedPayload, Payload.class));

            CheckoutResponse checkoutResponse = new CheckoutResponse();
            CheckoutResponseJWS checkoutResponseJWS = new CheckoutResponseJWS();
            CheckoutResponseJWSPayload checkoutResponseJWSPayload = gson.fromJson(gson.toJson(jwsResponsePayload),
                    CheckoutResponseJWSPayload.class);

            checkoutResponseJWS.setJwsPayload(checkoutResponseJWSPayload);
            checkoutResponse.setCheckoutResponseJWS(checkoutResponseJWS);

            // Build response map for client (SonarQube: use getStatusCode().value())
            Map<String, Object> result = new HashMap<>();
            result.put(AppConstants.KEY_BODY, checkoutResponse);
            result.put(AppConstants.KEY_HEADERS, responseEntity.getHeaders());
            result.put(AppConstants.KEY_STATUS_CODE, responseEntity.getStatusCode().value());

            return ResponseEntity.status(responseEntity.getStatusCode()).body(result);
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            // Handles 4xx and 5xx HTTP errors from RestTemplate
            Map<String, Object> error = new HashMap<>();
            error.put(AppConstants.KEY_BODY, ex.getResponseBodyAsString());
            error.put(AppConstants.KEY_HEADERS, ex.getResponseHeaders());
            error.put(AppConstants.KEY_STATUS_CODE, ex.getStatusCode().value());

            return ResponseEntity.status(ex.getStatusCode()).body(error);
        } catch (Exception e) {
            // Handles all other errors (parsing, logic, etc.)
            Map<String, Object> error = new HashMap<>();
            error.put(AppConstants.KEY_BODY, e.getMessage());
            error.put(AppConstants.KEY_HEADERS, null);
            error.put(AppConstants.KEY_STATUS_CODE, 500);

            return ResponseEntity.status(500).body(error);
        }
    }
}