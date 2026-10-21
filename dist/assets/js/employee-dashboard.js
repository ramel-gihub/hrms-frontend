
document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
    CURRENT TIME
    ===================================================== */

    function updateCurrentTime() {

        const timeElement = document.getElementById("edCurrentTime");

        if (!timeElement) {
            return;
        }

        const now = new Date();

        let hours = now.getHours();
        let minutes = now.getMinutes();

        const period = hours >= 12 ? "PM" : "AM";

        hours = hours % 12 || 12;

        minutes = minutes.toString().padStart(2, "0");

        timeElement.textContent =
            `${hours.toString().padStart(2, "0")}:${minutes}`;

        const parent = timeElement.parentElement;

        if (parent) {

            const small = parent.querySelector("small");

            if (small) {
                small.textContent = period;
            }

        }
    }

    updateCurrentTime();

    setInterval(updateCurrentTime, 30000);

    


    /* =====================================================
    ATTENDANCE CHART
    ===================================================== */

    const chartElement = document.querySelector("#employeeAttendanceChart");

    if (chartElement && typeof ApexCharts !== "undefined") {

        const attendanceOptions = {

            chart: {
                type: "area",
                height: 255,
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },

            series: [
                {
                    name: "Working Hours",
                    data: [8.4, 8.7, 7.9, 8.8, 8.6, 0, 0]
                }
            ],

            xaxis: {
                categories: [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun"
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
                        return value + "h";
                    },
                    style: {
                        colors: "#85889b"
                    }
                }
            },

            stroke: {
                curve: "smooth",
                width: 3
            },

            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.28,
                    opacityTo: 0.03,
                    stops: [0, 100]
                }
            },

            dataLabels: {
                enabled: false
            },

            markers: {
                size: 4,
                hover: {
                    size: 6
                }
            },

            grid: {
                borderColor: "#ebecf3",
                strokeDashArray: 4,
                xaxis: {
                    lines: {
                        show: false
                    }
                }
            },

            tooltip: {
                y: {
                    formatter: function (value) {
                        return value + " hours";
                    }
                }
            }
        };

        const attendanceChart =
            new ApexCharts(chartElement, attendanceOptions);

        attendanceChart.render();
    }


    /* =====================================================
    ATTENDANCE PERIOD
    ===================================================== */

    const periodSelect =
        document.getElementById("edAttendancePeriod");

    if (periodSelect) {

        periodSelect.addEventListener("change", function () {

            edShowToast(
                "Attendance updated",
                `${this.value} attendance summary loaded.`
            );

        });

    }

});


/* =========================================================
CHECK IN
========================================================= */

let edCheckedIn = true;
let edCheckedOut = false;

function edCheckIn() {

    if (edCheckedIn) {

        edShowToast(
            "Already checked in",
            "Your attendance is already active for today."
        );

        return;
    }

    edCheckedIn = true;
    edCheckedOut = false;

    const button = document.getElementById("edCheckInBtn");
    const title = document.getElementById("edAttendanceTitle");
    const checkInTime = document.getElementById("edCheckInTime");

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (button) {
        button.innerHTML =
            '<i class="bi bi-check-circle"></i> Checked In';

        button.disabled = true;
    }

    if (title) {
        title.textContent = "You're checked in";
    }

    if (checkInTime) {
        checkInTime.textContent = time;
    }

    edShowToast(
        "Check-in successful",
        `You checked in at ${time}.`
    );
}


/* =========================================================
CHECK OUT
========================================================= */

function edCheckOut() {

    if (!edCheckedIn) {

        edShowToast(
            "Check-in required",
            "Please check in before checking out."
        );

        return;
    }

    if (edCheckedOut) {

        edShowToast(
            "Already checked out",
            "Today's attendance has already been completed."
        );

        return;
    }

    edCheckedOut = true;

    const title = document.getElementById("edAttendanceTitle");
    const checkOutTime = document.getElementById("edCheckOutTime");
    const checkOutButton = document.getElementById("edCheckOutBtn");

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (title) {
        title.textContent = "Workday completed";
    }

    if (checkOutTime) {
        checkOutTime.textContent = time;
    }

    if (checkOutButton) {
        checkOutButton.innerHTML =
            '<i class="bi bi-check-circle"></i> Checked Out';

        checkOutButton.disabled = true;
    }

    edShowToast(
        "Check-out successful",
        `You checked out at ${time}.`
    );
}


/* =========================================================
NAVIGATION ACTIONS
========================================================= */

function edOpenProfile() {
    window.location.href = "employee-profile.html";
}

function edOpenAttendance() {
    window.location.href = "attendance.html";
}

function edApplyLeave() {
    window.location.href = "leaves.html";
}

function edOpenDocuments() {
    window.location.href = "documents.html";
}

function edOpenAssets() {
    window.location.href = "assets.html";
}

function edCreateRequest() {
    window.location.href = "employee-requests.html";
}

function edViewRequests() {
    window.location.href = "employee-requests.html";
}

function edOpenTeam() {
    edShowToast(
        "Team workspace",
        "Team directory will open here."
    );
}

function edOpenHolidays() {
    edShowToast(
        "Holiday calendar",
        "Company holiday calendar will open here."
    );
}

function edOpenAnnouncement() {
    edShowToast(
        "HR Announcement",
        "The complete announcement will open here."
    );
}


/* =========================================================
SEND WISH
========================================================= */

function edSendWish(employeeName) {

    edShowToast(
        "Wish ready",
        `You can send birthday wishes to ${employeeName}.`
    );
}


/* =========================================================
LEAVE POLICY
========================================================= */

function edOpenLeavePolicy() {

    const modalElement =
        document.getElementById("edLeavePolicyModal");

    if (!modalElement) {
        return;
    }

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


/* =========================================================
NOTIFICATIONS
========================================================= */

function edOpenNotifications() {

    edShowToast(
        "Notifications",
        "Opening your notification center."
    );
}


/* =========================================================
TOAST
========================================================= */

let edToastTimer;

function edShowToast(title, message) {

    const toast = document.getElementById("edToast");
    const toastTitle = document.getElementById("edToastTitle");
    const toastMessage = document.getElementById("edToastMessage");

    if (!toast) {
        return;
    }

    if (toastTitle) {
        toastTitle.textContent = title;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    toast.classList.add("show");

    clearTimeout(edToastTimer);

    edToastTimer = setTimeout(function () {
        edHideToast();
    }, 3500);
}


function edHideToast() {

    const toast = document.getElementById("edToast");

    if (toast) {
        toast.classList.remove("show");
    }
}