/* =========================================================
        EMPLOYMENT DETAILS
        Page-specific JavaScript only
        ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const employeeId = document.getElementById("employmentEmployeeId");
    const employeeType = document.getElementById("employeeType");
    const employeeStatus = document.getElementById("employeeStatus");

    const joiningDate = document.getElementById("joiningDate");
    const probationPeriod = document.getElementById("probationPeriod");
    const probationEndDate = document.getElementById("probationEndDate");
    const confirmationDate = document.getElementById("confirmationDate");

    const department = document.getElementById("department");
    const designation = document.getElementById("designation");
    const location = document.getElementById("location");
    const reportingManager = document.getElementById("reportingManager");

    const employmentShift = document.getElementById("employeeShift");

    const summaryEmployeeId =
        document.getElementById("summaryEmployeeId");

    const summaryStatus =
        document.getElementById("summaryStatus");

    const summaryDepartment =
        document.getElementById("summaryDepartment");

    const summaryDesignation =
        document.getElementById("summaryDesignation");

    const summaryManager =
        document.getElementById("summaryManager");

    const summaryLocation =
        document.getElementById("summaryLocation");

    const summaryWorkMode =
        document.getElementById("summaryWorkMode");

    const summaryJoiningDate =
        document.getElementById("summaryJoiningDate");

    const employmentStatusBadge =
        document.getElementById("employmentStatusBadge");

    const employmentProgressBar =
        document.getElementById("employmentProgressBar");

    const employmentCompletionPercent =
        document.getElementById("employmentCompletionPercent");

    const employmentCompletionText =
        document.getElementById("employmentCompletionText");

    const employmentSaveState =
        document.getElementById("employmentSaveState");


    /* =====================================================
    DATE HELPERS
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "Not assigned";
        }

        const date = new Date(dateString + "T00:00:00");

        if (isNaN(date.getTime())) {
            return "Not assigned";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function calculateProbationEndDate() {

        if (!joiningDate.value || !probationPeriod.value) {
            return;
        }

        const months = parseInt(probationPeriod.value, 10);

        if (isNaN(months) || months < 0) {
            return;
        }

        const date = new Date(joiningDate.value + "T00:00:00");

        if (isNaN(date.getTime())) {
            return;
        }

        date.setMonth(date.getMonth() + months);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        probationEndDate.value = `${year}-${month}-${day}`;

        updateCompletion();
    }


    joiningDate.addEventListener("change", calculateProbationEndDate);
    probationPeriod.addEventListener("input", calculateProbationEndDate);


    /* =====================================================
    WORK MODE
    ===================================================== */

    function updateWorkModeSummary() {

        const selectedMode =
            document.querySelector(
                'input[name="work_mode"]:checked'
            );

        summaryWorkMode.textContent =
            selectedMode
                ? selectedMode.value
                : "Not selected";

        updateCompletion();
    }


    document
        .querySelectorAll('input[name="work_mode"]')
        .forEach(function (radio) {

            radio.addEventListener("change", updateWorkModeSummary);

        });


    /* =====================================================
    STATUS
    ===================================================== */

    employeeStatus.addEventListener("change", function () {

        const status = this.value || "Not selected";

        summaryStatus.textContent = status;
        employmentStatusBadge.textContent = status;

        updateCompletion();

    });


    /* =====================================================
    LIVE SUMMARY
    ===================================================== */

    employeeId.addEventListener("input", function () {

        summaryEmployeeId.textContent =
            this.value.trim() || "Not assigned";

    });


    department.addEventListener("change", function () {

        summaryDepartment.textContent =
            this.value || "Not assigned";

        updateCompletion();

    });


    designation.addEventListener("change", function () {

        summaryDesignation.textContent =
            this.value || "Not assigned";

        updateCompletion();

    });


    reportingManager.addEventListener("change", function () {

        summaryManager.textContent =
            this.value || "Not assigned";

        updateCompletion();

    });


    location.addEventListener("input", function () {

        summaryLocation.textContent =
            this.value.trim() || "Not assigned";

        updateCompletion();

    });


    joiningDate.addEventListener("change", function () {

        summaryJoiningDate.textContent =
            formatDate(this.value);

        updateCompletion();

    });


    employeeType.addEventListener("change", updateCompletion);

    employmentShift.addEventListener("change", updateCompletion);

    confirmationDate.addEventListener("change", updateCompletion);

    probationEndDate.addEventListener("change", updateCompletion);


    /* =====================================================
    PROFILE COMPLETION
    ===================================================== */

    function updateCompletion() {

        const fields = [
            employeeId,
            employeeType,
            employeeStatus,
            joiningDate,
            department,
            designation,
            location,
            reportingManager,
            employmentShift
        ];

        const completed = fields.filter(function (field) {

            return field && field.value.trim() !== "";

        }).length;


        const workModeSelected =
            document.querySelector(
                'input[name="work_mode"]:checked'
            );

        let totalFields = fields.length + 1;

        let completedFields = completed;

        if (workModeSelected) {
            completedFields++;
        }


        const percentage = Math.round(
            (completedFields / totalFields) * 100
        );


        employmentProgressBar.style.width =
            `${percentage}%`;

        employmentCompletionPercent.textContent =
            `${percentage}%`;


        if (percentage === 100) {

            employmentCompletionText.textContent =
                "Employment information is complete.";

        } else if (percentage >= 70) {

            employmentCompletionText.textContent =
                "Almost there. Complete the remaining employment details.";

        } else if (percentage >= 40) {

            employmentCompletionText.textContent =
                "Good progress. Continue completing the employee setup.";

        } else {

            employmentCompletionText.textContent =
                "Complete the employment information to finish this section.";

        }

    }


    /* =====================================================
    SAVE STATE
    ===================================================== */

    function showSaveState(message) {

        employmentSaveState.innerHTML = `
                    <i class="bi bi-check-circle"></i>
                    <span>${message}</span>
                `;

        setTimeout(function () {

            employmentSaveState.innerHTML = `
                        <i class="bi bi-cloud-check"></i>
                        <span>Changes are saved automatically</span>
                    `;

        }, 2500);

    }


    /* =====================================================
    COLLECT FORM DATA
    ===================================================== */

    function collectEmploymentData() {

        const selectedWorkMode =
            document.querySelector(
                'input[name="work_mode"]:checked'
            );

        return {

            employee_id: employeeId.value,
            employee_type: employeeType.value,
            employment_status: employeeStatus.value,

            joining_date: joiningDate.value,
            probation_period: probationPeriod.value,
            probation_end_date: probationEndDate.value,
            confirmation_date: confirmationDate.value,

            department: department.value,
            team: document.getElementById("team").value,
            designation: designation.value,
            location: location.value,

            work_mode: selectedWorkMode
                ? selectedWorkMode.value
                : "",

            reporting_manager: reportingManager.value,
            hr_manager:
                document.getElementById("hrManager").value,

            shift: employmentShift.value

        };

    }


    /* =====================================================
    SAVE
    ===================================================== */

    function saveEmploymentDetails() {

        const data = collectEmploymentData();

        /*
        * UI demo storage.
        *
        * Later, replace this section with your
        * Laravel AJAX/fetch request.
        */

        localStorage.setItem(
            "ramel_hr_employment_details",
            JSON.stringify(data)
        );

        showSaveState("Employment details saved successfully.");

    }


    document
        .getElementById("employmentSaveBtn")
        .addEventListener("click", saveEmploymentDetails);


    document
        .getElementById("employmentSaveTop")
        .addEventListener("click", saveEmploymentDetails);


    /* =====================================================
    LOAD SAVED DATA
    ===================================================== */

    function loadSavedEmploymentData() {

        const saved =
            localStorage.getItem(
                "ramel_hr_employment_details"
            );

        if (!saved) {
            updateCompletion();
            return;
        }

        try {

            const data = JSON.parse(saved);

            if (data.employee_id !== undefined)
                employeeId.value = data.employee_id;

            if (data.employee_type !== undefined)
                employeeType.value = data.employee_type;

            if (data.employment_status !== undefined)
                employeeStatus.value = data.employment_status;

            if (data.joining_date !== undefined)
                joiningDate.value = data.joining_date;

            if (data.probation_period !== undefined)
                probationPeriod.value = data.probation_period;

            if (data.probation_end_date !== undefined)
                probationEndDate.value = data.probation_end_date;

            if (data.confirmation_date !== undefined)
                confirmationDate.value = data.confirmation_date;

            if (data.department !== undefined)
                department.value = data.department;

            if (data.team !== undefined)
                document.getElementById("team").value =
                    data.team;

            if (data.designation !== undefined)
                designation.value = data.designation;

            if (data.location !== undefined)
                location.value = data.location;

            if (data.reporting_manager !== undefined)
                reportingManager.value =
                    data.reporting_manager;

            if (data.hr_manager !== undefined)
                document.getElementById("hrManager").value =
                    data.hr_manager;

            if (data.shift !== undefined)
                employmentShift.value = data.shift;


            if (data.work_mode) {

                const workMode =
                    document.querySelector(
                        `input[name="work_mode"][value="${data.work_mode}"]`
                    );

                if (workMode) {
                    workMode.checked = true;
                }

            }


            /*
            * Refresh visible summary.
            */

            summaryEmployeeId.textContent =
                employeeId.value || "Not assigned";

            summaryStatus.textContent =
                employeeStatus.value || "Not selected";

            employmentStatusBadge.textContent =
                employeeStatus.value || "Not selected";

            summaryDepartment.textContent =
                department.value || "Not assigned";

            summaryDesignation.textContent =
                designation.value || "Not assigned";

            summaryManager.textContent =
                reportingManager.value || "Not assigned";

            summaryLocation.textContent =
                location.value || "Not assigned";

            summaryJoiningDate.textContent =
                formatDate(joiningDate.value);


            const selectedWorkMode =
                document.querySelector(
                    'input[name="work_mode"]:checked'
                );

            summaryWorkMode.textContent =
                selectedWorkMode
                    ? selectedWorkMode.value
                    : "Not selected";


            updateCompletion();

        } catch (error) {

            console.error(
                "Unable to load saved employment details:",
                error
            );

        }

    }


    /* =====================================================
    RESET
    ===================================================== */

    function resetEmploymentDetails() {

        const confirmed = confirm(
            "Are you sure you want to reset the employment details?"
        );

        if (!confirmed) {
            return;
        }


        document
            .querySelectorAll(
                ".employment-main-card input, .employment-main-card select"
            )
            .forEach(function (field) {

                if (field.type === "radio") {
                    field.checked = false;
                } else {
                    field.value = "";
                }

            });


        localStorage.removeItem(
            "ramel_hr_employment_details"
        );


        /*
        * Restore employee ID because it is part
        * of the employee's existing profile.
        */

        employeeId.value = "EMP-000124";

        summaryEmployeeId.textContent = "EMP-000124";
        summaryStatus.textContent = "Not selected";
        employmentStatusBadge.textContent = "Not selected";
        summaryDepartment.textContent = "Not assigned";
        summaryDesignation.textContent = "Not assigned";
        summaryManager.textContent = "Not assigned";
        summaryLocation.textContent = "Not assigned";
        summaryWorkMode.textContent = "Not selected";
        summaryJoiningDate.textContent = "Not assigned";

        updateCompletion();

        showSaveState("Employment details have been reset.");

    }


    document
        .getElementById("employmentResetBtn")
        .addEventListener("click", resetEmploymentDetails);


    /* =====================================================
    CANCEL
    ===================================================== */

    document
        .getElementById("employmentCancelBtn")
        .addEventListener("click", function () {

            const confirmed = confirm(
                "Discard the current changes?"
            );

            if (confirmed) {

                window.history.back();

            }

        });


    /* =====================================================
    INITIALIZE
    ===================================================== */

    loadSavedEmploymentData();

});