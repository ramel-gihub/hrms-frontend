document.addEventListener("DOMContentLoaded", function () {

    const skillModalElement = document.getElementById("escSkillModal");
    const certificationModalElement = document.getElementById("escCertificationModal");

    if (!skillModalElement || !certificationModalElement) {
        return;
    }

    const skillModal = new bootstrap.Modal(skillModalElement);
    const certificationModal = new bootstrap.Modal(certificationModalElement);


    /* =====================================================
    TOAST
    ====================================================== */

    function showEscToast(message) {

        const toastElement = document.getElementById("escToast");
        const toastMessage = document.getElementById("escToastMessage");

        if (!toastElement || !toastMessage) {
            return;
        }

        toastMessage.textContent = message;

        const toast = new bootstrap.Toast(toastElement, {
            delay: 2500
        });

        toast.show();
    }


    /* =====================================================
    ADD SKILL
    ====================================================== */

    const addSkillButtons = [
        document.getElementById("escAddSkillBtn"),
        document.getElementById("escEditSelectedSkill")
    ];

    addSkillButtons.forEach(function (button) {

        if (!button) {
            return;
        }

        button.addEventListener("click", function () {

            document.getElementById("escSkillModalTitle").textContent =
                "Add Skill";

            document.getElementById("escSkillInput").value = "";
            document.getElementById("escSkillCategoryInput").value = "";
            document.getElementById("escSkillProficiencyInput").value = "Beginner";
            document.getElementById("escSkillExperienceInput").value = "";
            document.getElementById("escSkillLastUsedInput").value = "";

            skillModal.show();
        });
    });


    /* =====================================================
    SAVE SKILL
    ====================================================== */

    const saveSkillButton = document.getElementById("escSaveSkillBtn");

    if (saveSkillButton) {

        saveSkillButton.addEventListener("click", function () {

            const skillName = document
                .getElementById("escSkillInput")
                .value
                .trim();

            const category = document
                .getElementById("escSkillCategoryInput")
                .value;

            if (!skillName || !category) {

                showEscToast("Please enter skill and category.");

                return;
            }

            skillModal.hide();

            showEscToast(
                skillName + " has been saved successfully."
            );
        });
    }


    /* =====================================================
    ADD CERTIFICATION
    ====================================================== */

    const certificationButtons = [
        document.getElementById("escAddCertificationBtn"),
        document.getElementById("escAddCertificationInline")
    ];

    certificationButtons.forEach(function (button) {

        if (!button) {
            return;
        }

        button.addEventListener("click", function () {

            document.getElementById("escCertificationName").value = "";
            document.getElementById("escCertificationOrganization").value = "";
            document.getElementById("escCertificationNumber").value = "";
            document.getElementById("escCertificationIssueDate").value = "";
            document.getElementById("escCertificationExpiryDate").value = "";
            document.getElementById("escCertificationFile").value = "";

            certificationModal.show();
        });
    });


    /* =====================================================
    SAVE CERTIFICATION
    ====================================================== */

    const saveCertificationButton =
        document.getElementById("escSaveCertificationBtn");

    if (saveCertificationButton) {

        saveCertificationButton.addEventListener("click", function () {

            const certificationName = document
                .getElementById("escCertificationName")
                .value
                .trim();

            if (!certificationName) {

                showEscToast(
                    "Please enter certification name."
                );

                return;
            }

            certificationModal.hide();

            showEscToast(
                certificationName +
                " has been added successfully."
            );
        });
    }


    /* =====================================================
    SKILL SEARCH
    ====================================================== */

    const skillSearch =
        document.getElementById("escSkillSearch");

    const skillCategoryFilter =
        document.getElementById("escSkillCategoryFilter");

    const skillRows =
        document.querySelectorAll(".esc-skill-row");


    function filterSkills() {

        const searchValue = skillSearch
            ? skillSearch.value.toLowerCase().trim()
            : "";

        const categoryValue = skillCategoryFilter
            ? skillCategoryFilter.value
            : "";

        skillRows.forEach(function (row) {

            const skillName =
                row.dataset.skill.toLowerCase();

            const category =
                row.dataset.category;

            const matchesSearch =
                !searchValue ||
                skillName.includes(searchValue);

            const matchesCategory =
                !categoryValue ||
                category === categoryValue;

            row.style.display =
                matchesSearch && matchesCategory
                    ? ""
                    : "none";
        });
    }


    if (skillSearch) {
        skillSearch.addEventListener(
            "input",
            filterSkills
        );
    }

    if (skillCategoryFilter) {
        skillCategoryFilter.addEventListener(
            "change",
            filterSkills
        );
    }


    /* =====================================================
    SKILL ROW SELECTION
    ====================================================== */

    skillRows.forEach(function (row) {

        row.addEventListener("click", function (event) {

            if (
                event.target.closest(".dropdown") ||
                event.target.closest(".esc-more-btn")
            ) {
                return;
            }

            const skillName =
                row.dataset.skill;

            const category =
                row.dataset.category;

            const levelElement =
                row.querySelector(".esc-level-badge");

            const experienceElement =
                row.querySelector(".esc-skill-experience strong");

            document.getElementById(
                "escSelectedSkillName"
            ).textContent = skillName;

            document.getElementById(
                "escDetailSkill"
            ).textContent = skillName;

            document.getElementById(
                "escDetailCategory"
            ).textContent = category;

            document.getElementById(
                "escDetailProficiency"
            ).textContent =
                levelElement
                    ? levelElement.textContent.trim()
                    : "—";

            document.getElementById(
                "escDetailExperience"
            ).textContent =
                experienceElement
                    ? experienceElement.textContent.trim()
                    : "—";

            skillRows.forEach(function (item) {
                item.classList.remove("esc-selected-skill");
            });

            row.classList.add("esc-selected-skill");
        });
    });


    /* =====================================================
    EDIT SKILL
    ====================================================== */

    document.querySelectorAll(".esc-edit-skill").forEach(
        function (button) {

            button.addEventListener("click", function () {

                const row =
                    button.closest(".esc-skill-row");

                if (!row) {
                    return;
                }

                const skillName =
                    row.dataset.skill;

                const category =
                    row.dataset.category;

                document.getElementById(
                    "escSkillModalTitle"
                ).textContent = "Edit Skill";

                document.getElementById(
                    "escSkillInput"
                ).value = skillName;

                document.getElementById(
                    "escSkillCategoryInput"
                ).value = category;

                skillModal.show();
            });
        }
    );


    /* =====================================================
    DELETE SKILL
    ====================================================== */

    document.querySelectorAll(".esc-delete-skill").forEach(
        function (button) {

            button.addEventListener("click", function () {

                const row =
                    button.closest(".esc-skill-row");

                if (!row) {
                    return;
                }

                const skillName =
                    row.dataset.skill;

                const confirmed =
                    confirm(
                        "Delete " +
                        skillName +
                        " from this employee's skills?"
                    );

                if (!confirmed) {
                    return;
                }

                row.remove();

                showEscToast(
                    skillName +
                    " has been removed."
                );
            });
        }
    );


    /* =====================================================
    PREVIEW CERTIFICATION
    ====================================================== */

    document.querySelectorAll(".esc-preview-cert").forEach(
        function (button) {

            button.addEventListener("click", function () {

                showEscToast(
                    "Certificate preview will open here."
                );
            });
        }
    );


    /* =====================================================
    CERTIFICATE VIEW BUTTONS
    ====================================================== */

    document.querySelectorAll(".esc-cert-view-btn").forEach(
        function (button) {

            button.addEventListener("click", function () {

                showEscToast(
                    "Certificate preview will open here."
                );
            });
        }
    );

});