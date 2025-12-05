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

function generateUUIDv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            let r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
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
    $("#get-status-form").validate({
        ignore: [],
        normalizer: function (value) {
            return value.trim();
        },
        rules: {
            correlationId: {
                required: true,
            },
            srcClientId: {
                required: true,
            },
            batchId: {
                required: true,
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
        messages: {},
        submitHandler: function (_form, event) {
            event.preventDefault();
        },
    });
});
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    $("#spinner").removeClass("loading");


    const reference = generateUUIDv4();
    $("#correlationId").val(reference);
    function generateReference() {
        const length = getRandomInt(6, 40); // Random length between 6 and 40
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-._~"; // Allowed characters
        let result = "";

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }

        return result;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Handle Create Funding Transfer form submission
    $("#get-status-form").on("submit", function (e) {
        e.preventDefault();

        if ($("#get-status-form").valid()) {
            const correlationId = $("#correlationId").val();
            const srcClientId = $("#srcClientId").val();
            const batchId = $("#batchId").val();

            // Display request details

            // Log request data and URL
            console.log("URL:", SERVER_URL + `/${srcClientId}/dpas/batch/status/${batchId}`);

            const URL = "URL=" + SERVER_URL + `/${srcClientId}/dpas/batch/status/${batchId}`;

            displayResults("#requestBodyContent", URL);


            // Show the loader
            showLoader();
            const requestHeaders = {
                "correlation-id": correlationId,
                // add other headers here as needed
                "Content-Type": "application/json"
            };
            displayResults("#requestHeadersContent", requestHeaders);

            $.ajax({
                url: SERVER_URL + `/srci/${srcClientId}/dpas/batch/status/${batchId}`,
                type: "GET",
                headers: requestHeaders,
                contentType: "application/json",
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
        // You can add as many fields as needed
    });
});
