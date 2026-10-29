/* =========================================================
        EMPLOYEE PROFILE - DOCUMENTS JS
        ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const search = document.getElementById("epdSearch");
    const typeFilter = document.getElementById("epdTypeFilter");
    const statusFilter = document.getElementById("epdStatusFilter");

    const rows = document.querySelectorAll(
        "#epdDocumentTableBody tr"
    );

    const noResults = document.getElementById("epdNoResults");

    let selectedDocument = "";


    /* =====================================================
    FILTER DOCUMENTS
    ===================================================== */

    function filterDocuments() {

        const searchValue =
            search.value.toLowerCase().trim();

        const typeValue =
            typeFilter.value.toLowerCase();

        const statusValue =
            statusFilter.value.toLowerCase();

        let visibleRows = 0;

        rows.forEach(function (row) {

            const documentName =
                row.dataset.document.toLowerCase();

            const documentType =
                row.dataset.type.toLowerCase();

            const documentStatus =
                row.dataset.status.toLowerCase();

            const matchesSearch =
                !searchValue ||
                documentName.includes(searchValue);

            const matchesType =
                !typeValue ||
                documentType === typeValue;

            const matchesStatus =
                !statusValue ||
                documentStatus === statusValue;

            if (
                matchesSearch &&
                matchesType &&
                matchesStatus
            ) {

                row.style.display = "";
                visibleRows++;

            } else {

                row.style.display = "none";

            }

        });

        noResults.classList.toggle(
            "d-none",
            visibleRows !== 0
        );

    }


    search.addEventListener(
        "input",
        filterDocuments
    );

    typeFilter.addEventListener(
        "change",
        filterDocuments
    );

    statusFilter.addEventListener(
        "change",
        filterDocuments
    );


    /* =====================================================
    SELECT DOCUMENT
    ===================================================== */

    window.epdViewDocument = function (documentName) {

        selectedDocument = documentName;

        document.getElementById(
            "epdSelectedDocument"
        ).textContent = documentName;

        /*
        * Demo behavior:
        * In Laravel, this will load the selected
        * document's actual database values.
        */

        if (documentName === "Offer Letter") {

            document.getElementById(
                "epdDocumentType"
            ).value = "Offer Letter";

            document.getElementById(
                "epdVerificationStatus"
            ).value = "Verified";

            document.getElementById(
                "epdVerifiedBy"
            ).value = "Anita Rao";

        }

        if (documentName === "NDA") {

            document.getElementById(
                "epdDocumentType"
            ).value = "NDA";

            document.getElementById(
                "epdVerificationStatus"
            ).value = "Verified";

            document.getElementById(
                "epdVerifiedBy"
            ).value = "Anita Rao";

        }

        if (documentName === "ID Proof") {

            document.getElementById(
                "epdDocumentType"
            ).value = "ID Proof";

            document.getElementById(
                "epdVerificationStatus"
            ).value = "Pending";

            document.getElementById(
                "epdVerifiedBy"
            ).value = "";

        }

        if (documentName === "Certification") {

            document.getElementById(
                "epdDocumentType"
            ).value = "Certification";

            document.getElementById(
                "epdVerificationStatus"
            ).value = "Verified";

            document.getElementById(
                "epdVerifiedBy"
            ).value = "Anita Rao";

        }

        document
            .querySelector(".epd-form-area")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    };


    /* =====================================================
    REVIEW DOCUMENT
    ===================================================== */

    window.epdReviewDocument = function (documentName) {

        selectedDocument = documentName;

        document.getElementById(
            "epdSelectedDocument"
        ).textContent = documentName;

        document.getElementById(
            "epdDocumentType"
        ).value = documentName === "ID Proof"
                ? "ID Proof"
                : "";

        document.getElementById(
            "epdVerificationStatus"
        ).value = "Pending";

        document
            .querySelector(".epd-form-area")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    };


    /* =====================================================
    UPLOAD MODAL
    ===================================================== */

    const uploadModalElement =
        document.getElementById("epdUploadModal");

    const uploadModal =
        bootstrap.Modal.getOrCreateInstance(
            uploadModalElement
        );


    document.getElementById(
        "epdHeaderUploadBtn"
    ).addEventListener("click", function () {

        uploadModal.show();

    });


    document.getElementById(
        "epdUploadAction"
    ).addEventListener("click", function () {

        uploadModal.show();

    });


    /* =====================================================
    FILE UPLOAD
    ===================================================== */

    const uploadZone =
        document.getElementById("epdUploadZone");

    const fileInput =
        document.getElementById("epdFileInput");

    const selectedFile =
        document.getElementById("epdSelectedFile");

    const fileName =
        document.getElementById("epdFileName");

    const fileSize =
        document.getElementById("epdFileSize");

    uploadZone.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        function () {

            if (this.files.length) {

                showSelectedFile(
                    this.files[0]
                );

            }

        }
    );


    function showSelectedFile(file) {

        fileName.textContent =
            file.name;

        fileSize.textContent =
            formatFileSize(file.size);

        selectedFile.classList.remove(
            "d-none"
        );

    }


    function formatFileSize(bytes) {

        if (!bytes) {
            return "0 KB";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];

        const index =
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            );

        return (
            parseFloat(
                (
                    bytes /
                    Math.pow(1024, index)
                ).toFixed(2)
            ) +
            " " +
            units[index]
        );

    }


    document.getElementById(
        "epdRemoveFile"
    ).addEventListener(
        "click",
        function () {

            fileInput.value = "";

            selectedFile.classList.add(
                "d-none"
            );

        }
    );


    /* =====================================================
    DRAG & DROP
    ===================================================== */

    uploadZone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            uploadZone.classList.add(
                "dragover"
            );

        }
    );


    uploadZone.addEventListener(
        "dragleave",
        function () {

            uploadZone.classList.remove(
                "dragover"
            );

        }
    );


    uploadZone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            uploadZone.classList.remove(
                "dragover"
            );

            if (
                event.dataTransfer.files.length
            ) {

                const file =
                    event.dataTransfer.files[0];

                showSelectedFile(file);

            }

        }
    );


    /* =====================================================
    CONFIRM UPLOAD
    ===================================================== */

    document.getElementById(
        "epdUploadConfirm"
    ).addEventListener(
        "click",
        function () {

            if (!fileInput.files.length) {

                alert(
                    "Please select a document first."
                );

                return;

            }

            uploadModal.hide();

            showDocumentMessage(
                "Document uploaded successfully."
            );

        }
    );


    /* =====================================================
    PREVIEW
    ===================================================== */

    document.getElementById(
        "epdPreviewAction"
    ).addEventListener(
        "click",
        function () {

            if (!selectedDocument) {

                alert(
                    "Please select a document first."
                );

                return;

            }

            showDocumentMessage(
                "Opening preview for " +
                selectedDocument +
                "."
            );

        }
    );


    /* =====================================================
    DOWNLOAD
    ===================================================== */

    document.getElementById(
        "epdDownloadAction"
    ).addEventListener(
        "click",
        function () {

            if (!selectedDocument) {

                alert(
                    "Please select a document first."
                );

                return;

            }

            showDocumentMessage(
                "Preparing " +
                selectedDocument +
                " for download."
            );

        }
    );


    /* =====================================================
    STATUS ACTIONS
    ===================================================== */

    document
        .querySelectorAll(".epd-status-action")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (
                        !selectedDocument &&
                        !this.classList.contains("delete")
                    ) {

                        alert(
                            "Please select a document first."
                        );

                        return;

                    }

                    const newStatus =
                        this.dataset.status;

                    if (newStatus) {

                        document.getElementById(
                            "epdVerificationStatus"
                        ).value =
                            newStatus === "Re-upload"
                                ? "Re-upload Required"
                                : newStatus;

                    }

                    if (
                        this.classList.contains("delete")
                    ) {

                        const confirmed =
                            confirm(
                                "Are you sure you want to delete " +
                                selectedDocument +
                                "?"
                            );

                        if (!confirmed) {
                            return;
                        }

                        showDocumentMessage(
                            selectedDocument +
                            " deleted successfully."
                        );

                        return;

                    }

                    showDocumentMessage(
                        selectedDocument +
                        " status changed to " +
                        newStatus +
                        "."
                    );

                }
            );

        });


    /* =====================================================
    MESSAGE
    ===================================================== */

    function showDocumentMessage(message) {

        let container =
            document.getElementById(
                "epdMessageContainer"
            );

        if (!container) {

            container =
                document.createElement("div");

            container.id =
                "epdMessageContainer";

            container.style.position =
                "fixed";

            container.style.right =
                "22px";

            container.style.bottom =
                "22px";

            container.style.zIndex =
                "2000";

            document.body.appendChild(
                container
            );

        }


        const messageBox =
            document.createElement("div");

        messageBox.style.background =
            "#24263d";

        messageBox.style.color =
            "#fff";

        messageBox.style.padding =
            "12px 16px";

        messageBox.style.borderRadius =
            "11px";

        messageBox.style.marginTop =
            "8px";

        messageBox.style.boxShadow =
            "0 10px 30px rgba(31,35,69,.18)";

        messageBox.innerHTML =
            '<i class="bi bi-check-circle-fill me-2"></i>' +
            message;


        container.appendChild(
            messageBox
        );


        setTimeout(
            function () {

                messageBox.style.opacity =
                    "0";

                messageBox.style.transform =
                    "translateY(8px)";

                messageBox.style.transition =
                    ".25s ease";

                setTimeout(
                    function () {
                        messageBox.remove();
                    },
                    300
                );

            },
            2500
        );

    }

});