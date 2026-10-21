
/* ================= EMPLOYEE SETTINGS JS ================= */

let esToastTimer = null;
let esCurrentEditSection = "";

const esEditConfig = {
    personal: {
        title: "Update Personal Information",
        subtitle: "Submit changes to your personal information for review.",
        fields: [
            ["First Name", "firstName", "text", "Arun"],
            ["Middle Name", "middleName", "text", ""],
            ["Last Name", "lastName", "text", "Kumar"],
            ["Preferred Name", "preferredName", "text", "Arun"],
            ["Date of Birth", "dob", "date", "1998-06-12"],
            ["Gender", "gender", "select", "Male", ["Male", "Female", "Other", "Prefer not to say"]],
            ["Marital Status", "maritalStatus", "select", "Single", ["Single", "Married", "Divorced", "Widowed"]],
            ["Nationality", "nationality", "text", "Indian"],
            ["Blood Group", "bloodGroup", "select", "O+", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]]
        ]
    },
    contact: {
        title: "Update Contact Information",
        subtitle: "Keep your contact details and addresses up to date.",
        fields: [
            ["Personal Email", "personalEmail", "email", "arun.kumar@gmail.com"],
            ["Mobile Number", "mobile", "tel", ""],
            ["Alternate Phone", "alternatePhone", "tel", ""],
            ["Current Address", "currentAddress", "text", ""],
            ["Current City", "currentCity", "text", "Chennai"],
            ["Current State", "currentState", "text", "Tamil Nadu"],
            ["Current Postal Code", "currentPostalCode", "text", "600040"],
            ["Permanent address is same as current address", "sameAsCurrentAddress", "checkbox"],
            ["Permanent Address", "permanentAddress", "text", ""],
            ["Permanent City", "permanentCity", "text", "Hyderabad"],
            ["Permanent State", "permanentState", "text", "Telangana"],
            ["Permanent Postal Code", "permanentPostalCode", "text", "500001"]
        ]
    },
    bank: {
        title: "Request Bank Details Update",
        subtitle: "Submit your new bank details for HR and payroll verification.",
        fields: [
            ["Bank Name", "bankName", "text", "HDFC Bank"],
            ["Account Holder Name", "accountHolder", "text", "Arun Kumar"],
            ["Account Number", "accountNumber", "text", ""],
            ["Confirm Account Number", "confirmAccountNumber", "text", ""],
            ["IFSC Code", "ifsc", "text", ""],
            ["Branch Name", "branch", "text", "Anna Nagar, Chennai"],
            ["Account Type", "accountType", "select", "Salary / Savings", ["Salary / Savings", "Current"]],
            ["Reason for Change", "reason", "textarea", ""]
        ]
    },
    identity: {
        title: "Request Identity Information Update",
        subtitle: "Submit identity corrections for HR verification.",
        fields: [
            ["Aadhaar Number", "aadhaar", "text", ""],
            ["PAN Number", "pan", "text", ""],
            ["Passport Number", "passport", "text", ""],
            ["Driving License Number", "drivingLicense", "text", ""],
            ["Reason for Change", "reason", "textarea", ""]
        ]
    },
    emergency: {
        title: "Update Emergency Contact",
        subtitle: "Keep your emergency contact information current.",
        fields: [
            ["Contact Name", "emergencyName", "text", "Mohammed Shaik"],
            ["Relationship", "relationship", "select", "Brother", ["Father", "Mother", "Spouse", "Brother", "Sister", "Friend", "Other"]],
            ["Phone Number", "emergencyPhone", "tel", ""],
            ["Address", "emergencyAddress", "text", ""],
            ["Second Emergency Contact (Optional)", "", "section"],
            ["Contact Name", "secondEmergencyName", "text", ""],
            ["Relationship", "secondEmergencyRelationship", "select", "", ["Father", "Mother", "Spouse", "Brother", "Sister", "Friend", "Other"]],
            ["Phone Number", "secondEmergencyPhone", "tel", ""],
            ["Address", "secondEmergencyAddress", "textarea", ""]
        ]
    }
};

function esEscape(value) {
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

/* Open update modal */

function esOpenEdit(section) {
    const config = esEditConfig[section];

    if (!config) return;

    esCurrentEditSection = section;

    document.getElementById("esEditTitle").textContent = config.title;
    document.getElementById("esEditSubtitle").textContent = config.subtitle;

    const fieldsContainer = document.getElementById("esEditFields");

    fieldsContainer.innerHTML = config.fields.map(field => {
        const [label, name, type, value] = field;

        let control = "";

        if (type === "section") {
            return `
                <div class="col-12 es-edit-section-heading">
                    <h6>${esEscape(label)}</h6>
                    <p>Optional details for an additional emergency contact.</p>
                </div>
            `;
        }

        if (type === "checkbox") {
            return `
                <div class="col-12 es-edit-field es-edit-checkbox-field">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="esField_${name}">
                        <label class="form-check-label" for="esField_${name}">
                            ${esEscape(label)}
                        </label>
                    </div>
                </div>
            `;
        }

        if (type === "select") {
            const options = field[4] || [];

            control = `
                <select class="form-select" id="esField_${name}" name="${name}">
                    ${value ? "" : `<option value="" selected disabled>Select ${esEscape(label.toLowerCase())}</option>`}
                    ${options.map(option => `
                        <option value="${esEscape(option)}"
                            ${option === value ? "selected" : ""}>
                            ${esEscape(option)}
                        </option>
                    `).join("")}
                </select>
            `;
        } else if (type === "textarea") {
            control = `
                <textarea class="form-control" id="esField_${name}"
                    name="${name}" rows="3"
                    placeholder="Enter ${esEscape(label.toLowerCase())}"></textarea>
            `;
        } else {
            control = `
                <input class="form-control" type="${type}"
                    id="esField_${name}" name="${name}"
                    value="${esEscape(value)}"
                    placeholder="Enter ${esEscape(label.toLowerCase())}"
                    autocomplete="off">
            `;
        }

        return `
            <div class="col-12 col-md-6 es-edit-field">
                <label for="esField_${name}">${esEscape(label)}</label>
                ${control}
            </div>
        `;
    }).join("");

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("esEditModal")
    ).show();
}

/* Submit update request */

document.getElementById("esEditForm").addEventListener("submit", function (event) {
    event.preventDefault();

    if (esCurrentEditSection === "bank") {
        const account = document.getElementById("esField_accountNumber")?.value.trim();
        const confirmAccount = document.getElementById("esField_confirmAccountNumber")?.value.trim();

        if (!account || !confirmAccount) {
            esShowToast("Required fields", "Enter and confirm the account number.");
            return;
        }

        if (account !== confirmAccount) {
            esShowToast("Account numbers don't match", "Please check both account number fields.");
            return;
        }
    }

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById("esEditModal")
    ).hide();

    esShowToast(
        "Update request submitted",
        "Your information update request has been prepared for HR review."
    );

    /*
       BACKEND INTEGRATION:
       Send the form data to a Laravel endpoint.
       For bank and identity changes, validate server-side,
       authenticate the employee, and create an HR approval request.
       Do not store sensitive details in localStorage.
    */
});

/* Reveal / mask demo bank account number */

let esAccountVisible = false;

function esToggleAccount() {
    const account = document.getElementById("esAccountNumber");
    const button = document.getElementById("esRevealAccount");

    esAccountVisible = !esAccountVisible;

    // Demo account number only. Replace with authorized server-side data.
    account.textContent = esAccountVisible
        ? "00012345674821"
        : "•••• •••• 4821";

    button.innerHTML = esAccountVisible
        ? '<i class="bi bi-eye-slash"></i> Hide'
        : '<i class="bi bi-eye"></i> Show';
}

/* Preferences */

function esSavePreferences() {
    const preferences = {
        language: document.getElementById("esLanguage").value,
        dateFormat: document.getElementById("esDateFormat").value,
        theme: document.getElementById("esTheme").value,
        emailNotifications: document.getElementById("esEmailNotifications").checked,
        pushNotifications: document.getElementById("esPushNotifications").checked,
        celebrationNotifications: document.getElementById("esCelebrationNotifications").checked
    };

    /*
       Demo behavior:
       This confirms the current choices without persisting them.
       Connect to your Laravel preferences endpoint to save them.
    */

    console.log("Employee preferences:", preferences);

    esShowToast(
        "Preferences updated",
        "Your settings are ready to be saved to your employee account."
    );
}

/* Toast */

function esShowToast(title, message) {
    const toast = document.getElementById("esToast");

    document.getElementById("esToastTitle").textContent = title;
    document.getElementById("esToastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(esToastTimer);
    esToastTimer = setTimeout(esHideToast, 3500);
}

function esHideToast() {
    document.getElementById("esToast").classList.remove("show");
}

/* Sidebar active state while scrolling */

document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".es-nav-link");
    const sections = document.querySelectorAll(".es-main-content > section");

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === "#" + entry.target.id
                    );
                });
            }
        });
    }, {
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
});
