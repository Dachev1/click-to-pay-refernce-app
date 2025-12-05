package com.mastercard.mcs.clicktopay.service;

import java.io.File;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.ResourceUtils;

import com.mastercard.developer.encryption.EncryptionException;
import com.mastercard.developer.encryption.JweConfig;
import com.mastercard.developer.encryption.JweConfigBuilder;
import com.mastercard.developer.interceptors.OkHttpEncryptionInterceptor;
import com.mastercard.developer.interceptors.OkHttpOAuth1Interceptor;
import com.mastercard.developer.utils.AuthenticationUtils;
import com.mastercard.developer.utils.EncryptionUtils;

import okhttp3.OkHttpClient;

@Service
public class MasterCardCommonService {

	private static final Logger LOGGER = LoggerFactory.getLogger(MasterCardCommonService.class);

	@Value("${production}")
	boolean production;

	@Value("${srcDpaId}")
    public String srcDpaId;

	@Value("${signing.consumerKey:defaultValue}")
	public String consumerKey;

	@Value("${signing.pkcs12KeyFile:defaultValue}")
	private String pkcs12KeyFile;

	@Value("${signing.keyAlias:defaultValue}")
	private String signingKeyAlias;

	@Value("${signing.keyPassword:defaultValue}")
	private String signingKeyPassword;

	@Value("${mastercard.encryption.pkcs12KeyFile:defaultValue}")
	public String mastercardEncryptionPkcs12KeyFile;

	@Value("${mastercard.encryption.keyAlias:defaultValue}")
	public String mastercardEncryptionKeyAlias;

	@Value("${mastercard.encryption.keyPassword:defaultValue}")
	public String mastercardEncryptionKeyPassword;

	@Value("${mastercard.api.base-url.sandbox:defaultValue}")
	public String sandboxBaseUrl;

	@Value("${mastercard.api.base-url.production:defaultValue}")
	public String productionBaseUrl;

	private JweConfig decryptionConfig; // Configuration defined by library

	PrivateKey getSigningKey() throws IOException, GeneralSecurityException {
		File keyFile = ResourceUtils.getFile(ResourceUtils.CLASSPATH_URL_PREFIX + pkcs12KeyFile);
		LOGGER.debug("Loading signing key from file: {}", keyFile.getAbsolutePath());

		return AuthenticationUtils.loadSigningKey(
				keyFile.getPath(),
				signingKeyAlias,
				signingKeyPassword);
	}

	protected com.mcs.clicktopay.merchantregistration.invoker.ApiClient getMerchantApiClient()
			throws IOException, GeneralSecurityException {

		String basePath = production ? productionBaseUrl : sandboxBaseUrl;

		com.mcs.clicktopay.merchantregistration.invoker.ApiClient apiClient = new com.mcs.clicktopay.merchantregistration.invoker.ApiClient();

		apiClient.setBasePath(basePath + "/onboarding");

		OkHttpClient client = apiClient.getHttpClient()
				.newBuilder()
				.addInterceptor(new OkHttpOAuth1Interceptor(consumerKey, getSigningKey()))
				.build();
		apiClient.setHttpClient(client);

		return apiClient;
	}

	protected com.mcs.clicktopay.confirmations.invoker.ApiClient getConfirmationApiClient()
			throws IOException, GeneralSecurityException {

		String basePath = production ? productionBaseUrl : sandboxBaseUrl;

		com.mcs.clicktopay.confirmations.invoker.ApiClient apiClient = new com.mcs.clicktopay.confirmations.invoker.ApiClient();

		apiClient.setBasePath(basePath + "/api");

		OkHttpClient client = apiClient.getHttpClient()
				.newBuilder()
				.addInterceptor(new OkHttpOAuth1Interceptor(consumerKey, getSigningKey()))
				.build();
		apiClient.setHttpClient(client);
		return apiClient;
	}

	protected com.mcs.clicktopay.checkout.invoker.ApiClient getCheckoutApiClient()
			throws IOException, GeneralSecurityException, EncryptionException {

		String basePath = production ? productionBaseUrl : sandboxBaseUrl;

		com.mcs.clicktopay.checkout.invoker.ApiClient apiClient = new com.mcs.clicktopay.checkout.invoker.ApiClient();

		apiClient.setBasePath(basePath + "/api/digital/payments");

		OkHttpClient client = apiClient.getHttpClient()
				.newBuilder()
				.addInterceptor(OkHttpEncryptionInterceptor.from(getDecryptionConfig()))
				.addInterceptor(new OkHttpOAuth1Interceptor(consumerKey, getSigningKey()))
				.build();
		apiClient.setHttpClient(client);
		
		return apiClient;

	}

	public JweConfig getDecryptionConfig() throws GeneralSecurityException, IOException, EncryptionException {
		if (ObjectUtils.isEmpty(decryptionConfig)) {
			File decryptionCert = ResourceUtils.getFile("classpath:"+mastercardEncryptionPkcs12KeyFile);
			PrivateKey decryptionKey = EncryptionUtils.loadDecryptionKey(decryptionCert.getPath(),
					mastercardEncryptionKeyAlias, mastercardEncryptionKeyPassword);
			decryptionConfig = JweConfigBuilder.aJweEncryptionConfig()
					.withEncryptionPath("undefined", "undefined")
					.withDecryptionKey(decryptionKey)
					.withDecryptionPath("$.encryptedPayload", "$")
					.withEncryptedValueFieldName("encryptedPayload")
					.build();
		}

		return decryptionConfig;
	}
}
