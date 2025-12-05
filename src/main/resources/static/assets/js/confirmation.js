function markRequiredAsterisks($context) {
    const $scope = $context || $(document);

    $scope
        .find("input[required], select[required], textarea[required]")
        .each(function () {
            const $input = $(this);
            const name = $input.attr("name");

            if (!name) return;

            // Find the closest label in the same form-group or wrapper
            let $label = $input
                .closest(".form-group, .mb-3, .row, div") // Bootstrap or generic wrappers
                .find("label")
                .filter(function () {
                    // Avoid nested labels not related to this input
                    return (
                        $(this).nextAll(`[name="${name}"]`).length > 0 ||
                        $(this).siblings(`[name="${name}"]`).length > 0
                    );
                })
                .first();

            // Fallback: previous sibling
            if (!$label.length) {
                $label = $input.prev("label");
            }

            if (
                $label.length &&
                $label.find(".required-asterisk").length === 0
            ) {
                $label.append(
                    ' <span class="text-danger required-asterisk">*</span>'
                );
            }
        });
}

function displayResults(selector, data) {
    const resultsDiv = $(selector);
    resultsDiv.empty();
    let parsed = data;

    // If it's a string that looks like JSON, try to parse
    if (typeof data === "string") {
        try {
            // Parse first level
            parsed = JSON.parse(data);
            // If it's STILL a string, parse one more time (for double-encoded JSON)
            if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
            }
        } catch (e) {
            // Log the error for debugging purposes
            console.error("Failed to parse JSON in displayResults:", e);
            // leave as string if not valid JSON
            parsed = data;
        }
    }

    // Pretty print for objects or arrays, otherwise show as text
    if (typeof parsed === "object") {
        resultsDiv.html(`<pre>${JSON.stringify(parsed, null, 2)}</pre>`);
    } else {
        resultsDiv.text(parsed);
    }
}

$(document).ready(function () {
    $.validator.addMethod(
        "pattern",
        function (value, element, regexp) {
            if (this.optional(element)) {
                return true;
            }

            if (typeof regexp === "string") {
                regexp = new RegExp(regexp);
            }

            return regexp.test(value);
        },
        "Invalid format."
    );

    markRequiredAsterisks(); // for initial load


    // Form validation rules
    $("#confirmation-form").validate({
        ignore: [],
        normalizer: function (value) {
            return value.trim();
        },
        rules: {
            xSrcCxFlowId: {},
            srcClientId: {
                required: true,
                pattern:
                    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
            },
            srcDpaId: {},
            srcCorrelationId: {
                required: true,
                pattern:
                    /^([0-9a-f]{8}\.)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
            },
            serviceId: {},
            srciTransactionId: {},
            checkoutEventType: {
                required: true,
                maxlength: 2,
            },
            checkoutEventStatus: {
                required: true,
                maxlength: 2,
            },
            confirmationStatus: {
                maxlength: 2,
            },
            confirmationReason: {
                maxlength: 64,
                pattern: /^[0-9a-zA-Z ,;!?.\-_]*$/,
            },
            confirmationTimestamp: {
                required: true,
            },
            networkAuthorizationCode: {
                maxlength: 25,
                pattern: /^[0-9a-zA-Z]*$/,
            },
            networkTransactionIdentifier: {
                maxlength: 25,
                pattern: /^[ A-Za-z0-9_-]*$/,
            },
            paymentNetworkReference: {},
            verificationType: {},
            verificationEntity: {},
            verificationMethod: {},
            verificationResults: {},
            verificationEvent: {},
            transactionAmount: {
                required: true,
                maxlength: 18,
            },
            transactionCurrencyCode: {
                required: true,
            },

            //
        },
        messages: {
            srcClientId: {
                required: "srcClientId is required.",
                pattern:
                    "Invalid format. Must match a UUID or prefixed UUID format.",
            },
            srcCorrelationId: {
                pattern:
                    "Invalid format. Must match a UUID or prefixed UUID format.",
            },
            srciTransactionId: {
                pattern:
                    "Invalid format. Must match a UUID or prefixed UUID format.",
            },
            confirmationTimestamp: {
                pattern: "Invalid format.",
            },
            networkTransactionIdentifier: {
                pattern: "Invalid format.",
            },
            paymentNetworkReference: {
                pattern: "Invalid format.",
            },
        },
        invalidHandler: function (form, validator) {
            if (validator.errorList.length) {
                $("html, body").animate(
                    {
                        scrollTop:
                            $(validator.errorList[0].element).offset().top -
                            100,
                    },
                    500
                );
            }
        },
        submitHandler: function (_form, event) {
            event.preventDefault();
        },
    });
});
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    $("#spinner").removeClass("loading");
    setDynamicDropdownValues();

    // Handle Create Funding Transfer form submission
    $("#confirmation-form").on("submit", function (e) {
        e.preventDefault();

        if ($("#confirmation-form").valid()) {
            let requestData = {
                srcClientId: $("#srcClientId").val(),
                srcDpaId: $("#srcDpaId").val(),
                srcCorrelationId: $("#srcCorrelationId").val(),
                serviceId: $("#serviceId").val(),
                srciTransactionId: $("#srciTransactionId").val(),
                confirmationData: {
                    checkoutEventType: $("#checkoutEventType").val(),
                    checkoutEventStatus: $("#checkoutEventStatus").val(),
                    confirmationStatus: $("#confirmationStatus").val(),
                    confirmationReason: $("#confirmationReason").val(),
                    confirmationTimestamp: $("#confirmationTimestamp").val(),
                    networkAuthorizationCode: $(
                        "#networkAuthorizationCode"
                    ).val(),
                    networkTransactionIdentifier: $(
                        "#networkTransactionIdentifier"
                    ).val(),
                    paymentNetworkReference: $("#paymentNetworkReference").val()
                        ? Number($("#paymentNetworkReference").val())
                        : undefined,
                    assuranceData: {
                        VerificationType: $("#verificationType").val(),
                        VerificationEntity: $("#verificationEntity").val()
                            ? Number($("#verificationEntity").val())
                            : undefined,
                        VerificationMethod: $("#verificationMethod").val(),
                        VerificationResults: $("#verificationResults").val(),
                        VerificationEvent: $("#verificationEvent").val(),
                    },
                    transactionAmount: {
                        transactionAmount: $("#transactionAmount").val(),
                        transactionCurrencyCode: $(
                            "#transactionCurrencyCode"
                        ).val(),
                    },
                },
            };

            console.log("Request Data:", requestData);

            const xSrcCxFlowId = $("#xSrcCxFlowId").val();

            // Display request details
            displayResults("#requestBodyContent", requestData);

            // Show the loader
            showLoader();
            const requestHeaders = {
                "X-Src-Cx-Flow-Id": xSrcCxFlowId,
                "Content-Type": "application/json"
            };
            displayResults("#requestHeadersContent", requestHeaders);

            $.ajax({
                url: SERVER_URL + `/confirmations`,
                type: "POST",
                headers: requestHeaders,
                contentType: "application/json",
                data: JSON.stringify(requestData),
                success: function (response, textStatus, jqXHR) {
                    console.log("Response:", response);
                    // Handle 204 No Content: response is undefined, but jqXHR.status === 204
                    if (jqXHR.status === 204 || response === undefined || response === null) {
                        displayResults("#responseContent", {
                            message: "Success - No Content (204)",
                        });
                        $("#mastercardResponseHeadersContent").empty();
                        return;
                    } else {
                        // Handle normal cases
                        displayResults("#responseContent", response.body || response);
                    }

                    // Only show headers if available
                    if (response.headers) {
                        displayResults("#mastercardResponseHeadersContent", response.headers);
                    } else {
                        $("#mastercardResponseHeadersContent").empty();
                    }
                },
                error: function (jqXHR) {
                    let errorResponse;
                    try {
                        errorResponse = JSON.parse(jqXHR.responseText);
                        if (typeof errorResponse === "string") {
                            try {
                                errorResponse = JSON.parse(errorResponse);
                            } catch (e) {
                                console.warn("Failed to parse error response as JSON:", e);
                                // Not JSON, leave as string
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing error response JSON:", e);
                        errorResponse = jqXHR.responseText;
                    }
                    // If you have body/headers structure prefer .body for responseContent!
                    if (typeof errorResponse === "object" && errorResponse.body) {
                        displayResults("#responseContent", errorResponse.body);
                        if (errorResponse.headers) {
                            displayResults("#mastercardResponseHeadersContent", errorResponse.headers);
                        } else {
                            $("#mastercardResponseHeadersContent").empty();
                        }
                    } else {
                        // fallback for older errors
                        displayResults("#responseContent", errorResponse);
                        $("#mastercardResponseHeadersContent").empty();
                    }
                },
                complete: function () {
                    hideLoader();
                },
            });
        }
    });

    // Function to show loader
    function showLoader() {
        $("#spinner").addClass("loading");
    }

    // Function to hide loader
    function hideLoader() {
        $("#spinner").removeClass("loading");
    }

    // Function to set dynamic dropdown values
    function setDynamicDropdownValues() {
        const dynamicDropdowns = [
            {
                id: "checkoutEventType",
                url: "/assets/config/checkout-event-type.json",
            },
            {
                id: "checkoutEventStatus",
                url: "/assets/config/checkout-event-status.json",
            },
            {
                id: "confirmationStatus",
                url: "/assets/config/confirmation-status.json",
            },
            {
                id: "verificationType",
                url: "/assets/config/verification-type.json",
            },
            {
                id: "verificationEntity",
                url: "/assets/config/verification-entity.json",
            },
            {
                id: "verificationMethod",
                url: "/assets/config/verification-method.json",
            },
            {
                id: "verificationResults",
                url: "/assets/config/verification-results.json",
            },
            {
                id: "verificationEvent",
                url: "/assets/config/verification-event.json",
            },
        ];

        for (let dropdown of dynamicDropdowns) {
            const element = $("#" + dropdown.id);
            element.empty();
            $.getJSON(dropdown.url, function (data) {
                $.each(data, function (_key, entry) {
                    element.append(
                        $("<option></option>")
                            .attr("value", entry.value)
                            .text(entry.name)
                    );
                });
            });
        }
    }

    // Fetch configuration values from the backend
    $.get(SERVER_URL + "/api/config", function (data) {
        // Example: set input values if present in response
        if (data.srcClientId) {
            $("#srcClientId").val(data.srcClientId);
        }
        if (data.srcDpaId) {
            $("#srcDpaId").val(data.srcDpaId);
        }
        // You can add as many fields as needed
    });
});
