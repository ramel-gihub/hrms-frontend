// OFFCANVAS ACTIVE MENU
document.addEventListener("DOMContentLoaded", function () {

    const menuItems = document.querySelectorAll(".menu-item");

    let currentPage = window.location.pathname.split("/").pop();

    // If the URL is empty, use index.html
    if (currentPage === "") {
        currentPage = "index.html";
    }

    menuItems.forEach(function (item) {

        const linkPage = item.getAttribute("href");

        // Remove active from all items first
        item.classList.remove("active");

        // Add active only to the current page
        if (linkPage === currentPage) {
            item.classList.add("active");
        }

    });

});


// SHARED NOTIFICATIONS
// The bell in each page header opens the same responsive notification center.
document.addEventListener("DOMContentLoaded", function () {
    const headerActions = document.querySelectorAll(".top-header .header-action");
    const notificationButton = Array.from(headerActions).find(function (button) {
        return button.querySelector(".bi-bell");
    });

    if (!notificationButton || typeof bootstrap === "undefined") return;

    const storageKey = "ramelHrNotifications";
    const defaults = [
        { id: "leave", icon: "bi-calendar2-check", color: "purple", title: "New leave request", detail: "Priya Sharma submitted a leave request for review.", time: "5 min ago", unread: true },
        { id: "document", icon: "bi-file-earmark-check", color: "green", title: "Document uploaded", detail: "Aaditya Kumar added an employment document.", time: "32 min ago", unread: true },
        { id: "attendance", icon: "bi-clock-history", color: "orange", title: "Attendance needs attention", detail: "3 employees have missing clock-out records.", time: "Today, 9:30 AM", unread: true },
        { id: "payroll", icon: "bi-wallet2", color: "blue", title: "Payroll report is ready", detail: "The monthly payroll summary is available to view.", time: "Yesterday", unread: false }
    ];
    const getItems = function () {
        try {
            const saved = localStorage.getItem(storageKey);
            const items = saved ? JSON.parse(saved) : null;
            // Empty data may have been saved by the earlier Clear all behavior.
            // Restore the default feed instead of leaving the notification panel blank.
            return Array.isArray(items) && items.length ? items : defaults;
        } catch (error) { return defaults; }
    };
    const saveItems = function (items) { try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (error) {} };

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal fade site-notification-modal" id="siteNotificationModal" tabindex="-1" aria-labelledby="siteNotificationModalTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
                <div class="modal-header"><div><p class="site-notification-eyebrow">RAMEL HR PORTAL</p><h5 class="modal-title" id="siteNotificationModalTitle">Notifications</h5></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close notifications"></button></div>
                <div class="notification-toolbar"><span id="notificationCount"></span><button type="button" id="markAllNotifications" class="notification-text-button">Mark all as read</button></div>
                <div id="notificationList" class="notification-list" aria-live="polite"></div>
                <div class="notification-modal-footer"><button type="button" id="clearNotifications">Clear all notifications</button></div>
            </div></div>
        </div>`);

    const modal = new bootstrap.Modal(document.getElementById("siteNotificationModal"));
    const list = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");
    const dot = notificationButton.querySelector(".notification-dot");
    const render = function () {
        const items = getItems();
        const unread = items.filter(function (item) { return item.unread; }).length;
        count.textContent = unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up";
        document.getElementById("markAllNotifications").disabled = unread === 0;
        if (dot) dot.hidden = unread === 0;
        if (!items.length) {
            list.innerHTML = '<div class="notification-empty"><i class="bi bi-bell-slash"></i><strong>No notifications</strong><span>New activity will appear here.</span></div>';
            return;
        }
        list.innerHTML = "";
        items.forEach(function (itemData) {
            const item = document.createElement("button");
            item.type = "button";
            item.className = `notification-item${itemData.unread ? " is-unread" : ""}`;
            item.innerHTML = `<span class="notification-icon ${itemData.color}"><i class="bi ${itemData.icon}"></i></span><span class="notification-copy"><strong></strong><span class="notification-detail"></span><small></small></span>${itemData.unread ? '<span class="notification-unread-dot" aria-label="Unread"></span>' : ""}`;
            item.querySelector("strong").textContent = itemData.title;
            item.querySelector(".notification-detail").textContent = itemData.detail;
            item.querySelector("small").textContent = itemData.time;
            item.addEventListener("click", function () {
                saveItems(getItems().map(function (entry) { return entry.id === itemData.id ? Object.assign({}, entry, { unread: false }) : entry; }));
                render();
            });
            list.appendChild(item);
        });
    };

    notificationButton.type = "button";
    notificationButton.setAttribute("aria-label", "Open notifications");
    notificationButton.addEventListener("click", function () { render(); modal.show(); });
    document.getElementById("markAllNotifications").addEventListener("click", function () {
        saveItems(getItems().map(function (item) { return Object.assign({}, item, { unread: false }); })); render();
    });
    document.getElementById("clearNotifications").addEventListener("click", function () {
        // Do not persist an empty demo feed. Removing the saved state restores
        // the standard notifications after navigating or refreshing the portal.
        try { localStorage.removeItem(storageKey); } catch (error) {}
        render();
    });
    render();
});



// ORBIT MENU
const menuToggle =
    document.getElementById("menuToggle");

const radialNav =
    document.getElementById("radialNav");


if (menuToggle && radialNav) {
    menuToggle.addEventListener(
        "click",
        function (event) {

        event.stopPropagation();

        menuToggle.classList.toggle("open");

        radialNav.classList.toggle("open");

        }
    );


    radialNav.addEventListener(
        "click",
        function (event) {

        event.stopPropagation();

        }
    );
}


// SPARK MENU
const sparkMenu =
    document.getElementById("sparkMenu");
const sparkNav =
    document.getElementById("sparkNav");
if (sparkMenu && sparkNav) {
    sparkMenu.addEventListener(
        "click",
        function (event) {
        event.stopPropagation();
        sparkMenu.classList.toggle("open");
        sparkNav.classList.toggle("open");
        }
    );
    sparkNav.addEventListener(
        "click",
        function (event) {
        event.stopPropagation();
        }
    );
}

// CLOSE FLOATING MENUS
document.addEventListener(
    "click",
    function () {

        if (menuToggle && radialNav) {
            menuToggle.classList.remove("open");
            radialNav.classList.remove("open");
        }

        if (sparkMenu && sparkNav) {
            sparkMenu.classList.remove("open");
            sparkNav.classList.remove("open");
        }

    }
);


// SITE SEARCH
document.addEventListener("DOMContentLoaded", function () {
    const searchButtons = document.querySelectorAll(".top-header .header-action");

    const searchButton = Array.from(searchButtons).find(function (button) {
        return button.querySelector(".bi-search");
    });

    if (!searchButton) {
        return;
    }

    const searchContainer = document.createElement("div");
    searchContainer.className = "site-search-container";
    searchContainer.innerHTML = `
        <form class="site-search-form" role="search">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input type="search" autocomplete="off" placeholder="Search this page..."
                aria-label="Search this page" aria-expanded="false" aria-controls="siteSearchResults">
        </form>
        <div class="site-search-results" id="siteSearchResults" role="listbox" aria-live="polite" hidden></div>`;
    searchButton.replaceWith(searchContainer);

    const input = searchContainer.querySelector("input");
    const form = searchContainer.querySelector("form");
    const results = searchContainer.querySelector(".site-search-results");

    function openResults() {
        results.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    function closeResults() {
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
    }

    function getSearchableItems() {
        return Array.from(document.querySelectorAll(
            "main h1, main h2, main h3, main h4, main h5, main h6, main tr, main .card, main [role='button']"
        )).filter(function (element) {
            return element.textContent.trim().length > 2;
        });
    }

    function showResults(query) {
        const searchTerm = query.trim().toLowerCase();
        openResults();

        if (!searchTerm) {
            results.innerHTML = '<div class="site-search-empty">Start typing to search this page.</div>';
            return;
        }

        const matches = getSearchableItems().filter(function (element) {
            return element.textContent.toLowerCase().includes(searchTerm);
        }).slice(0, 8);

        if (!matches.length) {
            results.innerHTML = '<div class="site-search-empty">No results found for <strong></strong>.</div>';
            results.querySelector("strong").textContent = `“${query.trim()}”`;
            return;
        }

        results.innerHTML = "";
        matches.forEach(function (element, index) {
            const item = document.createElement("button");
            const text = element.textContent.replace(/\s+/g, " ").trim();
            item.type = "button";
            item.className = "site-search-result";
            item.setAttribute("role", "option");
            item.innerHTML = '<i class="bi bi-arrow-up-right"></i><span></span>';
            item.querySelector("span").textContent = text.length > 115 ? `${text.slice(0, 115)}…` : text;
            item.addEventListener("click", function () {
                closeResults();
                input.blur();
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("site-search-target");
                window.setTimeout(function () { element.classList.remove("site-search-target"); }, 1800);
            });
            results.appendChild(item);
        });
    }

    input.addEventListener("focus", function () { showResults(input.value); });
    input.addEventListener("input", function () { showResults(input.value); });
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const firstResult = results.querySelector(".site-search-result");
        if (firstResult) firstResult.click();
    });
    input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
            input.blur();
        }
    });
    document.addEventListener("click", function (event) {
        if (!searchContainer.contains(event.target)) {
            closeResults();
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const footerYear = document.getElementById("footerYear");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});