document.addEventListener("DOMContentLoaded", function () {

    const page = document.querySelector(".employee-exit-page");

    if (!page) return;


    /* =========================================
       ELEMENTS
       ========================================= */

    const resignationModal = page.querySelector("#resignationModal");

    const openResignationBtn = page.querySelector("#openResignationBtn");
    const editResignationBtn = page.querySelector("#editResignationBtn");

    const closeResignationBtn = page.querySelector("#closeResignationBtn");
    const cancelResignationBtn = page.querySelector("#cancelResignationBtn");

    const submitResignationBtn = page.querySelector("#submitResignationBtn");

    const resignationDate = page.querySelector("#resignationDate");
    const noticePeriod = page.querySelector("#noticePeriod");

    const calculatedLastDay = page.querySelector("#calculatedLastDay");

    const resignationConfirmation =
        page.querySelector("#resignationConfirmation");

    const exitToast = page.querySelector("#exitToast");
    const exitToastMessage = page.querySelector("#exitToastMessage");
    const closeExitToast = page.querySelector("#closeExitToast");


    /* =========================================
       MODAL
       ========================================= */

    function openResignationModal() {
        resignationModal.classList.add("show");
        document.body.style.overflow = "hidden";

        calculateLastWorkingDay();
    }


    function closeResignationModal() {
        resignationModal.classList.remove("show");
        document.body.style.overflow = "";
    }


    if (openResignationBtn) {
        openResignationBtn.addEventListener("click", openResignationModal);
    }


    if (editResignationBtn) {
        editResignationBtn.addEventListener("click", openResignationModal);
    }


    if (closeResignationBtn) {
        closeResignationBtn.addEventListener("click", closeResignationModal);
    }


    if (cancelResignationBtn) {
        cancelResignationBtn.addEventListener("click", closeResignationModal);
    }


    resignationModal.addEventListener("click", function (event) {

        if (event.target === resignationModal) {
            closeResignationModal();
        }

    });


    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" &&
            resignationModal.classList.contains("show")) {

            closeResignationModal();

        }

    });


    /* =========================================
       CALCULATE LAST WORKING DAY
       ========================================= */

    function calculateLastWorkingDay() {

        if (!resignationDate.value || !noticePeriod.value) {
            return;
        }

        const date = new Date(resignationDate.value + "T00:00:00");

        const days = parseInt(noticePeriod.value, 10);

        date.setDate(date.getDate() + days - 1);

        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        calculatedLastDay.textContent = formattedDate;
    }


    if (resignationDate) {
        resignationDate.addEventListener(
            "change",
            calculateLastWorkingDay
        );
    }


    if (noticePeriod) {
        noticePeriod.addEventListener(
            "change",
            calculateLastWorkingDay
        );
    }


    /* =========================================
       SUBMIT RESIGNATION
       ========================================= */

    if (submitResignationBtn) {

        submitResignationBtn.addEventListener("click", function () {

            if (!resignationConfirmation.checked) {

                showToast(
                    "Please confirm that you understand the resignation process."
                );

                return;
            }


            submitResignationBtn.disabled = true;

            submitResignationBtn.innerHTML =
                '<i class="bi bi-hourglass-split"></i> Submitting...';


            setTimeout(function () {

                closeResignationModal();

                submitResignationBtn.disabled = false;

                submitResignationBtn.innerHTML =
                    '<i class="bi bi-send"></i> Submit Resignation';


                showToast(
                    "Your resignation has been submitted successfully."
                );


            }, 800);

        });

    }


    /* =========================================
       CHECKLIST ACTIONS
       ========================================= */

    const actionLinks = page.querySelectorAll(".exit-action-link");

    actionLinks.forEach(function (button) {

        button.addEventListener("click", function () {

            const action = button.textContent.trim();

            showToast(action + " section opened.");

        });

    });


    /* =========================================
       DOCUMENT ACTIONS
       ========================================= */

    const documentButtons =
        page.querySelectorAll(".exit-document-action:not(.disabled)");

    documentButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            showToast("Document download started.");

        });

    });


    /* =========================================
       EXIT INTERVIEW
       ========================================= */

    const exitInterviewBtn =
        page.querySelector("#exitInterviewBtn");

    if (exitInterviewBtn) {

        exitInterviewBtn.addEventListener("click", function () {

            showToast(
                "Exit interview scheduling will be available shortly."
            );

        });

    }


    /* =========================================
       CONTACT HR
       ========================================= */

    const contactHRBtn =
        page.querySelector(".exit-contact-btn");

    if (contactHRBtn) {

        contactHRBtn.addEventListener("click", function () {

            showToast("HR contact request initiated.");

        });

    }


    /* =========================================
       VIEW ALL CHECKLIST
       ========================================= */

    const viewAllChecklist =
        page.querySelector("#viewAllChecklist");

    if (viewAllChecklist) {

        viewAllChecklist.addEventListener("click", function () {

            showToast("Showing all exit checklist activities.");

        });

    }


    /* =========================================
       TOAST
       ========================================= */

    let toastTimer;


    function showToast(message) {

        clearTimeout(toastTimer);

        exitToastMessage.textContent = message;

        exitToast.classList.add("show");

        toastTimer = setTimeout(function () {

            exitToast.classList.remove("show");

        }, 3500);
    }


    if (closeExitToast) {

        closeExitToast.addEventListener("click", function () {

            exitToast.classList.remove("show");

        });

    }


    /* =========================================
       INITIAL CALCULATION
       ========================================= */

    calculateLastWorkingDay();

});