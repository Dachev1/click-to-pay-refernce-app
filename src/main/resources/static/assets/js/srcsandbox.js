let initSuccess = false;
let recognizedSuccess = false;
let identityValidationSuccess = false;

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        }
    );
    return uuid;
}

function getPublicKeys() {
    $.getJSON(this.sandboxPublicKey, function (data) {
        encParams.keys = data.keys;
    });
}

var callNodeJsAPIUrl = "";
var nodeJSSBSAPIUrl = "";
var nodeJSAuthAPIUrl = "";
var nodeJSStatsAPIUrl = "";
var callAPIUrl = "";
var sandboxTransactionCredentailAPIEndPoint = "";
var sandboxTransactionConfirmationAPIEndPoint = "";
var sandboxPublicKey = "";
var decryptUrl = "";
var host = "";
var transactionCredentialsRelativeURL = "";
var transactionConfirmationRelativeURL = "";
var crypt = new Crypt({ md: "sha256" });
var myCustomJSON = "";

function getConfig() {
    $.getJSON("/assets/js/config.json", function (data) {
        callAPIUrl = data.callAPIUrl;
        sandboxTransactionCredentailAPIEndPoint =
            data.sandboxTransactionCredentailAPIEndPoint;
        sandboxTransactionConfirmationAPIEndPoint =
            data.sandboxTransactionConfirmationAPIEndPoint;
        sandboxPublicKey = data.sandboxPublicKey;
        decryptUrl = data.decryptUrl;
        host = data.sandboxhost;
        transactionCredentialsRelativeURL =
            data.transactionCredentialsRelativeURL;
        transactionConfirmationRelativeURL =
            data.transactionConfirmationRelativeURL;
        callNodeJsAPIUrl = data.callNodeJsAPIUrl;
        nodeJSSBSAPIUrl = data.nodeJSSBSAPIUrl;
        nodeJSAuthAPIUrl = data.nodeJSAuthAPIUrl;
        nodeJSStatsAPIUrl = data.nodeJSStatsAPIUrl;
        getPublicKeys();
        stats("LOAD");
    }).fail(function () {
        console.log("An error has occurred.");
    });
}

const encParams = {
    encContentAlgo: "A128GCM",
    encAlgo: "RSA-OAEP-256",
    encKeyId: "src-fpan-encryption",
    verKeyId: "src-payload-verification",
    verAlgo: "RS256",
    keys: "",
};

function init() {
    stats("INIT");
    showLoader();

    if ($("input[name='authenticationType']").is(":checked")) {
        var authenticationPreferences = {
            payloadRequested: "AUTHENTICATED", 
        };
        console.log("authenticationPreferences", authenticationPreferences);
    }

    if ($("input[name='tasAuth']").is(":checked")) {
        var tafParams = {
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
            authenticationPreferences: {
                payloadRequested: "AUTHENTICATED", 
            },
        };
    }

    var dpaTransactionOptions = {
        transactionAmount: {
            transactionAmount: $("#txnAmount").val(),
            transactionCurrencyCode: $("#txnCurrency").val(),
        },
        transactionType: "PURCHASE",
        dpaBillingPreference: allowBilling == true ? "FULL" : "NONE",
        dpaShippingPreference: allowShipping == true ? "FULL" : "NONE",
        customInputData: {
            "com.mastercard.dcfExperience": "WITHIN_CHECKOUT",
        },
        consumerNationalIdentifierRequested: false,
        dpaAcceptedBillingCountries: [],
        dpaAcceptedShippingCountries: [],
        dpaLocale: $("#dpalocale").val(),
        consumerEmailAddressRequested: $("#consumerEmailAddressRequested").is(
            ":checked"
        ),
        consumerNameRequested: $("#consumerNameRequested").is(":checked"),
        consumerPhoneNumberRequested: $("#consumerPhoneNumberRequested").is(
            ":checked"
        ),
        confirmPayment: confPayment,
        payloadTypeIndicatorCheckout: $(
            "input[name='IndicatorCheckout']:checked"
        ).val(),
        paymentOptions: {
            dpaDynamicDataTtlMinutes: 15,
            dynamicDataType: $("input[name='cryptogram']:checked").val(), 
        },
        ...tafParams, 
    };

    console.log("dpaTransactionOptions", dpaTransactionOptions);
    console.log("authenticationType", authenticationType);

    if (authenticationType) {
        dpaTransactionOptions = {
            ...dpaTransactionOptions,
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
            authenticationPreferences: authenticationPreferences,
        };
    }

    var sampleInitParams = {
        srcInitiatorId: $("#clientid").val(), 
        srciDpaId: $("#dpaid").val(), 
        srciTransactionId: $("#transactionid").val(), 
        dpaTransactionOptions: dpaTransactionOptions, 
        dpaData: {
            dpaPresentationName: "Briklabs",
            dpaUri: "https://mtf.moovetshop.com",
            dpaName: "Briklabs",
        },
    };

    // Define response handlers
    function promiseResolvedHandler(payload) {
        initSuccess = true; 
        showToast("Initialization successful!", "success");
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        initSuccess = false;
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Initialization failed: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }
    
    if (myCustomJSON != "") {
        sampleInitParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }
    
    const initPromise = window.SRCSDK_MASTERCARD.init(sampleInitParams); 
    initPromise
        .then(promiseResolvedHandler) 
        .catch(promiseRejectedHandler);
}

function isRecognized() {
    stats("IS RECOGNIZED");
    showLoader();
    // Define response handlers
    function promiseResolvedHandler(payload) {
        recognized = payload.recognized;
        recognizedSuccess = true; 

        if (payload.recognized) {
            showToast(
                "User recognized from cookie. Is Recognized Call successful!",
                "success"
            );
        } else {
            showToast(
                "User not recognized from cookie. Is Recognized Call successful!",
                "danger"
            );
        }
        if (typeof Storage !== "undefined") {
            window.localStorage.setItem(
                "recognizedUsers",
                JSON.stringify(payload)
            );
        }
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        recognizedSuccess = false; 
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Recognition check failed: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    const isRecognizedPromise = window.SRCSDK_MASTERCARD.isRecognized();
    isRecognizedPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function GetSRCProfile() {
    stats("GET SRC PROFILE");
    showLoader();
    var recognizedUsers = JSON.parse(
        window.localStorage.getItem("recognizedUsers")
    );
    var sampleGetSrcProfileParams = { idTokens: recognizedUsers.idTokens };

    function promiseResolvedHandler(payload) {
        showToast("GetSRC Profile successful!", "success");

        const maskedCards = payload.profiles[0].maskedCards;

        if (maskedCards.length > 0) {
            if (recognized) {
                $("#notYourCards").show();
            } else {
                $("#notYourCards").hide();
            }
        } else {
            $("#notYourCards").hide();
            $("#deleteCard").hide();
        }

        renderCardTiles(maskedCards);

        if (maskedCards.length > 0) {
            $("#addCardForm").hide();
            $("#addCardBtnWrap").show(); 
        } else {
            $("#addCardForm").show();
            $("#addCardBtnWrap").hide(); 
        }
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "GetSRC Profile Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleGetSrcProfileParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const getSrcProfilePromise = window.SRCSDK_MASTERCARD.getSrcProfile(
        sampleGetSrcProfileParams
    );
    getSrcProfilePromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

// --- Card rendering helper ---
function renderCardTiles(maskedCards) {
    const $container = $("#cardList").empty();
    maskedCards.forEach((card) => {
        const descriptor = card.digitalCardData?.descriptorName || "Card";
        const last4 = card.panLastFour;
        const srcId = card.srcDigitalCardId;
        const cardBrand =
            card.paymentCardArtUri &&
            card.paymentCardArtUri.toLowerCase().includes("visa")
                ? "visa"
                : "mastercard";
       
        const cardLogo =
            cardBrand === "visa"
                ? "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                : "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png";

        const html = `
        <div class="col">
          <div class="card card-selectable mb-2" data-card-id="${srcId}">
            <div class="card-body d-flex align-items-center">
              <img src="${cardLogo}" class="me-3" style="width: 38px" alt="${cardBrand.toUpperCase()}" />
              <div>
                <div class="fw-bold">${descriptor}</div>
                <div class="text-muted small">**** ${last4}</div>
              </div>
              <div class="ms-auto">
                <input type="radio" name="selectedCard" value="${srcId}" class="form-check-input" />
              </div>
            </div>
          </div>
        </div>
        `;
        $container.append(html);
    });

    $(".card-selectable").on("click", function () {
        $(".card-selectable").removeClass("selected");
        $(this).addClass("selected");
        $(this).find("input[type=radio]").prop("checked", true);
        window.selectedCardId = $(this).data("card-id");

        $("#cardActionsBar").show();
        $("#checkoutBar").show();
    });

    if (!$(".card-selectable.selected").length) {
        $("#cardActionsBar").hide();
        $("#checkoutBar").hide();
    }
}

function IdentityLookup() {
    stats("IDENTITY LOOKUP");
    showLoader();
    var sampleIdentityLookupParams = {
        consumerIdentity: {
            identityType: "EMAIL_ADDRESS",
            identityValue: $("#email").val(),
        },
    };

    // Define response handlers
    function promiseResolvedHandler(payload) {
        console.log("promiseResolvedHandler", payload);

        if (payload.consumerPresent) {
            goToTab("#initiate"); 
            showToast(
                "Your email has been verified. Identity Lookup was successful!",
                "success"
            );
        } else {
            showToast(
                "Email ID not found. Identity Lookup unsuccessful!",
                "danger"
            );
        }
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        console.log("promiseRejectedHandler", payload);
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Identity Lookup Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }
    
    if (myCustomJSON != "") {
        sampleIdentityLookupParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const identityLookupPromise = window.SRCSDK_MASTERCARD.identityLookup(
        sampleIdentityLookupParams
    ); 
    identityLookupPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function InitiateIdentityValidation() {
    stats("INITIATE IDENTITY VALIDATION");
    showLoader();
    const sampleInitiateIdentityValidationParamsEmail = {
        requestedValidationChannelId: "EMAIL_ADDRESS",
    };

    const sampleInitiateIdentityValidationParamsPhone = {
        requestedValidationChannelId: "MOBILE_PHONE_NUMBER",
    };

    var validationChanel = "email";
    var validationChanel = $("input[name='identityV']:checked").val();
    var sampleInitiateIdentityValidationParams =
        validationChanel == "email"
            ? sampleInitiateIdentityValidationParamsEmail
            : sampleInitiateIdentityValidationParamsPhone;
    console.log(sampleInitiateIdentityValidationParams);
    
    // Define response handlers
    function promiseResolvedHandler(payload) {
        console.log("promiseResolvedHandler", payload);
        showToast(
            "OTP has been sent successfully. Please check your selected channel. Initiate Identity Validation successful!",
            "success"
        );
        goToTab("#otpBox"); 
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        console.log("promiseRejectedHandler", payload);
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Unable to send OTP to your selected channel. Initiate Identity Validation failed: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleInitiateIdentityValidationParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const initiateIdentityValidationPromise =
        window.SRCSDK_MASTERCARD.initiateIdentityValidation(
            sampleInitiateIdentityValidationParams
        ); 
    initiateIdentityValidationPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function CompleteIdentityValidation() {
    stats("COMPLETE IDENTITY VALIDATION");
    showLoader();
    console.log("CompleteIdentityValidation", $("#otp").val());
    var sampleCompleteIdentityValidationParams = {
        validationData: $("#otp").val(), 
    };

    if (suppressDCF && rememberMe) {
        sampleCompleteIdentityValidationParams = {
            ...sampleCompleteIdentityValidationParams,
            complianceSettings: {
                complianceResources: [
                    {
                        complianceType: "REMEMBER_ME",
                        uri: $(location).attr("href"),
                        version: "LATEST",
                        datePublished: new Date().getTime() / 1000,
                    },
                ],
            },
        };
    }

    // Define response handlers
    function promiseResolvedHandler(payload) {
        if (typeof Storage !== "undefined") {
            var data = { idTokens: [payload.idToken] };
            window.localStorage.setItem(
                "recognizedUsers",
                JSON.stringify(data)
            );
        }
        showToast(
            "OTP verified! Complete Identity Validation successful! You may proceed to the next step.",
            "success"
        );
        identityValidationSuccess = true;
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "OTP verification failed. Please try again. Complete Identity Validation Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        identityValidationSuccess = false;
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleCompleteIdentityValidationParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const completeIdentityValidationPromise =
        window.SRCSDK_MASTERCARD.completeIdentityValidation(
            sampleCompleteIdentityValidationParams
        ); 
    completeIdentityValidationPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function EncryptCard(type) {
    var plantextData = "";

    if (type == "old") {
        var oldcardnumber = $("#oldcardnumber").val().replace(/ /g, "");
        var oldcvvnumber = $("#oldcvvnumber").val();
        var oldinputExpDate = $("#oldinputExpDate").val();
        var oldcardholdername = $("#oldcardholdername").val();
        var billingAddName = $("#billingAddName").val();
        var billingAddLine1 = $("#billingAddLine1").val();
        var billingAddLine2 = $("#billingAddLine2").val();
        var billingAddLine3 = $("#billingAddLine3").val();
        var billingAddCity = $("#billingAddCity").val();
        var billingAddState = $("#billingAddState").val();
        var billingAddZip = $("#billingAddZip").val();
        var billingCountryCode = $("#billingCountryCode").val();
        var oldexpirymonth = oldinputExpDate.split("/")[0].trim();
        var oldexpiryyear = oldinputExpDate.split("/")[1].trim();

        if (oldcardholdername != "") {
            if (
                billingAddName == "" ||
                billingAddLine1 == "" ||
                billingAddCity == "" ||
                billingCountryCode == ""
            ) {
                plaintext.textContent =
                    '{"primaryAccountNumber": "' +
                    oldcardnumber +
                    '", "panExpirationMonth": "' +
                    oldexpirymonth +
                    '", "panExpirationYear": "' +
                    oldexpiryyear +
                    '", "cardSecurityCode": "' +
                    oldcvvnumber +
                    '", "cardholderFullName": "' +
                    oldcardholdername +
                    '"}';
            } else {
                plaintext.textContent =
                    '{"primaryAccountNumber": "' +
                    oldcardnumber +
                    '", "panExpirationMonth": "' +
                    oldexpirymonth +
                    '", "panExpirationYear": "' +
                    oldexpiryyear +
                    '", "cardSecurityCode": "' +
                    oldcvvnumber +
                    '", "cardholderFullName": "' +
                    oldcardholdername +
                    '", "billingAddress": { "name": "' +
                    billingAddName +
                    '", "line1": "' +
                    billingAddLine1 +
                    '", "line2": "' +
                    billingAddLine2 +
                    '", "line3": "' +
                    billingAddLine3 +
                    '", "city": "' +
                    billingAddCity +
                    '", "state": "' +
                    billingAddState +
                    '", "zip": "' +
                    billingAddZip +
                    '", "countryCode": "' +
                    billingCountryCode +
                    '"}}';
            }
        } else {
            if (
                billingAddName == "" ||
                billingAddLine1 == "" ||
                billingAddCity == "" ||
                billingCountryCode == ""
            ) {
                plaintext.textContent =
                    '{"primaryAccountNumber": "' +
                    oldcardnumber +
                    '", "panExpirationMonth": "' +
                    oldexpirymonth +
                    '", "panExpirationYear": "' +
                    oldexpiryyear +
                    '", "cardSecurityCode": "' +
                    oldcvvnumber +
                    '"}';
            } else {
                plaintext.textContent =
                    '{"primaryAccountNumber": "' +
                    oldcardnumber +
                    '", "panExpirationMonth": "' +
                    oldexpirymonth +
                    '", "panExpirationYear": "' +
                    oldexpiryyear +
                    '", "cardSecurityCode": "' +
                    oldcvvnumber +
                    '", "billingAddress": { "name": "' +
                    billingAddName +
                    '", "line1": "' +
                    billingAddLine1 +
                    '", "line2": "' +
                    billingAddLine2 +
                    '", "line3": "' +
                    billingAddLine3 +
                    '", "city": "' +
                    billingAddCity +
                    '", "state": "' +
                    billingAddState +
                    '", "zip": "' +
                    billingAddZip +
                    '", "countryCode": "' +
                    billingCountryCode +
                    '"}}';
            }
        }

        plantextData = plaintext.textContent;
    } else {
        var cardnumber = $("#cardnumber").val().replace(/ /g, "");
        var cvvnumber = $("#cvvnumber").val();
        var newinputExpDate = $("#newinputExpDate").val();
        var cardholdername = $("#cardholdername").val();
        var expirymonth = newinputExpDate.split("/")[0].trim();
        var expiryyear = newinputExpDate.split("/")[1].trim();

        if (cardholdername != "") {
            newplaintext.textContent =
                '{"primaryAccountNumber": "' +
                cardnumber +
                '", "panExpirationMonth": "' +
                expirymonth +
                '", "panExpirationYear": "' +
                expiryyear +
                '", "cardSecurityCode": "' +
                cvvnumber +
                '", "cardholderFullName": "' +
                cardholdername +
                '"}';
        } else {
            newplaintext.textContent =
                '{"primaryAccountNumber": "' +
                cardnumber +
                '", "panExpirationMonth": "' +
                expirymonth +
                '", "panExpirationYear": "' +
                expiryyear +
                '", "cardSecurityCode": "' +
                cvvnumber +
                '"}';
        }
        plantextData = newplaintext.textContent;
    }
    let webKey = "";
    _.forEach(encParams.keys, (srcKey) => {
        if (srcKey.kid.includes(encParams.encKeyId)) {
            webKey = srcKey;
        }
    });
    var cryptographer = new Jose.WebCryptographer();
    cryptographer.setKeyEncryptionAlgorithm(encParams.encAlgo);
    cryptographer.setContentEncryptionAlgorithm(encParams.encContentAlgo);
    var key = {
        kty: webKey.kty,
        e: webKey.e,
        n: webKey.n,
    };
    var rsa_key = Jose.Utils.importRsaPublicKey(key, encParams.encAlgo);
    var encrypter = new Jose.JoseJWE.Encrypter(cryptographer, rsa_key);
    encrypter.addHeader("kid", webKey.kid);
    encrypter
        .encrypt(plantextData)
        .then(function (result) {
            stats("ENCRYPT CARD");
            if (type == "old") {
                $("#ciphertext").val(result);
            } else {
                $("#newciphertext").val(result);
                if (typeof setEncryptedCardTooltip === "function")
                    setEncryptedCardTooltip();
            }
            console.log(result);
        })
        .catch(function (err) {
            console.error(err);
        });
}

function Checkout() {
    stats("NEW USER CHECKOUT");
    showLoader();
    var srcWindow;
    if (inlineDCF) {
        checkoutIframe.addEventListener("load", showCheckoutIframe, {
            once: true,
        });
        srcWindow = checkoutIframe.contentWindow
            ? checkoutIframe.contentWindow
            : checkoutIframe.contentDocument.defaultView;
    } else {
        srcWindow = window.open("", "_blank", "popup");
        srcWindow.moveTo(500, 100);
        srcWindow.resizeTo(550, 650);
        srcWindow.addEventListener("message", this.cancel);
    }
    window.childSrcWindow = srcWindow;

    console.log(
        "authenticationType",
        $("input[name='authenticationType']").is(":checked")
    );

    if ($("input[name='authenticationType']").is(":checked")) {
        var authenticationPreferences = {
            payloadRequested: "AUTHENTICATED", 
        };
    }

    if ($("input[name='tasAuth']").is(":checked")) {
        var tafParams = {
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
            authenticationPreferences: {
                payloadRequested: "AUTHENTICATED", 
            },
        };
    }

    console.log("authenticationPreferences", authenticationPreferences);

    var sampleCheckoutParams;

    var dpaTransactionOptions = {
        transactionAmount: {
            transactionAmount: $("#txnAmount").val(),
            transactionCurrencyCode: $("#txnCurrency").val(),
        },
        transactionType: "PURCHASE",
        dpaBillingPreference: allowBilling == true ? "FULL" : "NONE",
        dpaShippingPreference: allowShipping == true ? "FULL" : "NONE",
        dpaAcceptedBillingCountries: [],
        dpaAcceptedShippingCountries: [],
        dpaLocale: $("#dpalocale").val(),
        consumerEmailAddressRequested: $("#consumerEmailAddressRequested").is(
            ":checked"
        ),
        consumerNameRequested: $("#consumerNameRequested").is(":checked"),
        consumerPhoneNumberRequested: $("#consumerPhoneNumberRequested").is(
            ":checked"
        ),
        customInputData: {
            "com.mastercard.dcfExperience": "WITHIN_CHECKOUT",
        },
        confirmPayment: confPayment,
        paymentOptions: {
            dpaDynamicDataTtlMinutes: 15,
            dynamicDataType: $("input[name='cryptogram']:checked").val(), 
        },
        payloadTypeIndicatorCheckout: $(
            "input[name='IndicatorCheckout']:checked"
        ).val(),
        ...tafParams, 
    };

    console.log("dpaTransactionOptions", dpaTransactionOptions);
    console.log("authenticationType", authenticationType);
    if (authenticationType) {
        dpaTransactionOptions = {
            ...dpaTransactionOptions,
            authenticationPreferences: authenticationPreferences,
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
        };
    }

    console.log("dpaTransactionOptions", dpaTransactionOptions);

    sampleCheckoutParams = {
        dpaTransactionOptions: dpaTransactionOptions,
        consumer: {
            emailAddress: $("#consumerEmail").val(),
            mobileNumber: {
                countryCode: $("#consumerMobileCountryCode").val(),
                phoneNumber: $("#consumerMobileNumber").val(),
            },
            firstName: $("#oldcardholderfname").val(),
            lastName: $("#oldcardholderlname").val(),
        },
        srciActionCode: "NEW_USER",
        encryptedCard: $("#ciphertext").val(),
    };
    var sampleCheckoutParams1 = sampleCheckoutParams;
    sampleCheckoutParams = { ...sampleCheckoutParams, windowRef: srcWindow };

    if (suppressDCF && !rememberMe) {
        sampleCheckoutParams = {
            ...sampleCheckoutParams,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
            },
        };
        sampleCheckoutParams1 = {
            ...sampleCheckoutParams1,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
            },
        };
    } else if (suppressDCF && rememberMe) {
        sampleCheckoutParams = {
            ...sampleCheckoutParams,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
                complianceResources: [
                    {
                        complianceType: "REMEMBER_ME",
                        uri: $(location).attr("href"),
                        version: "LATEST",
                        datePublished: new Date().getTime() / 1000,
                    },
                ],
            },
        };
        sampleCheckoutParams1 = {
            ...sampleCheckoutParams1,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
                complianceResources: [
                    {
                        complianceType: "REMEMBER_ME",
                        uri: $(location).attr("href"),
                        version: "LATEST",
                        datePublished: new Date().getTime() / 1000,
                    },
                ],
            },
        };
    }

    // Define response handlers
    function promiseResolvedHandler(payload) {
        validateDcfActionCode(payload);
        showToast("New User Checkout SDK call successful!", "success");
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "New User Checkout Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        if (inlineDCF) {
            dismissCheckoutIframe();
        } else {
            window.childSrcWindow.close();
        }
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleCheckoutParams1 = JSON.parse(myCustomJSON);
        sampleCheckoutParams = {
            ...sampleCheckoutParams1,
            windowRef: srcWindow,
        };
        myCustomJSON = "";
    }

    const checkoutPromise =
        window.SRCSDK_MASTERCARD.checkout(sampleCheckoutParams); 
    checkoutPromise.then(promiseResolvedHandler).catch(promiseRejectedHandler);
}

async function ReturnUserCheckout() {
    stats("RETURN USER CHECKOUT");
    showLoader();
    var srcWindow;
    if (inlineDCF) {
        checkoutIframe.addEventListener("load", showCheckoutIframe, {
            once: true,
        });
        srcWindow = checkoutIframe.contentWindow
            ? checkoutIframe.contentWindow
            : checkoutIframe.contentDocument.defaultView;
    } else {
        srcWindow = window.open("", "_blank", "popup");
        srcWindow.moveTo(500, 100);
        srcWindow.resizeTo(550, 650);
        srcWindow.addEventListener("message", this.cancel);
    }
    window.childSrcWindow = srcWindow;

    console.log(
        "authenticationType",
        $("input[name='authenticationType']").is(":checked")
    );

    if ($("input[name='authenticationType']").is(":checked")) {
        var authenticationPreferences = {
            payloadRequested: "AUTHENTICATED", 
        };

        console.log("authenticationPreferences", authenticationPreferences);
    }

    if ($("input[name='tasAuth']").is(":checked")) {
        var tafParams = {
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
            authenticationPreferences: {
                payloadRequested: "AUTHENTICATED", 
            },
        };
    }

    var dpaTransactionOptions = {
        transactionAmount: {
            transactionAmount: $("#txnAmount").val(),
            transactionCurrencyCode: $("#txnCurrency").val(),
        },
        transactionType: "PURCHASE",
        dpaBillingPreference: allowBilling == true ? "FULL" : "NONE",
        dpaShippingPreference: allowShipping == true ? "FULL" : "NONE",
        dpaAcceptedBillingCountries: [],
        dpaAcceptedShippingCountries: [],
        dpaLocale: $("#dpalocale").val(),
        consumerEmailAddressRequested: $("#consumerEmailAddressRequested").is(
            ":checked"
        ),
        consumerNameRequested: $("#consumerNameRequested").is(":checked"),
        consumerPhoneNumberRequested: $("#consumerPhoneNumberRequested").is(
            ":checked"
        ),
        customInputData: {
            "com.mastercard.dcfExperience": "WITHIN_CHECKOUT",
        },
        confirmPayment: confPayment,
        paymentOptions: {
            dpaDynamicDataTtlMinutes: 15,
            dynamicDataType: $("input[name='cryptogram']:checked").val(), 
        },
        payloadTypeIndicatorCheckout: $(
            "input[name='IndicatorCheckout']:checked"
        ).val(),
        ...tafParams, 
    };

    console.log("dpaTransactionOptions", dpaTransactionOptions);
    console.log("authenticationType", authenticationType);
    if (authenticationType) {
        dpaTransactionOptions = {
            ...dpaTransactionOptions,
            acquirerMerchantId: $("#acquirerMerchantId").val(),
            acquirerBIN: $("#acquirerBin").val(),
            merchantCategoryCode: $("#merchantCategoryCode").val(),
            merchantCountryCode: $("#merchantCountryCode").val(),
            authenticationPreferences: authenticationPreferences,
        };
    }

    var sampleCheckoutParams = {
        dpaTransactionOptions: dpaTransactionOptions,
        srcDigitalCardId: window.selectedCardId, 
        payloadTypeIndicatorCheckout: $(
            "input[name='IndicatorCheckout']:checked"
        ).val(),
    };

    var sampleCheckoutParams1 = sampleCheckoutParams;
    sampleCheckoutParams = { ...sampleCheckoutParams, windowRef: srcWindow };

    if (suppressDCF && !rememberMe) {
        sampleCheckoutParams = {
            ...sampleCheckoutParams,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
            },
        };
        sampleCheckoutParams1 = {
            ...sampleCheckoutParams1,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
            },
        };
    } else if (suppressDCF && rememberMe) {
        sampleCheckoutParams = {
            ...sampleCheckoutParams,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
                complianceResources: [
                    {
                        complianceType: "REMEMBER_ME",
                        uri: $(location).attr("href"),
                        version: "LATEST",
                        datePublished: new Date().getTime() / 1000,
                    },
                ],
            },
        };
        sampleCheckoutParams1 = {
            ...sampleCheckoutParams1,
            complianceSettings: {
                privacy: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/privacy.html",
                },
                tnc: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/country-listing/terms.html",
                },
                cookie: {
                    acceptedVersion: "LATEST",
                    latestVersion: "LATEST",
                    latestVersionUri:
                        "https://www.mastercard.com/global/click-to-pay/en-us/privacy-notice.html",
                },
                complianceResources: [
                    {
                        complianceType: "REMEMBER_ME",
                        uri: $(location).attr("href"),
                        version: "LATEST",
                        datePublished: new Date().getTime() / 1000,
                    },
                ],
            },
        };
    }

    // Define response handlers
    function promiseResolvedHandler(payload) {
        validateDcfActionCode(payload);
        showToast("Return User Checkout SDK call successful!", "success");
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        if (inlineDCF) {
            dismissCheckoutIframe();
        } else {
            window.childSrcWindow.close();
        }
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Return User Checkout Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleCheckoutParams1 = JSON.parse(myCustomJSON);
        sampleCheckoutParams = {
            ...sampleCheckoutParams1,
            windowRef: srcWindow,
        };
        myCustomJSON = "";
    }

    const checkoutPromise =
        window.SRCSDK_MASTERCARD.checkout(sampleCheckoutParams); 
    checkoutPromise.then(promiseResolvedHandler).catch(promiseRejectedHandler);
}

function validateDcfActionCode(checkoutResponse) {
    console.log("validateDcfActionCode", checkoutResponse);
    if (inlineDCF) {
        dismissCheckoutIframe();
    } else {
        window.childSrcWindow.close();
    }
    if (checkoutResponse.dcfActionCode == "COMPLETE") {
        console.log(
            "checkoutResponse.dcfActionCode",
            checkoutResponse.dcfActionCode
        );
        playSonic();

        // Show modal asking user for choice before API call
        $("#chooseCheckoutApiModal").modal("show");

        // Remove previous click handlers to avoid multiple triggers
        $("#btnUseSdkApi")
            .off("click")
            .on("click", function () {
                $("#chooseCheckoutApiModal").modal("hide");
                callCheckoutBackendAPI(checkoutResponse); // original behavior
            });

        $("#btnUseStandaloneApi")
            .off("click")
            .on("click", function () {
                $("#chooseCheckoutApiModal").modal("hide");
                showToast(
                    "You have chosen to perform the standalone API call manually. Please copy credentials from the logs below.",
                    "info"
                );
            });

    } else if (checkoutResponse.dcfActionCode == "CHANGE_CARD") {
        console.log(
            "unbindAppInstance : " + checkoutResponse.unbindAppInstance
        );
        if (checkoutResponse.unbindAppInstance) {
            // Define response handlers
            function promiseResolvedHandler(payload) {
                console.log("unbindAppInstance - Successful");
                showToast("Unbind App Instance successful!", "success");
            }
            function promiseRejectedHandler(payload) {
                console.log("unbindAppInstance - failed");
                let errMsg =
                    payload && payload.message
                        ? payload.message
                        : "Unknown error";
                showToast(
                    "Unbind App Instance failed: " +
                        errMsg +
                        ". Check logs for more details.",
                    "danger"
                );
            }
            const dataToken = window.localStorage.getItem("recognizedUsers");
            const unbindAppInstancePromise =
                window.SRCSDK_MASTERCARD.unbindAppInstance({
                    idToken: dataToken.idToken,
                }); 
            unbindAppInstancePromise
                .then(promiseResolvedHandler)
                .catch(promiseRejectedHandler);
        }
    }
}

function callCheckoutBackendAPI(checkoutResponse) {
    let requestData = {
        srcClientId: $("#clientid").val(),
        srcDpaId: $("#dpaid").val(),
        srcCorrelationId: checkoutResponse.checkoutResponse.srcCorrelationId,
        srcDigitalCardId:
            checkoutResponse.checkoutResponse.maskedCard.srcDigitalCardId,
    };

    showLoader();
    $.ajax({
        url: SERVER_URL + `/transaction/credentials`,
        type: "POST",
        headers: {
            "X-Src-Cx-Flow-Id": "",
            "X-Src-Response-Host": "",
        },
        contentType: "application/json",
        data: JSON.stringify(requestData),
        success: function (response) {
            console.log("Response:", response);
            showToast("Checkout API Call successful!", "success");
            hideLoader();
            callConfirmationBackendAPI(checkoutResponse);
        },
        error: function (jqXHR) {
            hideLoader();
            let errorResponse;
            try {
                errorResponse = JSON.parse(jqXHR.responseText); // this fails for plain strings
            } catch (e) {
                console.error("Failed to parse error response as JSON:", e);
                errorResponse = jqXHR.responseText; // fallback to raw text
            }
            console.log("Error Response:", errorResponse);

            let errMsg =
                errorResponse && errorResponse
                    ? errorResponse
                    : "Unknown error";
            showToast(
                "Checkout API Call Rejected: " +
                    errMsg +
                    ". Check logs for more details.",
                "danger"
            );
        },
        complete: function () {
            hideLoader();
        },
    });
}

function callConfirmationBackendAPI(checkoutResponse) {
    let requestData = {
        srcClientId: $("#clientid").val(),
        srcDpaId: $("#dpaid").val(),
        srcCorrelationId: checkoutResponse.checkoutResponse.srcCorrelationId,
        serviceId: $("#serviceId").val(),
        srciTransactionId: checkoutResponse.checkoutResponse.srciTransactionId,
        confirmationData: {
            checkoutEventType: "07",
            checkoutEventStatus: "01",
            confirmationStatus: "01",
            confirmationReason: "Order Successfully Created",
            confirmationTimestamp: "2025-02-26T10:31:47Z",
            networkAuthorizationCode: "6019503940020912",
            networkTransactionIdentifier: "60195039400209",
            paymentNetworkReference: "543215465132123140",
            assuranceData: {
                VerificationType: "CARDHOLDER",
                VerificationEntity: 3,
                VerificationMethod: "01",
                VerificationResults: "01",
                VerificationEvent: "02",
            },
            transactionAmount: {
                transactionAmount: $("#txnAmount").val(),
                transactionCurrencyCode: $("#txnCurrency").val(),
            },
        },
    };

    showLoader();
    $.ajax({
        url: SERVER_URL + `/confirmations`,
        type: "POST",
        headers: {
            "X-SRC-CX-FLOW-ID": "",
        },
        contentType: "application/json",
        data: JSON.stringify(requestData),
         success: function (response, textStatus, jqXHR) {
            console.log("Response:", response);

            if (jqXHR.status === 204) {
                showToast("Confirmation API Call successful!", "success");
            } else {
                showToast("Confirmation API Call successful!", "success");
            }
            hideLoader();
        },
        error: function (jqXHR) {
            hideLoader();
            let errorResponse;
            try {
                errorResponse = JSON.parse(jqXHR.responseText); // this fails for plain strings
            } catch (e) {
                console.error("Failed to parse error response as JSON:", e);
                errorResponse = jqXHR.responseText; // fallback to raw text
            }
            console.log("Error Response:", errorResponse);

            let errMsg =
                errorResponse && errorResponse
                    ? errorResponse
                    : "Unknown error";
            showToast(
                "Confirmation API Call Rejected: " +
                    errMsg +
                    ". Check logs for more details.",
                "danger"
            );
        },
        complete: function () {
            hideLoader();
        },
    });
}

// Function to show loader
function showLoader() {
    $("#spinner").addClass("loading");
}

// Function to hide loader
function hideLoader() {
    $("#spinner").removeClass("loading");
}

function EnrollCard() {
    stats("ENROLL CARD");
    showLoader();
    const dataToken = window.localStorage.getItem("recognizedUsers");
    const token = JSON.parse(dataToken).idTokens;
    var sampleEnrollCardParams = {
        encryptedCard: $("#newciphertext").val(), 
        idToken: token, 
    };

    // Define response handlers
    function promiseResolvedHandler(payload) {
        showToast("Enroll Card successful!", "success");
        resetAddCardForm();
        GetSRCProfile(); 
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Enroll Card Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleEnrollCardParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const enrollCardPromise = window.SRCSDK_MASTERCARD.enrollCard(
        sampleEnrollCardParams
    ); 
    enrollCardPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function DeleteCard() {
    stats("DELETE CARD");
    showLoader();
    if (!window.selectedCardId) {
        MyAlert("Please select card first.");
        return;
    }
    var sampleDeleteCardParams = {
        srcDigitalCardId: window.selectedCardId, 
    };

    // Define response handlers
    function promiseResolvedHandler(payload) {
        showToast("Delete Card successful!", "success");
        GetSRCProfile(); 
        hideLoader();
    }
    function promiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Delete Card Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }

    if (myCustomJSON != "") {
        sampleDeleteCardParams = JSON.parse(myCustomJSON);
        myCustomJSON = "";
    }

    const deleteCardPromise = window.SRCSDK_MASTERCARD.deleteCard(
        sampleDeleteCardParams
    ); 
    deleteCardPromise
        .then(promiseResolvedHandler)
        .catch(promiseRejectedHandler);
}

function VerifySignature(signature) {
    let webKey = "";
    _.forEach(encParams.keys, (srcKey) => {
        if (srcKey.kid.includes(encParams.verKeyId)) {
            webKey = srcKey;
        }
    });
    var key = {
        kty: webKey.kty,
        e: webKey.e,
        n: webKey.n,
    };
    var rsa_key = Jose.Utils.importRsaPublicKey(key, encParams.verAlgo);

    var cryptographer = new Jose.WebCryptographer();
    cryptographer.setContentSignAlgorithm(encParams.verAlgo);

    var verifier = new Jose.JoseJWS.Verifier(cryptographer, signature, false);
    verifier.addRecipient(key, webKey.kid, encParams.verAlgo).then(function () {
        verifier
            .verify()
            .then(function (verified) {
                console.log("verified: ", verified);
            })
            .catch(function (err) {
                console.error(err);
            });
    });
}

function doSign(message, key) {
    var o1_secret = key;
    var signature = crypt.signature(o1_secret, message);
    var sign = encodeURIComponent(JSON.parse(signature).signature);
    return sign;
}

function getUrlVars(params, key) {
    var vars = [],
        hash;
    var hashes = params.split("&");
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split("=");
        if (hash[0] == key) {
            return hashes[i].slice(hashes[i].indexOf("=") + 1);
        }
    }
    return vars;
}

async function decrypt(ciphertext, key, alg) {
    updateJwk(key, false).then((jsonKey) => {
        var private_rsa_key = Jose.Utils.importRsaPrivateKey(jsonKey, alg);
        var cryptographer = new Jose.WebCryptographer();

        var decrypter = new Jose.JoseJWE.Decrypter(
            cryptographer,
            private_rsa_key
        );
        decrypter
            .decrypt(ciphertext)
            .then(function (decrypted_plain_text) {
                console.log("Decrypted Payload:");
                console.log(decrypted_plain_text);
            })
            .catch(function (err) {
                console.log(err.message);
            });
    });
}

function loadInputBox() {
    $.confirm({
        useBootstrap: false,
        title: "Prompt!",
        content:
            "" +
            '<form action="" class="formName">' +
            '<div class="form-group">' +
            "<label>Enter your custom JSON Payload here (For Checkout function DO NOT include windowRef element):</label>" +
            '<textarea id="customJSON" name="customJSON" cols="100" rows="10" class="customJSON form-control" required ></textarea>' +
            "</div>" +
            "</form>",
        buttons: {
            formSubmit: {
                text: "Submit",
                btnClass: "btn-blue",
                action: function () {
                    var customJSON = this.$content.find(".customJSON").val();
                    if (!customJSON) {
                        MyAlert("provide a valid JSON Payload");
                        return false;
                    }
                    myCustomJSON = customJSON;
                },
            },
            cancel: function () {
                //close
            },
        },
        onContentReady: function () {
            // bind to events
            var jc = this;
            this.$content.find("form").on("submit", function (e) {
                // if the user submits the form by pressing enter in the field.
                e.preventDefault();
                jc.$$formSubmit.trigger("click"); // reference the button and click it
            });
        },
    });
}

function SignOut(message) {
    stats("SIGN OUT");
    $.confirm({
        title: "Confirm!",
        content: "Are you sure" + message + "?",
        useBootstrap: false,
        buttons: {
            confirm: function () {
                ClickToPaySignOut();
            },
            cancel: function () {
                return;
            },
        },
    });
}

function ClickToPaySignOut() {
    showLoader();
    var recognizedUsers = JSON.parse(
        window.localStorage.getItem("recognizedUsers")
    );
    var sampleUnbindAppInstanceParams = { idToken: recognizedUsers.idTokens };
   
    const unbindAppInstancePromise = window.SRCSDK_MASTERCARD.unbindAppInstance(
        sampleUnbindAppInstanceParams
    ); 
    unbindAppInstancePromise
        .then(c2pSignoutPromiseResolvedHandler)
        .catch(c2pSignoutPromiseRejectedHandler);

    function c2pSignoutPromiseResolvedHandler(payload) {
        $("#cards")
            .find("option")
            .remove()
            .end()
            .append('<option value="">Select</option>')
            .val("");
        $("#notYourCards").hide();
        $("#deleteCard").hide();
        showToast("Unbind App Instance successful!", "success");
        setStep(1);
        hideLoader();
    }
    function c2pSignoutPromiseRejectedHandler(payload) {
        let errMsg =
            payload && payload.message ? payload.message : "Unknown error";
        showToast(
            "Unbind App Instance Rejected: " +
                errMsg +
                ". Check logs for more details.",
            "danger"
        );
        hideLoader();
    }
}

function stats(desc) {
}
function playSonic() {
    console.log("playSonic called");
    // Show the Bootstrap modal instead of manipulating classes
    $("#animationStep").modal("show");

    // Play the sonic sound
    let mc_component = document.getElementById("mc-sonic");
    mc_component.play();

    // When sound completes, call handler
    document.addEventListener("sonicCompletion", onCompletion);

    // Hide underlying elements
    $("#src").hide();
    $("#srcFooter").hide();
}

function onCompletion() {
    // Hide modal the Bootstrap way
    $("#animationStep").modal("hide");

    // Restore original UI
    $("#src").show();
    $("#srcFooter").show();
}

function goToTab(tabId) {
    // tabId: string, e.g. "#initiate" or "#otp"
    var tabTrigger = document.querySelector('[data-bs-target="' + tabId + '"]');
    if (tabTrigger) {
        var tab = new bootstrap.Tab(tabTrigger);
        tab.show();
    }
}

function checkAndSetStepForInit() {
    console.log("initSuccess:", initSuccess);
    console.log("recognizedSuccess:", recognizedSuccess);
    if (initSuccess || recognizedSuccess) {
        setStep(2);
    } else {
        showToast(
            "Please complete Init or IsRecognized steps before proceeding.",
            "warning"
        );
    }
}

function checkAndSetStepAfterValidation() {
    console.log("initSuccess:", initSuccess);
    console.log("recognizedSuccess:", recognizedSuccess);
    console.log("identityValidationSuccess:", identityValidationSuccess);

    if (identityValidationSuccess) {
        setStep(4);
        GetSRCProfile();
    } else {
        showToast(
            "Please verify your identity before processing to the next step.",
            "warning"
        );
    }
}

$(document).ready(function () {
    // Fetch configuration values from the backend
    $.get(SERVER_URL + "/api/config", function (data) {
        // Example: set input values if present in response
        if (data.srcClientId) {
            $("#clientid").val(data.srcClientId);
        }
        if (data.srcDpaId) {
            $("#dpaid").val(data.srcDpaId);
        }
        if (data.serviceId) {
            $("#serviceId").val(data.serviceId);
        }
        // You can add as many fields as needed
    });
});