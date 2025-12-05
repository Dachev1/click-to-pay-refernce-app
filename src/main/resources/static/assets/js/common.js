$(document).ready(function () {
    $(document).on("click", ".copy-json-btn", function () {
        const target = $(this).data("target");
        const $pre = $(target);
        if ($pre.length) {
            const text = $pre.text();
            navigator.clipboard.writeText(text);
            $(this).attr("title", "Copied!").tooltip("show");
            setTimeout(() => {
                $(this).attr("title", "Copy").tooltip("hide");
            }, 800);
        }
    });
});
