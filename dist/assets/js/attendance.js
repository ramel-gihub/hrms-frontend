document.addEventListener("DOMContentLoaded", function () {

    /* -------------------------------------------------------
    ATTENDANCE CHART
    ------------------------------------------------------- */

    const attendanceChartElement = document.querySelector("#epaAttendanceChart");

    if (attendanceChartElement && typeof ApexCharts !== "undefined") {

        const attendanceChartOptions = {
            series: [
                {
                    name: "Working Hours",
                    data: [
                        9.08,
                        8.83,
                        0,
                        9.17,
                        9.17,
                        8.75,
                        9.00,
                        8.92,
                        9.08,
                        8.67,
                        9.17,
                        8.83,
                        9.00,
                        8.92,
                        0,
                        9.08,
                        8.75,
                        9.17,
                        8.92,
                        9.08,
                        8.83,
                        9.00
                    ]
                },
                {
                    name: "Overtime",
                    data: [
                        0.08,
                        0,
                        0,
                        0.17,
                        0.17,
                        0,
                        0,
                        0,
                        0.08,
                        0,
                        0.17,
                        0,
                        0,
                        0,
                        0,
                        0.08,
                        0,
                        0.17,
                        0,
                        0.08,
                        0,
                        0
                    ]
                }
            ],

            chart: {
                type: "area",
                height: 290,
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                },
                fontFamily: "Segoe UI, sans-serif"
            },

            stroke: {
                curve: "smooth",
                width: 3
            },

            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.25,
                    opacityTo: 0.02,
                    stops: [0, 90, 100]
                }
            },

            dataLabels: {
                enabled: false
            },

            xaxis: {
                categories: [
                    "01", "02", "03", "04", "05", "06",
                    "07", "08", "09", "10", "11", "12",
                    "13", "14", "15", "16", "17", "18",
                    "19", "20", "21", "22"
                ],
                labels: {
                    style: {
                        colors: "#85889b"
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },

            yaxis: {
                min: 0,
                max: 10,
                tickAmount: 5,
                labels: {
                    formatter: function (value) {
                        return value.toFixed(0) + "h";
                    },
                    style: {
                        colors: "#85889b"
                    }
                }
            },

            grid: {
                borderColor: "#ebecf3",
                strokeDashArray: 4
            },

            legend: {
                show: false
            },

            tooltip: {
                y: {
                    formatter: function (value) {

                        if (value === 0) {
                            return "No attendance";
                        }

                        const hours = Math.floor(value);
                        const minutes = Math.round((value - hours) * 60);

                        return hours + "h " + minutes + "m";
                    }
                }
            },

            colors: ["#3c2fbc", "#f59a42"]
        };

        const attendanceChart = new ApexCharts(
            attendanceChartElement,
            attendanceChartOptions
        );

        attendanceChart.render();
    }


    /* -------------------------------------------------------
    ATTENDANCE DONUT
    ------------------------------------------------------- */

    const attendanceDonutElement = document.querySelector("#epaAttendanceDonut");

    if (attendanceDonutElement && typeof ApexCharts !== "undefined") {

        const attendanceDonutOptions = {
            series: [19, 2, 1],

            chart: {
                type: "donut",
                height: 220,
                fontFamily: "Segoe UI, sans-serif"
            },

            labels: [
                "Present",
                "Leave",
                "Absent"
            ],

            colors: [
                "#22b981",
                "#f59a42",
                "#e75b5b"
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
                        size: "76%"
                    }
                }
            },

            tooltip: {
                y: {
                    formatter: function (value) {
                        return value + " Days";
                    }
                }
            }
        };

        const attendanceDonut = new ApexCharts(
            attendanceDonutElement,
            attendanceDonutOptions
        );

        attendanceDonut.render();
    }


    /* -------------------------------------------------------
    SEARCH + STATUS FILTER
    ------------------------------------------------------- */

    const searchInput = document.querySelector("#epaAttendanceSearch");
    const statusFilter = document.querySelector("#epaStatusFilter");
    const attendanceRows = document.querySelectorAll(
        "#epaAttendanceTableBody tr"
    );

    function filterAttendance() {

        const searchValue = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "all";

        attendanceRows.forEach(function (row) {

            const rowText = row.innerText.toLowerCase();
            const rowStatus = row.dataset.status;

            const matchesSearch = rowText.includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                rowStatus === selectedStatus;

            row.style.display =
                matchesSearch && matchesStatus
                    ? ""
                    : "none";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterAttendance);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", filterAttendance);
    }


    /* -------------------------------------------------------
    ATTENDANCE DETAILS
    ------------------------------------------------------- */

    const viewButtons = document.querySelectorAll(
        ".epa-view-attendance"
    );

    viewButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const data = this.dataset;

            document.querySelector("#epaSelectedDate").textContent =
                data.date + "-2026";

            document.querySelector("#epaDetailDate").textContent =
                data.date + "-2026";

            document.querySelector("#epaDetailShift").textContent =
                data.shift;

            document.querySelector("#epaDetailCheckIn").textContent =
                data.checkin;

            document.querySelector("#epaDetailCheckOut").textContent =
                data.checkout;

            document.querySelector("#epaDetailBreak").textContent =
                data.break;

            document.querySelector("#epaDetailHours").textContent =
                data.hours;

            document.querySelector("#epaDetailOvertime").textContent =
                data.overtime;

            const statusElement =
                document.querySelector("#epaDetailStatus");

            statusElement.textContent = data.status;

            statusElement.className =
                "epa-detail-status " +
                data.status.toLowerCase();

            document.querySelector("#epaDetailRemarks").textContent =
                data.remarks;


            const detailsCard =
                document.querySelector(".epa-details-card");

            if (detailsCard) {

                detailsCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        });

    });


    /* -------------------------------------------------------
    MONTH FILTER
    ------------------------------------------------------- */

    const monthFilter =
        document.querySelector("#epaMonthFilter");

    if (monthFilter) {

        monthFilter.addEventListener("change", function () {

            /*
            * Later Laravel integration:
            * Load attendance records for:
            * employee_id + selected month
            */

            console.log(
                "Attendance month changed:",
                this.value
            );

        });

    }


    /* -------------------------------------------------------
    EXPORT
    ------------------------------------------------------- */

    const exportButton =
        document.querySelector("#epaExportBtn");

    if (exportButton) {

        exportButton.addEventListener("click", function () {

            /*
            * Later Laravel integration:
            * Generate attendance Excel/PDF.
            */

            alert(
                "Attendance export will be connected to Laravel backend."
            );

        });

    }


    /* -------------------------------------------------------
    PAGINATION DEMO
    ------------------------------------------------------- */

    const paginationButtons =
        document.querySelectorAll(".epa-page-btn:not(.disabled)");

    paginationButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            if (
                this.classList.contains("active") ||
                this.querySelector("i")
            ) {
                return;
            }

            document
                .querySelectorAll(".epa-page-btn")
                .forEach(function (item) {
                    item.classList.remove("active");
                });

            this.classList.add("active");

        });

    });

});