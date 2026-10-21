/* =========================================================
       ACCESS & ACCOUNTS
       Page-specific JavaScript only
       ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const accessForm = document.getElementById("eaAccessForm");

    if (accessForm) {
        accessForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const modalElement = document.getElementById("eaAddAccessModal");
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

            accessForm.reset();

            eaShowToast(
                "Access Granted",
                "The account access has been added successfully."
            );
        });
    }

});


/* =========================
SEARCH & FILTER
========================= */

function eaFilterAccess() {

    const searchInput = document.getElementById("eaAccessSearch");
    const statusSelect = document.getElementById("eaAccessStatus");
    const emptyState = document.getElementById("eaEmptyState");

    if (!searchInput || !statusSelect) {
        return;
    }

    const searchValue = searchInput.value.toLowerCase().trim();
    const statusValue = statusSelect.value.toLowerCase();

    const rows = document.querySelectorAll(".ea-access-row");

    let visibleCount = 0;

    rows.forEach(function (row) {

        const application =
            row.dataset.application.toLowerCase();

        const account =
            row.dataset.account.toLowerCase();

        const status =
            row.dataset.status.toLowerCase();

        const matchesSearch =
            application.includes(searchValue) ||
            account.includes(searchValue);

        const matchesStatus =
            !statusValue ||
            status === statusValue;

        if (matchesSearch && matchesStatus) {
            row.style.display = "flex";
            visibleCount++;
        } else {
            row.style.display = "none";
        }

    });

    if (emptyState) {
        emptyState.classList.toggle("d-none", visibleCount !== 0);
    }
}


/* =========================
VIEW ACCESS
========================= */

function eaViewAccess(application) {

    const title =
        document.getElementById("eaDetailsTitle");

    const applicationField =
        document.getElementById("eaDetailApplication");

    const accountField =
        document.getElementById("eaDetailAccount");

    if (title) {
        title.textContent = application;
    }

    if (applicationField) {
        applicationField.textContent = application;
    }

    if (accountField) {

        if (
            application === "Corporate Email" ||
            application === "Microsoft / Google"
        ) {
            accountField.textContent =
                "arun.kumar@company.com";
        } else {
            accountField.textContent =
                "arun.kumar";
        }
    }

    const modalElement =
        document.getElementById("eaDetailsModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


/* =========================
EDIT ACCESS
========================= */

function eaEditAccess(application) {

    eaShowToast(
        "Edit Access",
        application + " access is ready for editing."
    );
}


function eaEditFromDetails() {

    const detailsModal =
        bootstrap.Modal.getInstance(
            document.getElementById("eaDetailsModal")
        );

    if (detailsModal) {
        detailsModal.hide();
    }

    setTimeout(function () {

        const addModal =
            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("eaAddAccessModal")
            );

        addModal.show();

    }, 250);
}


/* =========================
MORE ACTIONS
========================= */

function eaMoreAccess(application) {

    eaShowToast(
        "More Actions",
        "Additional actions for " + application + " are available in the IT access menu."
    );
}


/* =========================
HISTORY
========================= */

function eaViewHistory() {

    eaShowToast(
        "Access History",
        "Full access audit history will open here."
    );
}


/* =========================
EXPORT
========================= */

function eaExportAccess() {

    eaShowToast(
        "Export Started",
        "Employee access information is being prepared for export."
    );
}


/* =========================
TOAST
========================= */

function eaShowToast(title, message) {

    const toast =
        document.getElementById("eaToast");

    const toastTitle =
        document.getElementById("eaToastTitle");

    const toastMessage =
        document.getElementById("eaToastMessage");

    if (!toast) {
        return;
    }

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.eaToastTimer);

    window.eaToastTimer =
        setTimeout(function () {
            toast.classList.remove("show");
        }, 3200);
}