/* =========================================================
        EMPLOYEE PROFILE - LEAVE
        ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* -------------------------------------------------------
    LEAVE UTILIZATION CHART
    ------------------------------------------------------- */

    const leaveChartElement =
        document.querySelector("#eplLeaveChart");

    if (
        leaveChartElement &&
        typeof ApexCharts !== "undefined"
    ) {

        const leaveChartOptions = {

            series: [12, 4, 3],

            chart: {
                type: "donut",
                height: 250,
                fontFamily: "Segoe UI, sans-serif"
            },

            labels: [
                "Annual Leave",
                "Sick Leave",
                "Casual Leave"
            ],

            colors: [
                "#3c2fbc",
                "#e75b5b",
                "#f59a42"
            ],

            stroke: {
                width: 5,
                colors: ["#ffffff"]
            },

            dataLabels: {
                enabled: false
            },

            legend: {
                show: false
            },

            plotOptions: {
                pie: {
                    donut: {
                        size: "72%",
                        labels: {
                            show: true,

                            name: {
                                show: true,
                                color: "#85889b"
                            },

                            value: {
                                show: true,
                                color: "#24263d",
                                fontSize: "22px",
                                fontWeight: 700
                            },

                            total: {
                                show: true,
                                label: "Days Used",
                                color: "#85889b",
                                formatter: function () {
                                    return "19";
                                }
                            }
                        }
                    }
                }
            },

            tooltip: {
                y: {
                    formatter: function (value) {
                        return value + " Days Used";
                    }
                }
            }

        };

        const leaveChart =
            new ApexCharts(
                leaveChartElement,
                leaveChartOptions
            );

        leaveChart.render();

    }


    /* -------------------------------------------------------
    SEARCH + FILTER
    ------------------------------------------------------- */

    const searchInput =
        document.querySelector("#eplLeaveSearch");

    const statusFilter =
        document.querySelector("#eplStatusFilter");

    const typeFilter =
        document.querySelector("#eplTypeFilter");

    const leaveRows =
        document.querySelectorAll(
            "#eplLeaveTableBody tr"
        );


    function filterLeaveRecords() {

        const searchValue =
            searchInput
                ? searchInput.value.toLowerCase().trim()
                : "";

        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "all";

        const selectedType =
            typeFilter
                ? typeFilter.value
                : "all";


        leaveRows.forEach(function (row) {

            const rowText =
                row.innerText.toLowerCase();

            const rowStatus =
                row.dataset.status;

            const rowType =
                row.dataset.type;


            const matchesSearch =
                rowText.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                rowStatus === selectedStatus;

            const matchesType =
                selectedType === "all" ||
                rowType === selectedType;


            row.style.display =
                matchesSearch &&
                    matchesStatus &&
                    matchesType
                    ? ""
                    : "none";

        });

    }


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterLeaveRecords
        );
    }


    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterLeaveRecords
        );
    }


    if (typeFilter) {
        typeFilter.addEventListener(
            "change",
            filterLeaveRecords
        );
    }


    /* -------------------------------------------------------
    VIEW LEAVE DETAILS
    ------------------------------------------------------- */

    const viewButtons =
        document.querySelectorAll(
            ".epl-view-leave"
        );


    viewButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const data = this.dataset;


                document.querySelector(
                    "#eplDetailType"
                ).textContent = data.type;


                document.querySelector(
                    "#eplDetailFrom"
                ).textContent = data.from;


                document.querySelector(
                    "#eplDetailTo"
                ).textContent = data.to;


                document.querySelector(
                    "#eplDetailDays"
                ).textContent = data.days;


                document.querySelector(
                    "#eplDetailReason"
                ).textContent = data.reason;


                document.querySelector(
                    "#eplDetailDocument"
                ).textContent = data.document;


                document.querySelector(
                    "#eplDetailApprover"
                ).textContent = data.approver;


                document.querySelector(
                    "#eplDetailApplied"
                ).textContent = data.applied;


                document.querySelector(
                    "#eplDetailApproved"
                ).textContent = data.approved;


                document.querySelector(
                    "#eplDetailComments"
                ).textContent = data.comments;


                const selectedStatus =
                    document.querySelector(
                        "#eplSelectedStatus"
                    );


                selectedStatus.textContent =
                    data.status;


                selectedStatus.className =
                    "epl-selected-status " +
                    data.status.toLowerCase();


                const detailsCard =
                    document.querySelector(
                        ".epl-details-card"
                    );


                if (detailsCard) {

                    detailsCard.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }
        );

    });


    /* -------------------------------------------------------
    APPLY LEAVE MODAL
    ------------------------------------------------------- */

    const applyLeaveButton =
        document.querySelector(
            "#eplApplyLeaveBtn"
        );


    const applyLeaveModalElement =
        document.querySelector(
            "#eplApplyLeaveModal"
        );


    let applyLeaveModal = null;


    if (
        applyLeaveModalElement &&
        typeof bootstrap !== "undefined"
    ) {

        applyLeaveModal =
            new bootstrap.Modal(
                applyLeaveModalElement
            );

    }


    if (applyLeaveButton) {

        applyLeaveButton.addEventListener(
            "click",
            function () {

                if (applyLeaveModal) {
                    applyLeaveModal.show();
                }

            }
        );

    }


    /* -------------------------------------------------------
    CALCULATE LEAVE DAYS
    ------------------------------------------------------- */

    const fromDate =
        document.querySelector("#eplApplyFrom");

    const toDate =
        document.querySelector("#eplApplyTo");

    const daysField =
        document.querySelector("#eplApplyDays");


    function calculateLeaveDays() {

        if (
            !fromDate ||
            !toDate ||
            !daysField ||
            !fromDate.value ||
            !toDate.value
        ) {
            return;
        }


        const start =
            new Date(fromDate.value);

        const end =
            new Date(toDate.value);


        if (end < start) {

            daysField.value =
                "Invalid date range";

            return;

        }


        const difference =
            end.getTime() -
            start.getTime();


        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            ) + 1;


        daysField.value =
            days +
            (days === 1
                ? " Day"
                : " Days");

    }


    if (fromDate) {
        fromDate.addEventListener(
            "change",
            calculateLeaveDays
        );
    }


    if (toDate) {
        toDate.addEventListener(
            "change",
            calculateLeaveDays
        );
    }


    /* -------------------------------------------------------
    SUBMIT LEAVE
    ------------------------------------------------------- */

    const submitLeaveButton =
        document.querySelector(
            "#eplSubmitLeave"
        );


    if (submitLeaveButton) {

        submitLeaveButton.addEventListener(
            "click",
            function () {

                const leaveType =
                    document.querySelector(
                        "#eplApplyType"
                    ).value;

                const days =
                    document.querySelector(
                        "#eplApplyDays"
                    ).value;


                if (!leaveType) {

                    alert(
                        "Please select a leave type."
                    );

                    return;

                }


                if (!fromDate.value || !toDate.value) {

                    alert(
                        "Please select the leave dates."
                    );

                    return;

                }


                if (
                    days === "Invalid date range"
                ) {

                    alert(
                        "Please select a valid date range."
                    );

                    return;

                }


                alert(
                    "Leave request submitted successfully."
                );


                if (applyLeaveModal) {
                    applyLeaveModal.hide();
                }

            }
        );

    }


    /* -------------------------------------------------------
    LEAVE YEAR
    ------------------------------------------------------- */

    const yearFilter =
        document.querySelector(
            "#eplYearFilter"
        );


    if (yearFilter) {

        yearFilter.addEventListener(
            "change",
            function () {

                /*
                * Laravel integration:
                *
                * employee_id = EMP-000124
                * leave_year = this.value
                *
                * Fetch:
                * - leave balances
                * - leave history
                * - upcoming leaves
                * - utilization
                */

                console.log(
                    "Leave year:",
                    this.value
                );

            }
        );

    }


    /* -------------------------------------------------------
    EXPORT
    ------------------------------------------------------- */

    const exportButton =
        document.querySelector(
            "#eplExportBtn"
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                /*
                * Later connect this to Laravel
                * Excel/PDF export.
                */

                alert(
                    "Leave report export will be connected to Laravel."
                );

            }
        );

    }


    /* -------------------------------------------------------
    PAGINATION DEMO
    ------------------------------------------------------- */

    const paginationButtons =
        document.querySelectorAll(
            ".epl-page-btn:not(.disabled)"
        );


    paginationButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (
                        this.classList.contains(
                            "active"
                        ) ||
                        this.querySelector("i")
                    ) {
                        return;
                    }


                    document
                        .querySelectorAll(
                            ".epl-page-btn"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    this.classList.add(
                        "active"
                    );

                }
            );

        }
    );

});