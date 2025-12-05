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
    $("#checkout-form").validate({
        ignore: [],
        normalizer: function (value) {
            return value.trim();
        },
        rules: {
            xSrcCxFlowId: {},
            xSrcResponseHost: {},
            srcClientId: {
                required: true,
                pattern:
                    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
            },
            srcDpaId: {
                required: true,
            },
            srcCorrelationId: {
                required: true,
                pattern:
                    /^([0-9a-f]{8}\.)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
            },
            srcDigitalCardId: {
                required: true,
            },
            shippingLine1: {
                maxlength: 75,
            },
            shippingCity: {
                maxlength: 50,
            },
            shippingState: {
                maxlength: 30,
            },
            shippingCountryCode: {
                maxlength: 2,
            },
            shippingZip: {
                maxlength: 16,
            },
            billingLine1: {
                maxlength: 75,
            },
            billingCity: {
                maxlength: 50,
            },
            billingState: {
                maxlength: 30,
            },
            billingCountryCode: {
                maxlength: 2,
            },
            billingZip: {
                maxlength: 16,
            },
            emailAddressFormat: {
                maxlength: 1,
            },
            emailAddress: {
                maxlength: 320,
            },
            deviceLocation: {
                maxlength: 9,
            },
            ipAddress: {
                maxlength: 39,
            },
            countryCode: {
                minlength: 1,
                maxlength: 4,
            },
            phoneNumber: {
            },
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

    // Just for test srcCorrelationId = 4f339be7.620d8dab-2ae6-4c19-9e2a-316a58c57016
    const reference = generateReference();
    $("#srcCorrelationId").val(reference);
    function generateReference() {
        function generateUUID() {
            // RFC4122 version 4 compliant UUID
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                /[xy]/g,
                function (c) {
                    const r = (Math.random() * 16) | 0;
                    const v = c === "x" ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                }
            );
        }

        const usePrefix = Math.random() < 0.5; // 50% chance to use prefix
        const uuid = generateUUID();

        if (usePrefix) {
            const prefix = Math.random().toString(16).slice(2, 10); // 8 hex chars
            return `${prefix}.${uuid}`;
        } else {
            return uuid;
        }
    }

    // Handle Create Funding Transfer form submission
    $("#checkout-form").on("submit", function (e) {
        e.preventDefault();

        if ($("#checkout-form").valid()) {

            // Collect address blocks
            const shippingAddress = {
                line1: $("#shippingLine1").val(),
                city: $("#shippingCity").val(),
                state: $("#shippingState").val(),
                countryCode: $("#shippingCountryCode").val(),
                zip: $("#shippingZip").val(),
            };
            const billingAddress = {
                line1: $("#billingLine1").val(),
                city: $("#billingCity").val(),
                state: $("#billingState").val(),
                countryCode: $("#billingCountryCode").val(),
                zip: $("#billingZip").val(),
            };

            const digitalTransactionData = {
                emailAddressFormat: $("#emailAddressFormat").val(),
                emailAddress: $("#emailAddress").val(),
                deviceLocation: $("#deviceLocation").val(),
                ipAddress: $("#ipAddress").val(),
                phoneNumber: {
                    countryCode: $("#countryCode").val(),
                    phoneNumber: $("#phoneNumber").val(),
                },
            };

            let requestData = {
                srcClientId: $("#srcClientId").val(),
                srcDpaId: $("#srcDpaId").val(),
                srcCorrelationId: $("#srcCorrelationId").val(),
                srcDigitalCardId: $("#srcDigitalCardId").val()
            };

            if (hasAnyValueDeep(shippingAddress))
                requestData.shippingAddress = shippingAddress;
            if (hasAnyValueDeep(billingAddress))
                requestData.billingAddress = billingAddress;
            if (hasAnyValueDeep(digitalTransactionData))
                requestData.digitalTransactionData = digitalTransactionData;


            console.log("Request Data:", requestData);

            const xSrcCxFlowId = $("#xSrcCxFlowId").val();
            const xSrcResponseHost = $("#xSrcResponseHost").val();

            // Display request details
            displayResults("#requestBodyContent", requestData);

            // Show the loader
            showLoader();
            const requestHeaders = {
                "X-Src-Cx-Flow-Id": xSrcCxFlowId,
                "X-Src-Response-Host": xSrcResponseHost,
                "Content-Type": "application/json"
            };
            displayResults("#requestHeadersContent", requestHeaders);

            $.ajax({
                url: SERVER_URL + `/transaction/credentials`,
                type: "POST",
                headers: requestHeaders,
                contentType: "application/json",
                data: JSON.stringify(requestData),
                success: function (response) {
                    console.log("Response:", response);

                    // Show backend HTTP response body
                    displayResults("#responseContent", response.body || response);

                    // --- Show Mastercard response headers from JSON, if present ---
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

function hasAnyValueDeep(obj) {
    if (typeof obj !== "object" || obj === null) return false;
    return Object.values(obj).some((val) =>
        typeof val === "object" && val !== null
            ? hasAnyValueDeep(val)
            : val !== undefined && val !== null && String(val).trim() !== ""
    );
}
