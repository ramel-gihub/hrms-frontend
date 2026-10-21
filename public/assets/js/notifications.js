
/* ================= EMPLOYEE NOTIFICATIONS JS ================= */

const enNotifications = [
    {
        id: 1,
        title: "Your leave request has been approved",
        description: "Your annual leave request for 28–30 September has been approved by Priya Sharma. Enjoy your time off!",
        category: "Leave",
        icon: "bi-calendar2-check",
        color: "#5144cc",
        bg: "#eeecff",
        time: "10:32 AM",
        date: "2026-09-25",
        dateLabel: "Today",
        unread: true,
        important: true,
        archived: false,
        actionLabel: "View Leave",
        actionUrl: "leaves.html"
    },
    {
        id: 2,
        title: "Attendance check-in reminder",
        description: "You haven't checked in for today's shift yet. Please record your attendance before starting work.",
        category: "Attendance",
        icon: "bi-clock-history",
        color: "#4385f5",
        bg: "#eaf2ff",
        time: "09:05 AM",
        date: "2026-09-25",
        dateLabel: "Today",
        unread: true,
        important: true,
        archived: false,
        actionLabel: "Open Attendance",
        actionUrl: "attendance.html"
    },
    {
        id: 3,
        title: "Quarterly Town Hall Meeting",
        description: "Join the company-wide quarterly town hall on 30 September at 3:00 PM. The meeting link and agenda are available in the announcement.",
        category: "HR Announcement",
        icon: "bi-megaphone",
        color: "#e99432",
        bg: "#fff2e4",
        time: "Yesterday",
        date: "2026-09-24",
        dateLabel: "Yesterday",
        unread: true,
        important: true,
        archived: false,
        actionLabel: "View Announcement",
        actionUrl: "index.html"
    },
    {
        id: 4,
        title: "Document verification completed",
        description: "Your graduation certificate has been verified successfully by the HR team.",
        category: "Documents",
        icon: "bi-file-earmark-check",
        color: "#22a976",
        bg: "#e5f8ef",
        time: "Yesterday",
        date: "2026-09-24",
        dateLabel: "Yesterday",
        unread: true,
        important: false,
        archived: false,
        actionLabel: "View Documents",
        actionUrl: "documents.html"
    },
    {
        id: 5,
        title: "Attendance correction request updated",
        description: "Your attendance correction request for 18 September is now under review by HR Operations.",
        category: "Requests",
        icon: "bi-clipboard-check",
        color: "#e8679d",
        bg: "#fff0f6",
        time: "Yesterday",
        date: "2026-09-24",
        dateLabel: "Yesterday",
        unread: true,
        important: false,
        archived: false,
        actionLabel: "View Request",
        actionUrl: "employee-requests.html"
    },
    {
        id: 6,
        title: "New laptop assigned to you",
        description: "A Dell Latitude laptop has been assigned to your employee account. Please review the asset details.",
        category: "Assets",
        icon: "bi-laptop",
        color: "#6d70a4",
        bg: "#eff0fa",
        time: "24 Sep, 02:15 PM",
        date: "2026-09-24",
        dateLabel: "Yesterday",
        unread: true,
        important: false,
        archived: false,
        actionLabel: "View Assets",
        actionUrl: "assets.html"
    },
    {
        id: 7,
        title: "GitHub access has been granted",
        description: "Your GitHub account access has been activated with the Developer permission level.",
        category: "IT Access",
        icon: "bi-shield-lock",
        color: "#22a9ba",
        bg: "#e7f8fa",
        time: "23 Sep, 04:20 PM",
        date: "2026-09-23",
        dateLabel: "Earlier",
        unread: true,
        important: false,
        archived: false,
        actionLabel: "View Access",
        actionUrl: "access-accounts.html"
    },
    {
        id: 8,
        title: "Your profile information was updated",
        description: "Your employee profile was updated successfully. Review your personal and employment information.",
        category: "Requests",
        icon: "bi-person-check",
        color: "#e8679d",
        bg: "#fff0f6",
        time: "23 Sep, 11:30 AM",
        date: "2026-09-23",
        dateLabel: "Earlier",
        unread: false,
        important: false,
        archived: false,
        actionLabel: "View Profile",
        actionUrl: "employee-profile.html"
    },
    {
        id: 9,
        title: "Upcoming holiday: Gandhi Jayanti",
        description: "The office will remain closed on 2 October for Gandhi Jayanti. Plan your work and leave accordingly.",
        category: "HR Announcement",
        icon: "bi-calendar-event",
        color: "#e99432",
        bg: "#fff2e4",
        time: "22 Sep, 10:00 AM",
        date: "2026-09-22",
        dateLabel: "Earlier",
        unread: false,
        important: false,
        archived: false,
        actionLabel: "View Holiday",
        actionUrl: "index.html"
    },
    {
        id: 10,
        title: "Your salary certificate is ready",
        description: "Your salary certificate request has been completed. You can review the request status in your employee requests.",
        category: "Requests",
        icon: "bi-file-earmark-pdf",
        color: "#e8679d",
        bg: "#fff0f6",
        time: "21 Sep, 03:45 PM",
        date: "2026-09-21",
        dateLabel: "Earlier",
        unread: false,
        important: false,
        archived: false,
        actionLabel: "View Request",
        actionUrl: "employee-requests.html"
    },
    {
        id: 11,
        title: "Meera Nair's birthday is tomorrow",
        description: "Send your teammate a birthday wish and make their day special.",
        category: "Celebrations",
        icon: "bi-gift",
        color: "#d4a12d",
        bg: "#fff8df",
        time: "21 Sep, 09:00 AM",
        date: "2026-09-21",
        dateLabel: "Earlier",
        unread: false,
        important: false,
        archived: false,
        actionLabel: "View Team",
        actionUrl: "index.html"
    },
    {
        id: 12,
        title: "Your leave balance has been updated",
        description: "Your annual leave balance has been refreshed. Open your leave page to view your current balance.",
        category: "Leave",
        icon: "bi-calendar2-week",
        color: "#5144cc",
        bg: "#eeecff",
        time: "20 Sep, 09:30 AM",
        date: "2026-09-20",
        dateLabel: "Earlier",
        unread: false,
        important: false,
        archived: false,
        actionLabel: "View Leave",
        actionUrl: "leaves.html"
    }
];

let enCurrentFilter = "all";
let enCurrentCategory = "";
let enSelectedNotification = null;
let enToastTimer = null;
let enPreferences = {};

function enEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function enGetVisibleNotifications() {
    let data = [...enNotifications];

    if (enCurrentFilter === "unread") {
        data = data.filter(item => item.unread && !item.archived);
    } else if (enCurrentFilter === "important") {
        data = data.filter(item => item.important && !item.archived);
    } else if (enCurrentFilter === "archived") {
        data = data.filter(item => item.archived);
    } else {
        data = data.filter(item => !item.archived);
    }

    if (enCurrentCategory) {
        data = data.filter(item => item.category === enCurrentCategory);
    }

    const search = document.getElementById("enSearch").value.trim().toLowerCase();

    if (search) {
        data = data.filter(item =>
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search)
        );
    }

    const dateFilter = document.getElementById("enDateFilter").value;

    if (dateFilter !== "all") {
        const today = new Date("2026-09-25T12:00:00");
        const limits = {
            today: 0,
            week: 7,
            month: 30
        };
        const limit = limits[dateFilter];

        data = data.filter(item => {
            const difference = Math.floor(
                (today - new Date(item.date + "T12:00:00")) / 86400000
            );
            return difference >= 0 && difference <= limit;
        });
    }

    const sort = document.getElementById("enSortFilter").value;

    data.sort((a, b) => {
        return sort === "oldest"
            ? a.id - b.id
            : b.id - a.id;
    });

    return data;
}

function enUpdateCounts() {
    const active = enNotifications.filter(item => !item.archived);
    const unread = active.filter(item => item.unread);
    const important = active.filter(item => item.important);
    const read = active.filter(item => !item.unread);
    const archived = enNotifications.filter(item => item.archived);

    document.getElementById("enTotalCount").textContent = active.length;
    document.getElementById("enUnreadCount").textContent = unread.length;
    document.getElementById("enImportantCount").textContent = important.length;
    document.getElementById("enReadCount").textContent = read.length;

    document.getElementById("enNavAll").textContent = active.length;
    document.getElementById("enNavUnread").textContent = unread.length;
    document.getElementById("enNavImportant").textContent = important.length;
    document.getElementById("enNavArchived").textContent = archived.length;
}

function enRender() {
    enUpdateCounts();

    const data = enGetVisibleNotifications();
    const feed = document.getElementById("enNotificationFeed");
    const empty = document.getElementById("enEmptyState");

    feed.innerHTML = "";

    const groups = {};

    data.forEach(item => {
        const group = item.dateLabel || "Earlier";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
    });

    Object.keys(groups).forEach(group => {
        const heading = document.createElement("div");
        heading.className = "en-date-heading";
        heading.innerHTML = `<span>${enEscape(group)}</span>`;
        feed.appendChild(heading);

        groups[group].forEach(item => {
            const card = document.createElement("div");
            card.className = `en-notification ${item.unread ? "unread" : ""}`;

            card.innerHTML = `
                <div class="en-notification-icon"
                     style="color:${item.color};background:${item.bg}">
                    <i class="bi ${item.icon}"></i>
                </div>

                <div class="en-notification-main">
                    <div class="en-notification-top">
                        <h6 class="en-notification-title">${enEscape(item.title)}</h6>
                        ${item.unread ? '<span class="en-unread-badge">New</span>' : ""}
                        ${item.important ? '<i class="bi bi-star-fill en-important-badge" title="Important"></i>' : ""}
                    </div>

                    <p class="en-notification-description">${enEscape(item.description)}</p>

                    <div class="en-notification-meta">
                        <span class="en-category-label">${enEscape(item.category)}</span>
                        <span><i class="bi bi-clock"></i>${enEscape(item.time)}</span>
                    </div>
                </div>

                <div class="en-notification-actions">
                    <button class="en-action-btn" title="${item.important ? "Remove important" : "Mark important"}"
                        onclick="enToggleImportant(${item.id})">
                        <i class="bi ${item.important ? "bi-star-fill" : "bi-star"}"
                           style="${item.important ? "color:#e9a22f" : ""}"></i>
                    </button>

                    <button class="en-action-btn" title="${item.unread ? "Mark as read" : "Mark as unread"}"
                        onclick="enToggleRead(${item.id})">
                        <i class="bi ${item.unread ? "bi-envelope-open" : "bi-envelope"}"></i>
                    </button>

                    <button class="en-action-btn" title="Archive"
                        onclick="enArchive(${item.id})">
                        <i class="bi bi-archive"></i>
                    </button>

                    <button class="en-action-btn" title="More details"
                        onclick="enOpenDetails(${item.id})">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            `;

            card.addEventListener("dblclick", () => enOpenDetails(item.id));
            feed.appendChild(card);
        });
    });

    empty.style.display = data.length ? "none" : "block";
    feed.style.display = data.length ? "block" : "none";

    document.getElementById("enResultCount").textContent =
        `Showing ${data.length} notification${data.length === 1 ? "" : "s"}`;

    document.getElementById("enFeedTitle").textContent =
        enCurrentFilter === "all" ? "All Notifications" :
        enCurrentFilter === "unread" ? "Unread Notifications" :
        enCurrentFilter === "important" ? "Important Notifications" :
        "Archived Notifications";

    document.getElementById("enFeedSubtitle").textContent =
        enCurrentCategory
            ? `Showing ${enCurrentCategory} updates`
            : "Your latest updates and activity";

    const activeFilter = document.getElementById("enActiveFilter");

    if (enCurrentCategory) {
        activeFilter.style.display = "flex";
        document.getElementById("enActiveFilterText").textContent =
            `Category: ${enCurrentCategory}`;
    } else {
        activeFilter.style.display = "none";
    }
}

function enSetFilter(filter, button) {
    enCurrentFilter = filter;
    enCurrentCategory = "";

    document.querySelectorAll(".en-nav-item").forEach(item => {
        item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".en-category-item").forEach(item => {
        item.classList.remove("active");
    });

    enRender();
}

function enSetCategory(category, button) {
    enCurrentCategory = category;
    enCurrentFilter = "all";

    document.querySelectorAll(".en-nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.filter === "all");
    });

    document.querySelectorAll(".en-category-item").forEach(item => {
        item.classList.toggle("active", item === button);
    });

    enRender();
}

function enClearCategory() {
    enCurrentCategory = "";
    document.querySelectorAll(".en-category-item").forEach(item => {
        item.classList.remove("active");
    });
    enRender();
}

function enResetFilters() {
    enCurrentFilter = "all";
    enCurrentCategory = "";

    document.getElementById("enSearch").value = "";
    document.getElementById("enDateFilter").value = "all";
    document.getElementById("enSortFilter").value = "newest";

    document.querySelectorAll(".en-nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.filter === "all");
    });

    document.querySelectorAll(".en-category-item").forEach(item => {
        item.classList.remove("active");
    });

    enRender();
}

function enToggleRead(id) {
    const item = enNotifications.find(item => item.id === id);
    if (!item) return;

    item.unread = !item.unread;
    enRender();

    enShowToast(
        item.unread ? "Marked as unread" : "Marked as read",
        item.title
    );
}

function enMarkAllRead() {
    enNotifications.forEach(item => {
        if (!item.archived) item.unread = false;
    });

    enRender();
    enShowToast("All caught up!", "All notifications have been marked as read.");
}

function enToggleImportant(id) {
    const item = enNotifications.find(item => item.id === id);
    if (!item) return;

    item.important = !item.important;
    enRender();

    enShowToast(
        item.important ? "Marked as important" : "Removed from important",
        item.title
    );
}

function enArchive(id) {
    const item = enNotifications.find(item => item.id === id);
    if (!item) return;

    item.archived = true;
    enRender();

    enShowToast("Notification archived", item.title);
}

function enOpenDetails(id) {
    const item = enNotifications.find(item => item.id === id);
    if (!item) return;

    enSelectedNotification = item;
    item.unread = false;
    enRender();

    document.getElementById("enDetailsBody").innerHTML = `
        <div class="en-detail-icon"
             style="color:${item.color};background:${item.bg}">
            <i class="bi ${item.icon}"></i>
        </div>

        <h5 class="en-detail-title">${enEscape(item.title)}</h5>
        <p class="en-detail-description">${enEscape(item.description)}</p>

        <div class="en-detail-meta">
            <span>${enEscape(item.category)}</span>
            <span><i class="bi bi-clock"></i> ${enEscape(item.dateLabel)} · ${enEscape(item.time)}</span>
            ${item.important ? '<span><i class="bi bi-star-fill"></i> Important</span>' : ""}
        </div>
    `;

    const actionButton = document.getElementById("enDetailsAction");
    actionButton.textContent = item.actionLabel;
    actionButton.onclick = function () {
        if (item.actionUrl) {
            window.location.href = item.actionUrl;
        }
    };

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("enDetailsModal")
    ).show();
}

function enOpenPreferences() {
    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("enPreferencesModal")
    ).show();
}

function enSavePreferences() {
    enPreferences = {};

    document.querySelectorAll("[data-pref]").forEach(input => {
        const categories = input.dataset.pref.split(",");

        categories.forEach(category => {
            enPreferences[category] = input.checked;
        });
    });

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("enPreferencesModal")
    ).hide();

    enShowToast("Preferences saved", "Your notification preferences have been updated.");
}

function enShowToast(title, message) {
    const toast = document.getElementById("enToast");

    document.getElementById("enToastTitle").textContent = title;
    document.getElementById("enToastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(enToastTimer);
    enToastTimer = setTimeout(enHideToast, 3500);
}

function enHideToast() {
    document.getElementById("enToast").classList.remove("show");
}

document.addEventListener("DOMContentLoaded", function () {
    enRender();

    document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            document.getElementById("enSearch").focus();
        }
    });
});
