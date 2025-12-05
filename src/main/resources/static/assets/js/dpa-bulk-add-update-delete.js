let programTypeOptions = null;

let dpaTemplate, acquirerTemplate;

let serviceId = null;

function loadProgramTypeOptions(callback) {
    if (programTypeOptions) {
        callback(programTypeOptions);
    } else {
        $.getJSON("/assets/config/program-type.json", function (data) {
            programTypeOptions = data;
            callback(data);
        });
    }
}

function setDynamicDropdownValues($context) {
    loadProgramTypeOptions(function (options) {
        let $dropdowns;
        if ($context && $context.is('select[name="programType"]')) {
            $dropdowns = $context;
        } else if ($context) {
            $dropdowns = $context.find('select[name="programType"]');
        } else {
            $dropdowns = $('select[name="programType"]');
        }
        $dropdowns.each(function () {
            const $el = $(this);
            const currentVal = $el.val(); // preserve selected value if any
            $el.empty();

            $.each(options, function (i, entry) {
                const $option = $("<option></option>")
                    .attr("value", entry.value)
                    .text(entry.name);

                // select the current value if exists, otherwise default to first
                if (entry.value === currentVal || (!currentVal && i === 0)) {
                    $option.prop("selected", true);
                }

                $el.append($option);
            });
        });
    });
}

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


function collectDpa($dpa) {
    const dpaObj = {
        srcDpaId: $dpa.find('[name="srcDpaId"]').val(),
        dpaData: {
            dpaName: $dpa.find('[name="dpaName"]').val(),
            dpaLogoUri: $dpa.find('[name="dpaLogoUri"]').val(),
            dpaUri: $dpa.find('[name="dpaUri"]').val(),
            dpaPresentationName: $dpa.find('[name="dpaPresentationName"]').val(),
            dpaAddress: {
                name: $dpa.find('[name="name"]').val(),
                line1: $dpa.find('[name="line1"]').val(),
                line2: $dpa.find('[name="line2"]').val(),
                line3: $dpa.find('[name="line3"]').val(),
                city: $dpa.find('[name="city"]').val(),
                state: $dpa.find('[name="state"]').val(),
                countryCode: $dpa.find('[name="countryCode"]').val(),
                zip: $dpa.find('[name="zip"]').val(),
            },
        },
        merchantCategoryCodes: $dpa
            .find('[name="merchantCategoryCodes[]"]')
            .map(function () {
                return $(this).val();
            })
            .get(),
        threeDSDefaultdata: {
            defaultAcquirerBin: $dpa.find('[name="defaultAcquirerBin"]').val(),
            defaultAcquirerMerchantId: $dpa.find('[name="defaultAcquirerMerchantId"]').val(),
            defaultMerchantCountryCode: $dpa.find('[name="defaultMerchantCountryCode"]').val(),
            defaultMerchantCategoryCode: $dpa.find('[name="defaultMerchantCategoryCode"]').val(),
        },
        acquirerData: $dpa
            .find(".acquirer-data-list .acquirer-data-fields")
            .map(function () {
                return {
                    acquirerIca: $(this).find('[name="acquirerIca"]').val(),
                    acquirerBin: $(this).find('[name="acquirerBin"]').val(),
                    acquirerMerchantId: $(this).find('[name="acquirerMerchantId"]').val(),
                };
            })
            .get(),
    };

    // Only add these fields if they have non-empty values
    const hasAcqRel = $dpa.find('[name="hasAcquirerRelationship"]').val();
    if (hasAcqRel) dpaObj.hasAcquirerRelationship = hasAcqRel;

    const subMerch = $dpa.find('[name="subMerchantId"]').val();
    if (subMerch) dpaObj.subMerchantId = subMerch;

    const payFac = $dpa.find('[name="paymentFacilitatorId"]').val();
    if (payFac) dpaObj.paymentFacilitatorId = payFac;

    // Remove defaultMerchantCategoryCode if empty
    if (!dpaObj.threeDSDefaultdata.defaultMerchantCategoryCode) {
        delete dpaObj.threeDSDefaultdata.defaultMerchantCategoryCode;
    }

    return dpaObj;
}


function GetMerchantCategoryCodeDynamicTextBox(value) {
    return (
        '<input class="form-control" name="merchantCategoryCodes[]" type="text" value = "' +
        value +
        '" /><br>' +
        '<input type="button" value="REMOVE" class="merchant-category-code-remove btn btn-danger" /><br><br>'
    );
}

// Function to show loader
function showLoader() {
    $("#spinner").addClass("loading");
}

// Function to hide loader
function hideLoader() {
    $("#spinner").removeClass("loading");
}

// -------------------- URL Parameter Handling --------------------
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Add/Remove Acquirer Data
function addAcquirer($dpa, acquirer) {
    console.log("Adding acquirer to DPA:", $dpa);
    const $template = $dpa.find(".acquirer-template").first();
    if ($template.length === 0) {
        console.warn("No .acquirer-template found inside DPA");
        return;
    }

    const $acq = $template
        .clone()
        .removeClass("acquirer-template")
        .addClass("acquirer-data-fields") // This is important
        .show();

    if (acquirer) {
        $acq.find('[name="acquirerIca"]').val(acquirer.acquirerIca || "");
        $acq.find('[name="acquirerBin"]').val(acquirer.acquirerBin || "");
        $acq.find('[name="acquirerMerchantId"]').val(
            acquirer.acquirerMerchantId || ""
        );
    }

    $acq.find(".remove-acquirer-btn").on("click", function () {
        $acq.remove();
    });

    $dpa.find(".acquirer-data-list").append($acq);
}

// Add/Remove DPA
function addDpa($dpaList, dpa, showRemove = true, openOnAdd = false) {
    const $dpa = dpaTemplate.clone();
    const dpaIndex = $dpaList.find(".card").length;
    const collapseId = `dpa-collapse-${dpaIndex}`;
    const headerId = `dpa-header-${dpaIndex}`;

    // Set UUIDs
    $dpa.find('[name="srcDpaId"]').val(generateUUIDv4());

    const accordionHtml = $(`
  <div class="card">
    <div class="card-header" id="${headerId}">
      <div class="d-flex w-100 align-items-center justify-content-between dpa-accordion-header" style="cursor:pointer;">
        <span class="dpa-label">DPA #${dpaIndex + 1}</span>
        <div class="d-flex align-items-center">
          ${showRemove ? `
            <button type="button" class="btn btn-danger btn-sm remove-dpa-btn mr-3">
              Remove DPA
            </button>` : ""
        }
          <button class="btn btn-link p-0 border-0 bg-transparent d-flex align-items-center dpa-toggle-btn"
                  type="button"
                  data-toggle="collapse"
                  data-target="#${collapseId}"
                  aria-expanded="true"
                  aria-controls="${collapseId}"
                  style="text-decoration:none;">
            <i class="fa fa-chevron-down accordion-arrow"></i>
          </button>
        </div>
      </div>
    </div>
   <div id="${collapseId}" class="collapse" aria-labelledby="${headerId}" data-parent=".dpas-container">
      <div class="card-body"></div>
    </div>
  </div>
`);

    // After appending the accordionHtml, add this:
    accordionHtml.find('.dpa-accordion-header').on('click', function (e) {
        // Don't trigger if clicking on a button (remove or arrow)
        if ($(e.target).is('button') || $(e.target).is('i')) return;

        const $collapse = $(this).closest('.card').find('.collapse');
        if ($collapse.hasClass('show')) {
            $collapse.collapse('hide');
        } else {
            // Hide others first, then show this
            $(this).closest('.dpas-container').find('.collapse.show').collapse('hide');
            setTimeout(() => {
                $collapse.collapse('show');
            }, 10);
        }
    });


    // Prefill values if provided
    if (dpa) {
        $dpa.find('[name="srcDpaId"]').val(dpa.srcDpaId || "");
        $dpa.find('[name="dpaName"]').val(dpa.dpaName || "");
        $dpa.find('[name="dpaLogoUri"]').val(dpa.dpaLogoUri || "");
        $dpa.find('[name="dpaUri"]').val(dpa.dpaUri || "");
        $dpa.find('[name="dpaPresentationName"]').val(
            dpa.dpaPresentationName || ""
        );
        if (dpa.acquirerData && Array.isArray(dpa.acquirerData)) {
            dpa.acquirerData.forEach((a) => addAcquirer($dpa, a));
        } else {
            addAcquirer($dpa);
        }
    } else {
        addAcquirer($dpa);
    }

    // Add remove button event
    if (showRemove) {
        accordionHtml.find(".remove-dpa-btn").on("click", function () {
            accordionHtml.remove();
        });
    }

    // Acquirer event binding
    accordionHtml.find(".add-acquirer-btn").on("click", function () {
        addAcquirer($dpa);
    });

    setDynamicDropdownValues($dpa);
    accordionHtml.find(".card-body").append($dpa);
    // Enable merchant category code "Add" button inside this specific DPA
    $dpa.find(".multiple-merchant-category-code-add-btn").on(
        "click",
        function () {
            const $targetDiv = $dpa.find("#merchant-category-codes-div");
            const newField = $(GetMerchantCategoryCodeDynamicTextBox(""));
            const wrapper = $(
                "<div class='col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 p-0' />"
            );
            wrapper.append(newField);
            $targetDiv.append(wrapper);
        }
    );

    $dpaList.append(accordionHtml);

    markRequiredAsterisks(accordionHtml);

    //  After appending, re-number DPA accordions
    renumberDpas($dpaList.closest(".card"));

    if (openOnAdd) {
        const $allCards = $dpaList.find('.card');
        const $lastCard = $allCards.last();
        const $lastCollapse = $lastCard.find('.collapse');
        const $toHide = $allCards.not($lastCard).find('.collapse.show');

        if ($toHide.length === 0) {
            $lastCollapse.collapse('show');
        } else {
            let hiddenCount = 0;
            // Remove any old handler first to prevent leaks!
            $toHide.off('hidden.bs.collapse.forceopen');
            $toHide.on('hidden.bs.collapse.forceopen', function handler() {
                hiddenCount++;
                if (hiddenCount === $toHide.length) {
                    setTimeout(() => $lastCollapse.collapse('show'), 10); // Small delay helps with rendering
                    $toHide.off('hidden.bs.collapse.forceopen');
                }
            });
            $toHide.collapse('hide');
        }
    }




}

// Add/Remove Request (Accordion Item)
function addRequest($container, idx, req) {
    const itemId = `accordion-item-${idx}`;
    const collapseId = `collapse-${idx}`;

    // Get template HTML
    const itemHtml = $("#item-template").html();

    // Accordion structure
    const $card = $(`
    <div class="card main-body">
        <div class="card-header header-body px-3 py-2" id="${itemId}" style="cursor:pointer;">
            <div class="d-flex w-100 align-items-center justify-content-between header-click-area">
            <span class="request-label">Request #${idx + 1}</span>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-danger btn-sm remove-item-btn ml-2 mr-3"
                            style="display:${idx === 0 ? "none" : "inline-block"}">
                    Remove Request
                    </button>
                    <i class="fa fa-chevron-down accordion-arrow" style="font-size:1.2rem"></i>
                </div>
                </div>
            </div>
            <div id="${collapseId}" class="collapse${idx === 0 ? " show" : ""}" aria-labelledby="${itemId}" data-parent="#items-container">
                <div class="card-body">
                ${itemHtml}
                </div>
            </div>
    </div>
`);


    $card.find('.card-header').on('click', function (e) {
        // Prevent toggling when clicking Remove button only
        if ($(e.target).closest('.remove-item-btn').length) return;
        const $collapse = $card.find('.collapse');
        $collapse.collapse('toggle');
    });


    const radioName = `dpaType-${idx}`;
    $card.attr("data-radio-name", radioName); // Store for later use

    // Set unique name for both radio buttons
    $card.find('input[type="radio"][name="dpaType"]').attr("name", radioName);

    $card.find('[name="serviceId"]').val(serviceId);

    // Remove handler
    $card.find(".remove-item-btn").on("click", function () {
        $card.remove();
        renumberRequests();
        setTimeout(resetFormValidationAndHandler, 0);

        // Ensure at least one request always exists
        if ($("#items-container .card").length === 0) {
            addRequest($("#items-container"), 0);
            renumberRequests();
            setTimeout(resetFormValidationAndHandler, 0);
        }
    });

    // Fill/override values here from `req` if needed

    $container.append($card);

    markRequiredAsterisks($card);

    // HIGHLIGHT DEFAULT ON LOAD:
    const checkedVal = $card
        .find(`input[type="radio"][name="${radioName}"]:checked`)
        .val();
    $card.find(".dpa-checkbox-left, .dpa-checkbox-right").removeClass("active");
    if (checkedVal === "singleDpa") {
        $card.find(".dpa-checkbox-left").addClass("active");
    } else if (checkedVal === "multipleDpa") {
        $card.find(".dpa-checkbox-right").addClass("active");
    }

    // Find where to inject DPA config
    const $dpaList = $card.find(".dpas-container");

    // Initial DPA section (always add at least one)
    addDpa($dpaList, null, false, true); // openOnAdd = true, first DPA open on page load

    setDynamicDropdownValues($card);

    // Default: hide add-DPA button unless multiple is checked
    const isMultiple =
        $card.find(`input[name="${radioName}"]:checked`).val() ===
        "multipleDpa";
    $card.find(".add-dpa-btn").toggle(isMultiple);

    // Handle radio change
    $card.find(`input[name="${radioName}"]`).on("change", function () {
        const isMultiple = $(this).val() === "multipleDpa";
        const $addDpaBtn = $card.find(".add-dpa-btn");
        const $dpaList = $card.find(".dpas-container");
        if (isMultiple) {
            $addDpaBtn.show();
        } else {
            $addDpaBtn.hide();
            $dpaList.find(".single-dpa-fields:not(:first)").remove();
        }
        // --- ADD this highlight logic ---
        $card
            .find(".dpa-checkbox-left, .dpa-checkbox-right")
            .removeClass("active");
        if ($(this).val() === "singleDpa") {
            $card.find(".dpa-checkbox-left").addClass("active");
        } else {
            $card.find(".dpa-checkbox-right").addClass("active");
        }
    });

    // Handle Add DPA button click
    // When adding a new DPA block
    $card.find(".add-dpa-btn").on("click", function () {
        const $dpaList = $card.find(".dpas-container");
        addDpa($dpaList, null, true, true); // open last DPA after add

    });

}

function renumberRequests() {
    $("#items-container > .card").each(function (i) {
        const collapseId = `collapse-${i}`;
        const headerId = `accordion-item-${i}`;

        $(this)
            .find(".btn-link span")
            .text(`Request #${i + 1}`);
        $(this).find(".card-header").attr("id", headerId);
        $(this)
            .find(".collapse")
            .attr("id", collapseId)
            .attr("aria-labelledby", headerId);
        $(this)
            .find(".btn-link")
            .attr("data-target", `#${collapseId}`)
            .attr("aria-controls", collapseId);

        // Show remove only if more than 1
        if (i === 0) {
            $(this).find(".remove-item-btn").hide();
        } else {
            $(this).find(".remove-item-btn").show();
        }

        // Re-number DPAs inside each request
        renumberDpas($(this));
    });
}

function renumberDpas($requestCard) {
    $requestCard.find(".dpas-container > .card").each(function (j) {
        const dpaCollapseId = `dpa-collapse-${j}`;
        const dpaHeaderId = `dpa-header-${j}`;

        $(this)
            .find(".btn-link span")
            .text(`DPA #${j + 1}`);
        $(this).find(".card-header").attr("id", dpaHeaderId);
        $(this)
            .find(".collapse")
            .attr("id", dpaCollapseId)
            .attr("aria-labelledby", dpaHeaderId);
        $(this)
            .find(".btn-link")
            .attr("data-target", `#${dpaCollapseId}`)
            .attr("aria-controls", dpaCollapseId);
    });
}

function renderRequests() {
    const mode = $("#noOfRequests").val();
    const $container = $("#items-container");
    $container.empty();
    $("#add-item-btn-wrapper").toggle(mode === "multipleRequest");
    addRequest($container, 0);
    renumberRequests(); // <--- always renumber after render
    resetFormValidationAndHandler();
}

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

function toggleOptionalFieldsByAction($card) {
    const action = $card.find('[name="action"]').val();
    if (action === "DELETE") {
        $card.find(".optional-dpa-section").hide();
    } else {
        $card.find(".optional-dpa-section").show();
    }
}

function initFormValidation() {
    $("#dpa-add-update-info-form").validate({
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
            noOfRequests: {
                required: true,
            },
            action: {
                required: true,
            },
            requestId: {},
            customerId: {
                maxlength: 60,
            },
            programType: {
                required: true,
            },
            trid: {},
            serviceId: {},
            category: {
                maxlength: 255,
            },
            programName: {
                maxlength: 100,
            },
            dpaType: {},
            srcDpaId: {
                required: true,
                maxlength: 255,
            },
            hasAcquirerRelationship: {},
            subMerchantId: {},
            paymentFacilitatorId: {},
            merchantCategoryCodes: {
                maxlength: 200,
            },
            dpaPresentationName: {
                maxlength: 255,
            },
            dpaName: {
                maxlength: 60,
            },
            dpaLogoUri: {
                maxlength: 1024,
            },
            dpaUri: {
                maxlength: 1024,
            },
            name: {
                maxlength: 75,
            },
            line1: {
                maxlength: 75,
            },
            line2: {
                maxlength: 75,
            },
            line3: {
                maxlength: 75,
            },
            city: {
                maxlength: 50,
            },
            state: {
                maxlength: 30,
            },
            countryCode: {
                maxlength: 2,
            },
            zip: {
                maxlength: 20,
            },
            defaultAcquirerBin: {},
            defaultAcquirerMerchantId: {},
            defaultMerchantCountryCode: {},
            defaultMerchantCategoryCode: {},
            acquirerIca: {
                required: true,
            },
            acquirerBin: {},
            acquirerMerchantId: {
                required: true,
            },
        },
        messages: {
            dpaName: {
                pattern:
                    "Only letters, digits, spaces and allowed special characters are permitted.",
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
}

function bindFormSubmitHandler() {
    $("#dpa-add-update-info-form")
        .off("submit")
        .on("submit", function (e) {
            e.preventDefault();

            if ($("#dpa-add-update-info-form").valid()) {
                // Collect all fields outside the dynamic DPA block as usual
                const correlationId = $("#correlationId").val();
                const srcClientId = $("#srcClientId").val();
                const requestData = collectRequestData();

                // Show request for preview
                displayResults("#requestBodyContent", requestData);

                // Log request data and URL
                console.log("Request Data:", requestData);
                console.log("URL:", `/${srcClientId}/dpas/batch`);

                // Show the loader
                showLoader();
                const requestHeaders = {
                    "correlation-id": correlationId,
                    // add other headers here as needed
                    "Content-Type": "application/json"
                };
                displayResults("#requestHeadersContent", requestHeaders);

                $.ajax({
                    url: SERVER_URL + `/srci/${srcClientId}/dpas/batch`,
                    type: "POST",
                    headers: requestHeaders,
                    contentType: "application/json",
                    data: JSON.stringify(requestData),
                    success: function (response, textStatus, jqXHR) {
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
}

function collectAllResponseHeaders(jqXHR) {
    const headersStr = jqXHR.getAllResponseHeaders(); // Raw string
    const headersArr = headersStr.trim().split(/[\r\n]+/);
    const headerMap = {};
    headersArr.forEach(function (line) {
        const parts = line.split(': ');
        const header = parts.shift();
        const value = parts.join(': ');
        headerMap[header] = value;
    });
    return headerMap;
}


function resetFormValidationAndHandler() {
    $("#dpa-add-update-info-form")
        .removeData("validator")
        .removeData("unobtrusiveValidation");
    initFormValidation();
    bindFormSubmitHandler();
}

$(document).ready(function () {
    // TEMPLATES
    dpaTemplate = $(".dpa-template").clone().removeClass("dpa-template").show();
    acquirerTemplate = $(".acquirer-template")
        .clone()
        .removeClass("acquirer-template")
        .show();
    // ---- Global for program type options ----

    markRequiredAsterisks(); // for initial load

    // ------------
    // -------- Tab Click Logic --------------------
    $(".api-names-box").on("click", function (e) {
        const action = $(this).data("action");

        if (action === "GET") {
            return; // Allow default navigation for GET
        }

        e.preventDefault(); // Prevent navigation for internal actions

        window.history.replaceState({}, "", `?action=${action}`);

        // Set hidden field
        $("#actionMode").val(action);

        // Highlight selected tab
        $(".api-names-box").removeClass("active");
        $(this).addClass("active");

        // Update heading
        $("h1").text(`Asynchronous - DPA bulk Add/Update/Delete`);

        // Toggle visibility
        if (action === "DELETE") {
            $(".optional-dpa-section").hide();
            $("#programType").closest(".row").show();
            $("#srcDpaId").closest(".row").show();
        } else {
            $(".optional-dpa-section").show();
        }
    });

    const tabAction = getQueryParam("action");

    if (
        tabAction &&
        ["ADD", "UPDATE", "DELETE"].includes(tabAction.toUpperCase())
    ) {
        const tabSelector = `.api-names-box[data-action="${tabAction.toUpperCase()}"]`;

        // Delay to ensure DOM and event handlers are ready
        setTimeout(() => {
            const tabElement = document.querySelector(tabSelector);
            if (tabElement) {
                tabElement.click(); // This triggers your .on("click") handler
            } else {
                console.warn("Tab element not found:", tabSelector);
            }
        }, 0);
    }

    // code to add & remove merchant category code Dynamically
    $("#merchantCategoryCodesBtnAdd").on("click", function () {
        let div = $(
            "<div class='col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 p-0' />"
        );
        div.html(GetMerchantCategoryCodeDynamicTextBox(""));
        $("#merchant-category-codes-div").append(div);
    });
    $("body").on("click", ".merchant-category-code-remove", function () {
        $(this).closest("div").remove();
    });

    initFormValidation();

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

    // Form validation rules

    $('[data-toggle="tooltip"]').tooltip();

    setDynamicDropdownValues();

    $("#spinner").removeClass("loading");

    // Function to display results

    const reference = generateUUIDv4();
    $("#correlationId").val(reference);

    // Handle Create Funding Transfer form submission
    bindFormSubmitHandler();

    // Fetch configuration values from the backend
    $.get(SERVER_URL + "/api/config", function (data) {
        // Example: set input values if present in response
        if (data.srcClientId) {
            $("#srcClientId").val(data.srcClientId);
            $("#serviceId").val(null);  // currently not assigning serviceId from config as it fails
        }
        // You can add as many fields as needed
    });

    // Set random UUID values for srcDpaId and serviceId
    $("#srcDpaId").val(generateUUIDv4());
    $("#serviceId").val(serviceId);

    $("#noOfRequests").on("change", renderRequests);
    $("#add-item-btn").on("click", function () {
        const $container = $("#items-container");
        const idx = $container.find(".card.main-body").length;
        addRequest($container, idx);
        renumberRequests();
        resetFormValidationAndHandler();

        // Collapse all previous accordions
        const $prevCollapses = $container.find(".collapse.show").not(":last");
        if ($prevCollapses.length) {
            $prevCollapses.collapse('hide');

            // Listen for when all have finished collapsing
            let toClose = $prevCollapses.length;
            $prevCollapses.on('hidden.bs.collapse', function handler() {
                toClose--;
                if (toClose === 0) {
                    // All others are collapsed, open the new one
                    $container.find(".card.main-body").last().find('.collapse').collapse('show');
                    // Remove handler to avoid leaks
                    $prevCollapses.off('hidden.bs.collapse', handler);
                }
            });
        } else {
            // If nothing to collapse, just open the last one immediately
            $container.find(".card.main-body").last().find('.collapse').collapse('show');
        }
    });


    // Initial render
    renderRequests();
    renumberRequests();
    resetFormValidationAndHandler();

    // --- DATA COLLECTION for SUBMIT ---
    window.collectRequestData = function () {
        const mode = $("#noOfRequests").val();
        let items = [];

        // For ADD/UPDATE: full structure
        const processCard = ($card) => {
            const action = $card.find('[name="action"]').val();
            const programType =
                $card.find('select[name="programType"]').val() || "";

            const radioName = $card.attr("data-radio-name") || "dpaType";

            // For DELETE: only send required fields
            if (action === "DELETE") {
                let dpas = [];
                if (
                    $card
                        .find(`input[name="${radioName}"][value="singleDpa"]`)
                        .is(":checked")
                ) {
                    const $dpa = $card
                        .find(".dpas-container .single-dpa-fields")
                        .first();
                    const srcDpaId = $dpa.find('[name="srcDpaId"]').val();
                    if (srcDpaId) dpas.push({ srcDpaId });
                } else {
                    $card
                        .find(".dpas-container .single-dpa-fields")
                        .each(function () {
                            const srcDpaId = $(this)
                                .find('[name="srcDpaId"]')
                                .val();
                            if (srcDpaId) dpas.push({ srcDpaId });
                        });
                }

                if (dpas.length === 0) return;

                items.push({
                    action: "DELETE",
                    programType,
                    dpas,
                });
                return;
            }

            // For ADD/UPDATE
            const programName = $card.find('[name="programName"]').val();
            const requestId = $card.find('[name="requestId"]').val();
            const customerId = $card.find('[name="customerId"]').val();
            const trid = $card.find('[name="trid"]').val();
            const serviceId = $card.find('[name="serviceId"]').val();
            const category = $card.find('[name="category"]').val();

            let dpas = [];
            if (
                $card
                    .find(`input[name="${radioName}"][value="singleDpa"]`)
                    .is(":checked")
            ) {
                const $dpa = $card
                    .find(".dpas-container .single-dpa-fields")
                    .first();
                dpas.push(collectDpa($dpa));
            } else {
                $card
                    .find(".dpas-container .single-dpa-fields")
                    .each(function () {
                        dpas.push(collectDpa($(this)));
                    });
            }

            dpas = dpas.filter((d) => d && d.srcDpaId); // filter invalid DPAs

            if (dpas.length === 0) return;

            const item = {
                action: action || "ADD",
                programType,
                programName,
                dpas
            };
            if (requestId) item.requestId = requestId;
            if (customerId) item.customerId = customerId;
            if (trid) item.trid = trid;
            if (serviceId) item.serviceId = serviceId;
            if (category) item.category = category;

            items.push(item);
        };

        if (mode === "multipleRequest") {
            $("#items-container .card")
                .not(".card-template")
                .filter(":visible")
                .each(function () {
                    processCard($(this));
                });
        } else {
            processCard($("#items-container .card").first());
        }

        return { items };
    };

    // Delegated click handler
    $(document).on("click", ".add-acquirer-btn", function () {
        const $dpa = $(this).closest(".single-dpa-fields");
        console.log("Adding acquirer to DPA:", $dpa);
        addAcquirer($dpa);
    });

    $(document).on("change", '[name="action"]', function () {
        const $card = $(this).closest(".card");
        toggleOptionalFieldsByAction($card);
    });

    $(document).on(
        "click",
        ".dpa-checkbox-left, .dpa-checkbox-right",
        function (e) {
            const $input = $(this).find('input[type="radio"]');
            $input.prop("checked", true).trigger("change");
        }
    );

    $(document).on(
        "click",
        ".dpa-checkbox-left, .dpa-checkbox-right",
        function (e) {
            const $input = $(this).find('input[type="radio"]');
            $input.prop("checked", true).trigger("change");
        }
    );

    $(document).on('show.bs.collapse', '.collapse', function () {
        $(this).closest('.card').find('.accordion-arrow').addClass('rotated');
    });
    $(document).on('hide.bs.collapse', '.collapse', function () {
        $(this).closest('.card').find('.accordion-arrow').removeClass('rotated');
    });

});
