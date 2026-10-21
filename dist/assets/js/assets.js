document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
    ELEMENTS
    ===================================================== */

    const assetRows = document.querySelectorAll(".ea-asset-row");
    const searchInput = document.getElementById("eaAssetSearch");
    const typeFilter = document.getElementById("eaAssetTypeFilter");
    const emptyState = document.getElementById("eaEmptyState");

    const toastElement = document.getElementById("eaToast");
    const toastTitle = document.getElementById("eaToastTitle");
    const toastMessage = document.getElementById("eaToastMessage");

    let selectedAsset = "Dell Latitude 5440";


    /* =====================================================
    TOAST
    ===================================================== */

    function showToast(title, message) {

        if (!toastElement) return;

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        const toast = bootstrap.Toast.getOrCreateInstance(
            toastElement,
            {
                delay: 3000
            }
        );

        toast.show();
    }


    /* =====================================================
    ASSET FILTER
    ===================================================== */

    function filterAssets() {

        const searchValue = searchInput.value
            .toLowerCase()
            .trim();

        const selectedType = typeFilter.value;

        let visibleCount = 0;

        assetRows.forEach(function (row) {

            const rowType = row.dataset.type || "";
            const rowSearch = row.dataset.search || "";

            const matchesSearch =
                rowSearch.toLowerCase().includes(searchValue);

            const matchesType =
                selectedType === "all" ||
                rowType === selectedType;

            if (matchesSearch && matchesType) {

                row.classList.remove("d-none");
                visibleCount++;

            } else {

                row.classList.add("d-none");

            }

        });

        if (emptyState) {

            if (visibleCount === 0) {
                emptyState.classList.remove("d-none");
            } else {
                emptyState.classList.add("d-none");
            }

        }
    }


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterAssets
        );
    }


    if (typeFilter) {
        typeFilter.addEventListener(
            "change",
            filterAssets
        );
    }


    /* =====================================================
    VIEW ASSET
    ===================================================== */

    document.querySelectorAll(".ea-view-asset").forEach(function (button) {

        button.addEventListener("click", function () {

            const assetName = this.dataset.asset;

            selectedAsset = assetName;

            const detailName =
                document.getElementById("eaDetailAssetName");

            const detailType =
                document.getElementById("eaDetailAssetType");

            if (detailName) {
                detailName.textContent = assetName;
            }

            if (detailType) {

                if (assetName === "Dell 24 Monitor") {
                    detailType.textContent =
                        'Monitor · Dell · 24" Display';
                }

                else if (assetName === "Samsung Galaxy A55") {
                    detailType.textContent =
                        "Mobile · Samsung · Galaxy A55";
                }

                else if (assetName === "Logitech MX Keys") {
                    detailType.textContent =
                        "Keyboard · Logitech · MX Keys";
                }

                else {
                    detailType.textContent =
                        "Laptop · Dell · Latitude 5440";
                }

            }

            showToast(
                "Asset Selected",
                assetName + " details are now selected."
            );

        });

    });


    /* =====================================================
    RETURN ASSET
    ===================================================== */

    document.querySelectorAll(".ea-return-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const assetName = this.dataset.asset;

            const returnName =
                document.getElementById("eaReturnAssetName");

            if (returnName) {
                returnName.textContent = assetName;
            }

            const returnModal =
                document.getElementById("eaReturnAssetModal");

            if (returnModal) {

                const modal =
                    bootstrap.Modal.getOrCreateInstance(
                        returnModal
                    );

                modal.show();

            }

        });

    });


    /* =====================================================
    CONFIRM RETURN
    ===================================================== */

    const confirmReturnBtn =
        document.getElementById("eaConfirmReturnBtn");

    if (confirmReturnBtn) {

        confirmReturnBtn.addEventListener(
            "click",
            function () {

                const returnModal =
                    document.getElementById("eaReturnAssetModal");

                const modal =
                    bootstrap.Modal.getInstance(
                        returnModal
                    );

                if (modal) {
                    modal.hide();
                }

                showToast(
                    "Asset Returned",
                    selectedAsset +
                    " has been marked for return."
                );

            }
        );

    }


    /* =====================================================
    ASSIGN ASSET
    ===================================================== */

    const saveAssetBtn =
        document.getElementById("eaSaveAssetBtn");

    if (saveAssetBtn) {

        saveAssetBtn.addEventListener(
            "click",
            function () {

                const form =
                    document.getElementById(
                        "eaAssignAssetForm"
                    );

                if (form && !form.checkValidity()) {
                    form.classList.add("was-validated");
                    return;
                }

                const assignModal =
                    document.getElementById(
                        "eaAssignAssetModal"
                    );

                const modal =
                    bootstrap.Modal.getInstance(
                        assignModal
                    );

                if (modal) {
                    modal.hide();
                }

                showToast(
                    "Asset Assigned",
                    "The new asset has been assigned successfully."
                );

            }
        );

    }


    /* =====================================================
    EDIT ASSET
    ===================================================== */

    const editAssetBtn =
        document.getElementById("eaEditAssetBtn");

    if (editAssetBtn) {

        editAssetBtn.addEventListener(
            "click",
            function () {

                showToast(
                    "Edit Asset",
                    "Asset editing interface is ready for Laravel integration."
                );

            }
        );

    }


    /* =====================================================
    EXPORT
    ===================================================== */

    const exportBtn =
        document.getElementById("eaExportBtn");

    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            function () {

                showToast(
                    "Export Started",
                    "Asset records are being prepared for export."
                );

            }
        );

    }


    /* =====================================================
    TRANSFER
    ===================================================== */

    const transferBtn =
        document.getElementById("eaTransferBtn");

    if (transferBtn) {

        transferBtn.addEventListener(
            "click",
            function () {

                showToast(
                    "Transfer Asset",
                    "Asset transfer workflow can be connected to Laravel."
                );

            }
        );

    }


    /* =====================================================
    ASSET HISTORY
    ===================================================== */

    const historyBtn =
        document.getElementById("eaHistoryBtn");

    if (historyBtn) {

        historyBtn.addEventListener(
            "click",
            function () {

                showToast(
                    "Asset History",
                    "Assignment and lifecycle history can be loaded here."
                );

            }
        );

    }


    /* =====================================================
    MAINTENANCE
    ===================================================== */

    const maintenanceBtn =
        document.getElementById("eaMaintenanceBtn");

    if (maintenanceBtn) {

        maintenanceBtn.addEventListener(
            "click",
            function () {

                showToast(
                    "Maintenance",
                    "Maintenance record workflow is ready for backend integration."
                );

            }
        );

    }


    /* =====================================================
    DEFAULT STATE
    ===================================================== */

    filterAssets();

});