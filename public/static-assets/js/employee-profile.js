document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       PROFILE TABS
       ===================================================== */

    const profileTabs =
        document.querySelectorAll(".ep-profile-tab");

    const overviewContent =
        document.getElementById("profileOverview");

    const placeholderContent =
        document.getElementById("profileTabPlaceholder");

    const placeholderTitle =
        document.getElementById("profilePlaceholderTitle");


    profileTabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            profileTabs.forEach(function (item) {
                item.classList.remove("active");
            });

            this.classList.add("active");

            const selectedTab =
                this.getAttribute("data-profile-tab");


            /*
             * Overview is the actual designed content.
             *
             * The remaining tabs are ready for their
             * individual modules to be developed later.
             */

            if (selectedTab === "overview") {

                overviewContent.classList.remove("d-none");
                placeholderContent.classList.add("d-none");

                return;
            }


            overviewContent.classList.add("d-none");
            placeholderContent.classList.remove("d-none");

            placeholderTitle.textContent =
                this.textContent.trim();

        });

    });


    /* =====================================================
       EMPLOYEE ACTIONS
       ===================================================== */

    const actionButton =
        document.querySelector(".ep-btn-primary");

    if (actionButton) {

        actionButton.addEventListener("click", function () {

            const action =
                prompt(
                    "Enter an action for this employee:",
                    "Send notification"
                );

            if (action && action.trim()) {

                showProfileMessage(
                    `Action "${action.trim()}" selected.`
                );

            }

        });

    }


    /* =====================================================
       SECTION EDIT BUTTONS
       ===================================================== */

    document
        .querySelectorAll(".ep-section-edit")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                showProfileMessage(
                    "Edit mode will open for this section."
                );

            });

        });


    /* =====================================================
       QUICK INFORMATION CARDS
       ===================================================== */

    document
        .querySelectorAll(".ep-quick-card")
        .forEach(function (card) {

            card.addEventListener("click", function () {

                const title =
                    this.querySelector("span");

                if (title) {

                    showProfileMessage(
                        `${title.textContent} section selected.`
                    );

                }

            });

        });


    /* =====================================================
       PROFILE COMPLETION
       ===================================================== */

    const completeProfileButton =
        document.querySelector(
            ".ep-complete-profile-btn"
        );

    if (completeProfileButton) {

        completeProfileButton.addEventListener(
            "click",
            function () {

                const documentsTab =
                    document.querySelector(
                        '[data-profile-tab="documents"]'
                    );

                if (documentsTab) {
                    documentsTab.click();
                }

            }
        );

    }


    /* =====================================================
       ACTIVITY
       ===================================================== */

    const viewActivityButton =
        document.querySelector(".ep-view-activity");

    if (viewActivityButton) {

        viewActivityButton.addEventListener(
            "click",
            function () {

                const activityTab =
                    document.querySelector(
                        '[data-profile-tab="activity"]'
                    );

                if (activityTab) {
                    activityTab.click();
                }

            }
        );

    }


    /* =====================================================
       SIMPLE PAGE MESSAGE
       ===================================================== */

    function showProfileMessage(message) {

        let messageBox =
            document.getElementById(
                "employeeProfileMessage"
            );


        if (!messageBox) {

            messageBox =
                document.createElement("div");

            messageBox.id =
                "employeeProfileMessage";

            messageBox.style.position = "fixed";
            messageBox.style.right = "25px";
            messageBox.style.bottom = "25px";
            messageBox.style.zIndex = "9999";
            messageBox.style.background = "#24263d";
            messageBox.style.color = "#fff";
            messageBox.style.padding = "13px 18px";
            messageBox.style.borderRadius = "12px";
            messageBox.style.boxShadow =
                "0 12px 30px rgba(0,0,0,.18)";
            messageBox.style.opacity = "0";
            messageBox.style.transform =
                "translateY(10px)";
            messageBox.style.transition =
                ".25s ease";

            document.body.appendChild(messageBox);

        }


        messageBox.textContent = message;

        requestAnimationFrame(function () {

            messageBox.style.opacity = "1";
            messageBox.style.transform =
                "translateY(0)";

        });


        clearTimeout(
            messageBox.profileMessageTimer
        );


        messageBox.profileMessageTimer =
            setTimeout(function () {

                messageBox.style.opacity = "0";
                messageBox.style.transform =
                    "translateY(10px)";

            }, 2500);

    }

});