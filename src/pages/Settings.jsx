import React, { useEffect, useRef, useState } from "react";
import CharacterOnlyInput from "../utils/CharacterOnlyInput";
import IntegerOnlyInput from "../utils/IntegerOnlyInput";

const API_BASE = import.meta.env.VITE_API_URL || "https://hrms-backend-5xo8.onrender.com";
const EDIT_TRIGGER_STYLE = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    border: "1px solid #ded8ff",
    borderRadius: 10,
    backgroundColor: "#faf9ff",
    color: "#3c2fbc",
    padding: "8px 14px",
    fontWeight: 650,
    fontSize: "13px",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "background-color .18s ease, border-color .18s ease, color .18s ease",
};

const setEditTriggerHover = (event, isHovered) => {
    Object.assign(event.currentTarget.style, {
        backgroundColor: isHovered ? "#3c2fbc" : "#faf9ff",
        borderColor: isHovered ? "#3c2fbc" : "#ded8ff",
        color: isHovered ? "#fff" : "#3c2fbc",
    });
};

const TOP_ACTION_STYLE = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid #ebecf3",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    color: "#55586f",
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: "13px",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all .18s ease",
};

const setTopActionHover = (event, isHovered) => {
    Object.assign(event.currentTarget.style, {
        backgroundColor: isHovered ? "#f7f6ff" : "#ffffff",
        borderColor: isHovered ? "#ded8ff" : "#ebecf3",
        color: isHovered ? "#3c2fbc" : "#55586f",
    });
};

const readApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    const body = await response.text();
    throw new Error(body.trim().startsWith("<")
        ? `Server returned an unexpected response (${response.status}).`
        : body || `Request failed (${response.status}).`);
};
const EMPLOYEE_SHORTCUTS = [
    { id: "dashboard", label: "Employee Dashboard", description: "Your workspace overview", icon: "bi-grid", color: "blue" },
    { id: "apply-leave", label: "Apply Leave", description: "Request time off", icon: "bi-calendar-plus", color: "purple" },
    { id: "attendance", label: "Attendance", description: "View attendance", icon: "bi-calendar-check", color: "blue" },
    // { id: "expenses", label: "Expenses & Claims", description: "Submit & track claims", icon: "bi-wallet2", color: "orange" },
    { id: "new-request", label: "New Request", description: "Contact HR / Admin", icon: "bi-send", color: "orange" },
    { id: "documents", label: "Documents", description: "My documents", icon: "bi-folder2-open", color: "green" },
    { id: "employment-details", label: "Employment Details", description: "View your job information", icon: "bi-briefcase", color: "orange" },
    { id: "skills-certifications", label: "Skills & Certifications", description: "Manage your qualifications", icon: "bi-award", color: "green" },
    { id: "assets", label: "My Assets", description: "Assigned equipment", icon: "bi-laptop", color: "pink" },
    { id: "profile", label: "My Profile", description: "View profile", icon: "bi-person", color: "dark" },
    
    { id: "calendar", label: "Calendar", description: "View company events", icon: "bi-calendar-date", color: "blue" },
    { id: "notifications", label: "Notifications", description: "View your updates", icon: "bi-bell", color: "pink" },
    { id: "settings", label: "Settings", description: "Manage your preferences", icon: "bi-gear", color: "dark" },
    { id: "exit-management", label: "Resignation & Exit", description: "View exit information", icon: "bi-box-arrow-right", color: "orange" },
];

const SETTINGS_NAV_ITEMS = [
    { id: "esPersonal", label: "Personal Information", icon: "bi-person" },
    { id: "esContact", label: "Contact Information", icon: "bi-telephone" },
    { id: "esEmployment", label: "Employment Details", icon: "bi-briefcase" },
    { id: "esCommute", label: "Commute & Travel", icon: "bi-bus-front" },
    { id: "esBank", label: "Bank Details", icon: "bi-bank", badge: "Sensitive" },
    { id: "esIdentity", label: "Identity Information", icon: "bi-fingerprint" },
    { id: "esEmergency", label: "Emergency Contact", icon: "bi-person-hearts" },
    { id: "esAccount", label: "Account & Security", icon: "bi-shield-lock" },
    { id: "esPreferences", label: "Preferences", icon: "bi-sliders" },
    { id: "esShortcuts", label: "Shortcut Selection", icon: "bi-command" },
];

const getLatestEligibleDateOfBirth = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export default function Settings({ currentUser, employeeProfile, onProfileUpdate }) {
    const [activeSection, setActiveSection] = useState(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash.replace("#", "");
            if (SETTINGS_NAV_ITEMS.some((item) => item.id === hash)) {
                return hash;
            }
        }
        return "esPersonal";
    });
    const isManualScrollRef = useRef(false);
    const scrollTimerRef = useRef(null);

    const scrollToSection = (sectionId, event) => {
        if (event) {
            event.preventDefault();
        }
        isManualScrollRef.current = true;
        setActiveSection(sectionId);

        if (window.history.pushState) {
            window.history.pushState(null, null, `#${sectionId}`);
        } else {
            window.location.hash = sectionId;
        }

        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            const headerOffset = 85;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: "smooth"
            });

            targetElement.setAttribute("tabindex", "-1");
            targetElement.focus({ preventScroll: true });
        }

        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
            isManualScrollRef.current = false;
        }, 800);
    };

    // Auto-scroll on initial mount if hash is present in URL
    useEffect(() => {
        const hash = window.location.hash?.replace("#", "");
        if (hash && SETTINGS_NAV_ITEMS.some((item) => item.id === hash)) {
            setActiveSection(hash);
            const timer = setTimeout(() => {
                const el = document.getElementById(hash);
                if (el) {
                    const headerOffset = 85;
                    const elementPosition = el.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                        top: Math.max(0, offsetPosition),
                        behavior: "smooth"
                    });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

    // Scroll spy: auto-update active sidebar link as user scrolls through sections
    useEffect(() => {
        const handleScroll = () => {
            if (isManualScrollRef.current) return;

            const headerOffset = 130;
            const scrollPosition = window.pageYOffset + headerOffset;

            for (let i = SETTINGS_NAV_ITEMS.length - 1; i >= 0; i--) {
                const section = document.getElementById(SETTINGS_NAV_ITEMS[i].id);
                if (section) {
                    const top = section.offsetTop;
                    if (scrollPosition >= top) {
                        setActiveSection(SETTINGS_NAV_ITEMS[i].id);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        };
    }, []);

    const firstName = employeeProfile?.first_name || "";
    const lastName = employeeProfile?.last_name || "";
    const employeeName = `${firstName} ${lastName}`.trim() || currentUser?.email || "Employee";
    const employeeInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        || currentUser?.email?.slice(0, 2).toUpperCase()
        || "EM";
    const profileCompletion = Math.min(100, Math.max(0, Number(employeeProfile?.profile_completion_percentage) || 0));
    const employeeStatus = employeeProfile?.status || "Status unavailable";
    const [personalInfo, setPersonalInfo] = useState(null);
    const [personalInfoLoading, setPersonalInfoLoading] = useState(true);
    const [personalInfoError, setPersonalInfoError] = useState("");
    const [profilePictureUploading, setProfilePictureUploading] = useState(false);
    const [profilePictureError, setProfilePictureError] = useState("");
    const profilePictureInputRef = useRef(null);
    const [isPersonalEditOpen, setIsPersonalEditOpen] = useState(false);
    const [personalEditFeedback, setPersonalEditFeedback] = useState("");
    const [personalEditSubmitting, setPersonalEditSubmitting] = useState(false);
    const [personalEditForm, setPersonalEditForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        preferredName: "",
        dateOfBirth: "",
        gender: "",
        maritalStatus: "",
        nationality: "",
        bloodGroup: "",
    });
    const [contactInfo, setContactInfo] = useState(null);
    const [contactInfoLoading, setContactInfoLoading] = useState(true);
    const [contactInfoError, setContactInfoError] = useState("");
    const [isContactEditOpen, setIsContactEditOpen] = useState(false);
    const [contactEditFeedback, setContactEditFeedback] = useState("");
    const [contactEditSubmitting, setContactEditSubmitting] = useState(false);
    const [contactEditForm, setContactEditForm] = useState({
        workEmail: "",
        personalEmail: "",
        mobile: "",
        alternatePhone: "",
        currentAddress: "",
        currentCity: "",
        currentState: "",
        currentPostalCode: "",
        currentCountry: "",
        sameAsCurrentAddress: false,
        permanentAddress: "",
        permanentCity: "",
        permanentState: "",
        permanentPostalCode: "",
        permanentCountry: "",
    });
    const [employmentInfo, setEmploymentInfo] = useState(null);
    const [employmentInfoLoading, setEmploymentInfoLoading] = useState(true);
    const [employmentInfoError, setEmploymentInfoError] = useState("");
    const [bankInfo, setBankInfo] = useState(null);
    const [bankInfoLoading, setBankInfoLoading] = useState(true);
    const [bankInfoError, setBankInfoError] = useState("");
    const [fullAccountNumber, setFullAccountNumber] = useState("");
    const [accountRevealLoading, setAccountRevealLoading] = useState(false);
    const [accountRevealError, setAccountRevealError] = useState("");
    const [accountRevealModalOpen, setAccountRevealModalOpen] = useState(false);
    const [accountRevealPassword, setAccountRevealPassword] = useState("");
    const [isBankEditOpen, setIsBankEditOpen] = useState(false);
    const [bankEditSubmitting, setBankEditSubmitting] = useState(false);
    const [bankEditFeedback, setBankEditFeedback] = useState("");
    const [bankEditForm, setBankEditForm] = useState({
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        branchName: "",
        accountType: "Savings",
        reason: "",
    });
    const [accountLastFourVisible, setAccountLastFourVisible] = useState(false);
    const [identityInfo, setIdentityInfo] = useState(null);
    const [identityInfoLoading, setIdentityInfoLoading] = useState(true);
    const [identityInfoError, setIdentityInfoError] = useState("");
    const [isIdentityEditOpen, setIsIdentityEditOpen] = useState(false);
    const [identityEditSubmitting, setIdentityEditSubmitting] = useState(false);
    const [identityEditFeedback, setIdentityEditFeedback] = useState("");
    const [identityEditTouched, setIdentityEditTouched] = useState({});
    const [identityEditForm, setIdentityEditForm] = useState({
        aadhaarNumber: "",
        panNumber: "",
        passportNumber: "",
        uanNumber: "",
        reason: "",
    });
    const [emergencyContact, setEmergencyContact] = useState(null);
    const [emergencyContactLoading, setEmergencyContactLoading] = useState(true);
    const [emergencyContactError, setEmergencyContactError] = useState("");
    const [isEmergencyEditOpen, setIsEmergencyEditOpen] = useState(false);
    const [emergencyEditFeedback, setEmergencyEditFeedback] = useState("");
    const [emergencyEditSubmitting, setEmergencyEditSubmitting] = useState(false);
    const [emergencyEditForm, setEmergencyEditForm] = useState({
        contactName: "",
        relationship: "",
        phoneNumber: "",
        address: "",
        secondContactName: "",
        secondRelationship: "",
        secondPhoneNumber: "",
        secondAddress: "",
    });
    const [commuteForm, setCommuteForm] = useState({
        mode: "",
        distance: "",
        transportType: "",
        routeDetails: "",
        vehicleType: "",
        vehicleMakeModel: "",
        vehicleMileage: "",
        fuelType: "",
        status: ""
    });
    const [commuteLoading, setCommuteLoading] = useState(true);
    const [commuteSaving, setCommuteSaving] = useState(false);
    const [commuteFeedback, setCommuteFeedback] = useState("");
    const [selectedShortcutIds, setSelectedShortcutIds] = useState([]);
    const [shortcutSelectionsLoading, setShortcutSelectionsLoading] = useState(true);
    const [shortcutSelectionsSaving, setShortcutSelectionsSaving] = useState(false);
    const [shortcutSelectionError, setShortcutSelectionError] = useState("");

    // Change Password States
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordFeedback, setPasswordFeedback] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Preferences States
    const [preferencesForm, setPreferencesForm] = useState({
        preferredLanguage: "English",
        dateFormat: "DD MMM YYYY",
        theme: "light",
        emailNotifications: true,
        pushNotifications: true,
        celebrationNotifications: true
    });
    const [preferencesLoading, setPreferencesLoading] = useState(false);
    const [preferencesSaving, setPreferencesSaving] = useState(false);
    const [preferencesFeedback, setPreferencesFeedback] = useState("");
    const [preferencesSuccess, setPreferencesSuccess] = useState("");

    // Shortcut Limit Toast
    const [shortcutLimitToast, setShortcutLimitToast] = useState(false);
    const shortcutToastTimerRef = useRef(null);

    // Load preferences
    useEffect(() => {
        if (!currentUser?.id) return;
        setPreferencesLoading(true);
        fetch(`${API_BASE}/api/employee/preferences/${currentUser.id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setPreferencesForm({
                        preferredLanguage: data.preferred_language || "English",
                        dateFormat: data.date_format || "DD MMM YYYY",
                        theme: data.theme || "light",
                        emailNotifications: data.email_notifications !== false,
                        pushNotifications: data.push_notifications !== false,
                        celebrationNotifications: data.celebration_notifications !== false
                    });
                }
            })
            .catch(err => console.error("Error loading preferences:", err))
            .finally(() => setPreferencesLoading(false));
    }, [currentUser?.id]);

    const savePreferences = async () => {
        if (!currentUser?.id || preferencesSaving) return;
        setPreferencesSaving(true);
        setPreferencesFeedback("");
        setPreferencesSuccess("");
        try {
            const res = await fetch(`${API_BASE}/api/employee/preferences/${currentUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preferencesForm)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to save preferences");
            }
            setPreferencesSuccess("✓ Preferences saved successfully!");
            setTimeout(() => setPreferencesSuccess(""), 4000);
        } catch (err) {
            setPreferencesFeedback(err.message || "Failed to save preferences");
        } finally {
            setPreferencesSaving(false);
        }
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        setPasswordFeedback("");
        setPasswordSuccess("");

        if (!passwordForm.currentPassword) {
            setPasswordFeedback("Please enter your current password.");
            return;
        }
        if (!passwordForm.newPassword) {
            setPasswordFeedback("Please enter a new password.");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordFeedback("New password must be at least 6 characters long.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordFeedback("New password and confirm password do not match.");
            return;
        }

        setPasswordSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser?.id,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Unable to change password.");
            }
            setPasswordSuccess("✓ Password changed successfully!");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordSuccess("");
            }, 1800);
        } catch (err) {
            setPasswordFeedback(err.message || "Unable to change password.");
        } finally {
            setPasswordSubmitting(false);
        }
    };

    useEffect(() => {
        if (!currentUser?.id) {
            setCommuteForm({ mode: "", distance: "" });
            setCommuteLoading(false);
            setCommuteFeedback("Unable to identify the current employee.");
            return;
        }

        let isCurrent = true;
        setCommuteLoading(true);
        setCommuteFeedback("");
        const loadCommuteDetails = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/employee/commute-travel/${currentUser.id}`);
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load commute details.");
                }
                if (isCurrent) {
                    const loadedMode = data.mode || "";
                    const isPersonal = loadedMode === "Personal vehicle" || loadedMode === "Car" || loadedMode === "Bike" || loadedMode === "Two-wheeler";
                    const isPublic = loadedMode === "Public transport" || loadedMode === "Public transportation" || loadedMode === "Bus" || loadedMode === "Train / Metro";
                    const normalizedMode = isPersonal ? "Personal vehicle" : isPublic ? "Public transport" : "";

                    let vType = data.vehicle_type || "";
                    if (loadedMode === "Car") vType = "Car";
                    else if (loadedMode === "Bike" || loadedMode === "Two-wheeler") vType = "Bike";
                    else if (vType !== "Car" && vType !== "Bike") vType = "";

                    setCommuteForm({
                        mode: normalizedMode,
                        distance: data.distance == null ? "" : String(data.distance),
                        transportType: isPublic ? (data.transport_type || "") : "",
                        routeDetails: isPublic ? (data.route_details || "") : "",
                        vehicleType: isPersonal ? vType : "",
                        vehicleMakeModel: isPersonal ? (data.vehicle_make_model || "") : "",
                        vehicleMileage: isPersonal && data.vehicle_mileage != null ? String(data.vehicle_mileage) : "",
                        fuelType: isPersonal ? (data.fuel_type || "") : "",
                        status: data.status || "Pending"
                    });
                }
            } catch (error) {
                if (isCurrent) {
                    setCommuteFeedback(error.message || "Unable to load commute details.");
                }
            } finally {
                if (isCurrent) setCommuteLoading(false);
            }
        };

        loadCommuteDetails();
        return () => { isCurrent = false; };
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setSelectedShortcutIds([]);
            setShortcutSelectionsLoading(false);
            setShortcutSelectionError("Unable to identify the current employee.");
            return;
        }

        setShortcutSelectionsLoading(true);
        setShortcutSelectionError("");
        const loadShortcutSelections = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/shortcut-selections/${currentUser.id}`
                );
                if (response.status === 404) {
                    const localSaved = localStorage.getItem(`shortcut_selections_${currentUser.id}`);
                    if (localSaved) {
                        try {
                            setSelectedShortcutIds(JSON.parse(localSaved));
                        } catch {
                            setSelectedShortcutIds([]);
                        }
                    } else {
                        setSelectedShortcutIds([]);
                    }
                    return;
                }
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load shortcut selections.");
                }
                setSelectedShortcutIds(data.shortcutIds || []);
            } catch (error) {
                const localSaved = localStorage.getItem(`shortcut_selections_${currentUser.id}`);
                if (localSaved) {
                    try {
                        setSelectedShortcutIds(JSON.parse(localSaved));
                        return;
                    } catch {}
                }
                setShortcutSelectionError(error.message || "Unable to load shortcut selections.");
            } finally {
                setShortcutSelectionsLoading(false);
            }
        };

        loadShortcutSelections();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setPersonalInfoLoading(false);
            setPersonalInfoError("Unable to identify the current employee.");
            return;
        }

        const loadPersonalInfo = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/personal-info/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load personal information.");
                }
                setPersonalInfo(data);
            } catch (error) {
                setPersonalInfoError(error.message || "Unable to load personal information.");
            } finally {
                setPersonalInfoLoading(false);
            }
        };

        loadPersonalInfo();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setContactInfoLoading(false);
            setContactInfoError("Unable to identify the current employee.");
            return;
        }

        const loadContactInfo = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/contact-info/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load contact information.");
                }
                setContactInfo(data);
            } catch (error) {
                setContactInfoError(error.message || "Unable to load contact information.");
            } finally {
                setContactInfoLoading(false);
            }
        };

        loadContactInfo();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setEmploymentInfoLoading(false);
            setEmploymentInfoError("Unable to identify the current employee.");
            return;
        }

        const loadEmploymentInfo = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/employment-info/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load employment information.");
                }
                setEmploymentInfo(data);
            } catch (error) {
                setEmploymentInfoError(error.message || "Unable to load employment information.");
            } finally {
                setEmploymentInfoLoading(false);
            }
        };

        loadEmploymentInfo();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setBankInfoLoading(false);
            setBankInfoError("Unable to identify the current employee.");
            return;
        }

        const loadBankInfo = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/bank-info/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    if (response.status === 404) {
                        setBankInfo({});
                        setBankInfoError("");
                        return;
                    }
                    throw new Error(data.message || "Unable to load bank information.");
                }
                setBankInfo(data || {});
                setBankInfoError("");
            } catch (error) {
                setBankInfoError(error.message || "Unable to load bank information.");
            } finally {
                setBankInfoLoading(false);
            }
        };

        loadBankInfo();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setIdentityInfoLoading(false);
            setIdentityInfoError("Unable to identify the current employee.");
            return;
        }

        const loadIdentityInfo = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/identity-info/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    if (response.status === 404) {
                        setIdentityInfo({});
                        setIdentityInfoError("");
                        return;
                    }
                    throw new Error(data.message || "Unable to load identity information.");
                }
                setIdentityInfo(data || {});
                setIdentityInfoError("");
            } catch (error) {
                setIdentityInfoError(error.message || "Unable to load identity information.");
            } finally {
                setIdentityInfoLoading(false);
            }
        };

        loadIdentityInfo();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) {
            setEmergencyContactLoading(false);
            setEmergencyContactError("Unable to identify the current employee.");
            return;
        }

        const loadEmergencyContact = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/employee/emergency-contact/${currentUser.id}`
                );
                const data = await readApiResponse(response);
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load emergency contact.");
                }
                setEmergencyContact(Array.isArray(data) ? data : [data]);
            } catch (error) {
                setEmergencyContactError(error.message || "Unable to load emergency contact.");
            } finally {
                setEmergencyContactLoading(false);
            }
        };

        loadEmergencyContact();
    }, [currentUser?.id]);

    const displayValue = (value) => value || "—";
    const avatarUrl = personalInfo?.profile_pic || employeeProfile?.avatar_url || "";
    const employeeAvatar = avatarUrl
        ? (/^(https?:\/\/|data:|blob:)/i.test(avatarUrl) ? avatarUrl : `${API_BASE}/${avatarUrl.replace(/^\/+/, "")}`)
        : "";
    const uploadProfilePicture = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!currentUser?.id) {
            setProfilePictureError("Unable to identify the current employee.");
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setProfilePictureError("Choose a JPEG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setProfilePictureError("Profile picture must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setProfilePictureUploading(true);
        setProfilePictureError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(
                `${API_BASE}/api/employee/personal-info/${currentUser.id}/profile-pic`,
                { method: "POST", body: formData }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to upload profile picture.");
            }
            setPersonalInfo((current) => ({ ...(current || {}), profile_pic: data.profilePic }));
            if (typeof onProfileUpdate === "function") {
                onProfileUpdate();
            }
            window.dispatchEvent(new CustomEvent('profilePicUpdated', { detail: { profilePic: data.profilePic, userId: currentUser.id } }));
        } catch (error) {
            setProfilePictureError(error.message || "Unable to upload profile picture.");
        } finally {
            setProfilePictureUploading(false);
            event.target.value = "";
        }
    };
    const toggleShortcutSelection = async (shortcutId) => {
        if (shortcutSelectionsLoading || shortcutSelectionsSaving) return;

        const previousShortcutIds = selectedShortcutIds;
        const nextShortcutIds = previousShortcutIds.includes(shortcutId)
            ? previousShortcutIds.filter((id) => id !== shortcutId)
            : [...previousShortcutIds, shortcutId];
        if (nextShortcutIds.length > 6) {
            setShortcutLimitToast(true);
            setShortcutSelectionError("Maximum 6 shortcuts allowed. Please unselect one before adding another.");
            if (shortcutToastTimerRef.current) clearTimeout(shortcutToastTimerRef.current);
            shortcutToastTimerRef.current = setTimeout(() => {
                setShortcutLimitToast(false);
            }, 4500);
            return;
        }

        setSelectedShortcutIds(nextShortcutIds);
        setShortcutSelectionsSaving(true);
        setShortcutSelectionError("");
        try {
            localStorage.setItem(`shortcut_selections_${currentUser.id}`, JSON.stringify(nextShortcutIds));
            window.dispatchEvent(new CustomEvent('shortcutSelectionsUpdated', { detail: { shortcutIds: nextShortcutIds, userId: currentUser.id } }));
            const response = await fetch(
                `${API_BASE}/api/employee/shortcut-selections/${currentUser.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shortcutIds: nextShortcutIds }),
                }
            );
            if (response.status === 404) {
                // Backend endpoint not deployed yet; local selection stored safely
                return;
            }
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to save shortcut selections.");
            }
            const savedIds = data.shortcutIds || nextShortcutIds;
            setSelectedShortcutIds(savedIds);
            window.dispatchEvent(new CustomEvent('shortcutSelectionsUpdated', { detail: { shortcutIds: savedIds, userId: currentUser.id } }));
        } catch (error) {
            // Keep local selection if network/API failed
            console.warn("Shortcut selections API error:", error);
        } finally {
            setShortcutSelectionsSaving(false);
        }
    };
    const formatAddress = (...parts) => parts.filter(Boolean).join(", ") || "—";
    const emergencyContacts = Array.isArray(emergencyContact)
        ? emergencyContact
        : emergencyContact ? [emergencyContact] : [];
    const primaryEmergencyContact = emergencyContacts[0] || null;
    const secondaryEmergencyContact = emergencyContacts[1] || null;
    const openEmergencyEdit = () => {
        setEmergencyEditForm({
            contactName: primaryEmergencyContact?.contact_name || "",
            relationship: primaryEmergencyContact?.relationship || "",
            phoneNumber: primaryEmergencyContact?.phone_number || "",
            address: primaryEmergencyContact?.address || "",
            secondContactName: secondaryEmergencyContact?.contact_name || "",
            secondRelationship: secondaryEmergencyContact?.relationship || "",
            secondPhoneNumber: secondaryEmergencyContact?.phone_number || "",
            secondAddress: secondaryEmergencyContact?.address || "",
        });
        setEmergencyEditFeedback("");
        setIsEmergencyEditOpen(true);
    };
    const updateEmergencyEditField = (event) => {
        const { name, value } = event.target;
        setEmergencyEditForm((current) => ({ ...current, [name]: value }));
    };
    const handleEmergencyEditSubmit = async (event) => {
        event.preventDefault();
        if (!currentUser?.id) {
            setEmergencyEditFeedback("Unable to identify the current employee.");
            return;
        }

        setEmergencyEditSubmitting(true);
        setEmergencyEditFeedback("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/emergency-contact/${currentUser.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contactName: emergencyEditForm.contactName,
                        relationship: emergencyEditForm.relationship,
                        phoneNumber: emergencyEditForm.phoneNumber,
                        address: emergencyEditForm.address,
                        secondContactName: emergencyEditForm.secondContactName,
                        secondRelationship: emergencyEditForm.secondRelationship,
                        secondPhoneNumber: emergencyEditForm.secondPhoneNumber,
                        secondAddress: emergencyEditForm.secondAddress,
                    }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to update emergency contact.");
            }

            setEmergencyContact(Array.isArray(data) ? data : [data]);
            setIsEmergencyEditOpen(false);
        } catch (error) {
            setEmergencyEditFeedback(error.message || "Unable to update emergency contact.");
        } finally {
            setEmergencyEditSubmitting(false);
        }
    };
    const formatDate = (value) => {
        const parts = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!parts) return "—";

        const month = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
            new Date(Date.UTC(2000, Number(parts[2]) - 1, 1))
        );
        return `${Number(parts[3])} ${month} ${parts[1]}`;
    };
    const openPersonalEdit = () => {
        const info = personalInfo || {};

        setPersonalEditForm({
            firstName: info.first_name || currentUser?.email?.split('@')[0] || "",
            middleName: info.middle_name || "",
            lastName: info.last_name || "",
            preferredName: info.first_name || currentUser?.email?.split('@')[0] || "",
            dateOfBirth: String(info.date_of_birth || "").slice(0, 10),
            gender: info.gender
                ? `${info.gender.charAt(0).toUpperCase()}${info.gender.slice(1)}`
                : "",
            maritalStatus: info.marital_status || "",
            nationality: info.nationality || "Indian",
            bloodGroup: info.blood_group || "",
        });
        setPersonalEditFeedback("");
        setIsPersonalEditOpen(true);
    };
    const updatePersonalEditField = (event) => {
        const { name, value } = event.target;
        const characterOnlyFields = ["firstName", "middleName", "lastName"];
        const nextValue = characterOnlyFields.includes(name)
            ? CharacterOnlyInput.sanitize(value)
            : value;
        setPersonalEditForm((current) => ({ ...current, [name]: nextValue }));
    };
    const submitPersonalEditRequest = async (event) => {
        event.preventDefault();
        if (!currentUser?.id) {
            setPersonalEditFeedback("Unable to identify the current employee.");
            return;
        }
        if (personalEditForm.dateOfBirth && personalEditForm.dateOfBirth > getLatestEligibleDateOfBirth()) {
            setPersonalEditFeedback("Employees must be at least 18 years old.");
            return;
        }

        setPersonalEditSubmitting(true);
        setPersonalEditFeedback("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/personal-info/${currentUser.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: personalEditForm.firstName,
                        middleName: personalEditForm.middleName,
                        lastName: personalEditForm.lastName,
                        dateOfBirth: personalEditForm.dateOfBirth,
                        gender: personalEditForm.gender,
                        maritalStatus: personalEditForm.maritalStatus,
                        nationality: personalEditForm.nationality,
                        bloodGroup: personalEditForm.bloodGroup,
                    }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to update personal information.");
            }

            setPersonalInfo(data);
            setIsPersonalEditOpen(false);
            if (typeof onProfileUpdate === "function") {
                onProfileUpdate();
            }
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId: currentUser.id } }));
        } catch (error) {
            setPersonalEditFeedback(error.message || "Unable to update personal information.");
        } finally {
            setPersonalEditSubmitting(false);
        }
    };
    const openContactEdit = () => {
        const info = contactInfo || {};

        const currentAddressValues = {
            permanentAddress: info.current_address_line || "",
            permanentCity: info.current_city || "",
            permanentState: info.current_state || "",
            permanentPostalCode: info.current_postal_code || "",
            permanentCountry: info.current_country || "",
        };
        const addressIsSame = [
            [info.current_address_line, info.permanent_address_line],
            [info.current_city, info.permanent_city],
            [info.current_state, info.permanent_state],
            [info.current_postal_code, info.permanent_postal_code],
            [info.current_country, info.permanent_country],
        ].every(([current, permanent]) => (current || "") === (permanent || ""));

        setContactEditForm({
            workEmail: info.work_email || currentUser?.email || "",
            personalEmail: info.personal_email || "",
            mobile: info.phone_number || "",
            alternatePhone: info.alternate_phone || "",
            currentAddress: info.current_address_line || "",
            currentCity: info.current_city || "",
            currentState: info.current_state || "",
            currentPostalCode: info.current_postal_code || "",
            currentCountry: info.current_country || "India",
            sameAsCurrentAddress: addressIsSame,
            ...((addressIsSame && info.current_address_line) ? currentAddressValues : {
                permanentAddress: info.permanent_address_line || "",
                permanentCity: info.permanent_city || "",
                permanentState: info.permanent_state || "",
                permanentPostalCode: info.permanent_postal_code || "",
                permanentCountry: info.permanent_country || "India",
            }),
        });
        setContactEditFeedback("");
        setIsContactEditOpen(true);
    };
    const updateContactEditField = (event) => {
        const { name, value, checked, type } = event.target;
        const integerOnlyFields = ["mobile", "alternatePhone", "currentPostalCode"];
        const nextValue = integerOnlyFields.includes(name)
            ? IntegerOnlyInput.sanitize(value)
            : value;

        setContactEditForm((current) => {
            if (name === "sameAsCurrentAddress") {
                return {
                    ...current,
                    sameAsCurrentAddress: checked,
                    ...(checked ? {
                        permanentAddress: current.currentAddress,
                        permanentCity: current.currentCity,
                        permanentState: current.currentState,
                        permanentPostalCode: current.currentPostalCode,
                        permanentCountry: current.currentCountry,
                    } : {}),
                };
            }

            const next = { ...current, [name]: type === "checkbox" ? checked : nextValue };
            if (current.sameAsCurrentAddress && name.startsWith("current")) {
                const permanentField = name.replace("current", "permanent");
                next[permanentField] = nextValue;
            }
            return next;
        });
    };
    const submitContactEdit = async (event) => {
        event.preventDefault();
        const requiredFields = [
            ["Personal Email", contactEditForm.personalEmail],
            ["Mobile Number", contactEditForm.mobile],
            ["Alternate Phone", contactEditForm.alternatePhone],
            ["Current Address", contactEditForm.currentAddress],
            ["Current City", contactEditForm.currentCity],
            ["Current State", contactEditForm.currentState],
            ["Current Postal Code", contactEditForm.currentPostalCode],
        ];

        if (!contactEditForm.sameAsCurrentAddress) {
            requiredFields.push(
                ["Permanent Address", contactEditForm.permanentAddress],
                ["Permanent City", contactEditForm.permanentCity],
                ["Permanent State", contactEditForm.permanentState],
                ["Permanent Postal Code", contactEditForm.permanentPostalCode],
                ["Permanent Country", contactEditForm.permanentCountry]
            );
        }

        const missingFields = requiredFields
            .filter(([, value]) => !String(value ?? "").trim())
            .map(([label]) => label);

        if (missingFields.length) {
            setContactEditFeedback(`Please fill in: ${missingFields.join(", ")}.`);
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = [
            ["Work Email", contactEditForm.workEmail],
            ["Personal Email", contactEditForm.personalEmail],
        ]
            .filter(([, email]) => !emailPattern.test(email.trim()))
            .map(([label]) => label);

        if (invalidEmails.length) {
            setContactEditFeedback(`Enter a valid ${invalidEmails.join(" and ")}.`);
            return;
        }

        if (!currentUser?.id) {
            setContactEditFeedback("Unable to identify the current employee.");
            return;
        }

        setContactEditSubmitting(true);
        setContactEditFeedback("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/contact-info/${currentUser.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workEmail: contactEditForm.workEmail,
                        personalEmail: contactEditForm.personalEmail,
                        mobile: contactEditForm.mobile,
                        alternatePhone: contactEditForm.alternatePhone,
                        currentAddress: contactEditForm.currentAddress,
                        currentCity: contactEditForm.currentCity,
                        currentState: contactEditForm.currentState,
                        currentPostalCode: contactEditForm.currentPostalCode,
                        currentCountry: contactEditForm.currentCountry,
                        permanentAddress: contactEditForm.permanentAddress,
                        permanentCity: contactEditForm.permanentCity,
                        permanentState: contactEditForm.permanentState,
                        permanentPostalCode: contactEditForm.permanentPostalCode,
                        permanentCountry: contactEditForm.permanentCountry,
                    }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to update contact information.");
            }

            setContactInfo(data);
            setIsContactEditOpen(false);
            if (typeof onProfileUpdate === "function") {
                onProfileUpdate();
            }
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { userId: currentUser.id } }));
        } catch (error) {
            setContactEditFeedback(error.message || "Unable to update contact information.");
        } finally {
            setContactEditSubmitting(false);
        }
    };
    const openBankEdit = () => {
        const info = bankInfo || {};

        setBankEditForm({
            bankName: info.bank_name || "",
            accountHolderName: info.account_holder_name || "",
            accountNumber: fullAccountNumber || "",
            confirmAccountNumber: fullAccountNumber || "",
            ifscCode: info.ifsc_code || "",
            branchName: info.branch_name || "",
            accountType: info.account_type || "Savings",
            reason: "",
        });
        setBankEditFeedback("");
        setIsBankEditOpen(true);
    };
    const closeBankEdit = () => {
        setIsBankEditOpen(false);
        setFullAccountNumber("");
        setBankEditForm((current) => ({
            ...current,
            accountNumber: "",
            confirmAccountNumber: "",
        }));
    };
    const updateBankEditField = (event) => {
        const { name, value } = event.target;
        setBankEditForm((current) => ({ ...current, [name]: value }));
    };
    const submitBankEdit = async (event) => {
        event.preventDefault();
        const requiredFields = [
            ["Bank Name", bankEditForm.bankName],
            ["Account Holder Name", bankEditForm.accountHolderName],
            ["Account Number", bankEditForm.accountNumber],
            ["Confirm Account Number", bankEditForm.confirmAccountNumber],
            ["IFSC Code", bankEditForm.ifscCode],
        ];
        const missingFields = requiredFields
            .filter(([, value]) => !String(value ?? "").trim())
            .map(([label]) => label);

        if (missingFields.length) {
            setBankEditFeedback(`Please fill in: ${missingFields.join(", ")}.`);
            return;
        }

        if (!currentUser?.id) {
            setBankEditFeedback("Unable to identify the current employee.");
            return;
        }
        if (bankEditForm.accountNumber !== bankEditForm.confirmAccountNumber) {
            setBankEditFeedback("Account numbers do not match.");
            return;
        }

        setBankEditSubmitting(true);
        setBankEditFeedback("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/bank-info/${currentUser.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bankName: bankEditForm.bankName,
                        accountHolderName: bankEditForm.accountHolderName,
                        accountNumber: bankEditForm.accountNumber,
                        confirmAccountNumber: bankEditForm.confirmAccountNumber,
                        ifscCode: bankEditForm.ifscCode,
                        branchName: bankEditForm.branchName,
                        accountType: bankEditForm.accountType,
                    }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to update bank information.");
            }

            setBankInfo(data);
            setAccountLastFourVisible(false);
            setFullAccountNumber("");
            setIsBankEditOpen(false);
        } catch (error) {
            setBankEditFeedback(error.message || "Unable to update bank information.");
        } finally {
            setBankEditSubmitting(false);
        }
    };
    const openIdentityEdit = () => {
        setIdentityEditForm({
            aadhaarNumber: identityInfo?.aadhaar_last_four ? `XXXX XXXX ${identityInfo.aadhaar_last_four}` : "",
            panNumber: identityInfo?.pan_number_masked || "",
            passportNumber: identityInfo?.passport_number_masked || "",
            uanNumber: identityInfo?.uan_last_four ? `•••• •••• ${identityInfo.uan_last_four}` : "",
            reason: "",
        });
        setIdentityEditTouched({});
        setIdentityEditFeedback("");
        setIsIdentityEditOpen(true);
    };
    const updateIdentityEditField = (event) => {
        const { name, value } = event.target;
        const nextValue = name === "uanNumber" ? IntegerOnlyInput.sanitize(value) : value;
        setIdentityEditForm((current) => ({ ...current, [name]: nextValue }));
        setIdentityEditTouched((current) => ({ ...current, [name]: true }));
    };
    const focusIdentityNumberField = (event) => {
        const { name } = event.target;
        if (!identityEditTouched[name]) {
            setIdentityEditForm((current) => ({ ...current, [name]: "" }));
            setIdentityEditTouched((current) => ({ ...current, [name]: true }));
        }
    };
    const submitIdentityEdit = async (event) => {
        event.preventDefault();
        const aadhaarNumber = identityEditTouched.aadhaarNumber
            ? identityEditForm.aadhaarNumber.replace(/\D/g, "")
            : "";
        const panNumber = identityEditTouched.panNumber
            ? identityEditForm.panNumber.trim().toUpperCase()
            : "";
        const passportNumber = identityEditTouched.passportNumber
            ? identityEditForm.passportNumber.trim()
            : "";
        const uanNumber = identityEditTouched.uanNumber
            ? identityEditForm.uanNumber.replace(/\D/g, "")
            : "";

        const hasAnyInput = aadhaarNumber || panNumber || passportNumber || uanNumber;
        if (!hasAnyInput) {
            setIdentityEditFeedback("Please enter at least one identity number (Aadhaar, PAN, Passport, or UAN).");
            return;
        }

        if (!currentUser?.id) {
            setIdentityEditFeedback("Unable to identify the current employee.");
            return;
        }

        setIdentityEditSubmitting(true);
        setIdentityEditFeedback("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/identity-info/${currentUser.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        aadhaarNumber,
                        panNumber,
                        passportNumber,
                        uanNumber,
                    }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to update identity information.");
            }
            setIdentityInfo(data);
            setIsIdentityEditOpen(false);
        } catch (error) {
            setIdentityEditFeedback(error.message || "Unable to update identity information.");
        } finally {
            setIdentityEditSubmitting(false);
        }
    };
    const toggleAccountNumber = () => {
        if (accountLastFourVisible) {
            setAccountLastFourVisible(false);
            setFullAccountNumber("");
            setAccountRevealError("");
            return;
        }
        if (!currentUser?.id) {
            setAccountRevealError("Unable to identify the current employee.");
            return;
        }

        setAccountRevealPassword("");
        setAccountRevealError("");
        setAccountRevealModalOpen(true);
    };
    const closeAccountRevealModal = () => {
        setAccountRevealModalOpen(false);
        setAccountRevealPassword("");
        setAccountRevealError("");
    };
    const submitAccountReveal = async (event) => {
        event.preventDefault();
        setAccountRevealLoading(true);
        setAccountRevealError("");
        try {
            const response = await fetch(
                `${API_BASE}/api/employee/bank-info/${currentUser.id}/account-number/reveal`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: accountRevealPassword }),
                }
            );
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to reveal account number.");
            }
            setFullAccountNumber(data.account_number || "");
            setAccountLastFourVisible(true);
            setAccountRevealModalOpen(false);
        } catch (error) {
            setAccountRevealError(error.message || "Unable to reveal account number.");
        } finally {
            setAccountRevealLoading(false);
            setAccountRevealPassword("");
        }
    };
    const dateOfBirth = formatDate(personalInfo?.date_of_birth);

    const saveCommuteDetails = async (event) => {
        event.preventDefault();
        if (!currentUser?.id) {
            setCommuteFeedback("Unable to identify the current employee.");
            return;
        }

        const isPersonal = commuteForm.mode === "Personal vehicle";
        const isPublic = commuteForm.mode === "Public transport";

        setCommuteSaving(true);
        setCommuteFeedback("");
        try {
            const response = await fetch(`${API_BASE}/api/employee/commute-travel/${currentUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: commuteForm.mode,
                    distance: commuteForm.distance,
                    transport_type: isPublic ? commuteForm.transportType : null,
                    route_details: isPublic ? commuteForm.routeDetails : null,
                    vehicle_type: isPersonal ? commuteForm.vehicleType : null,
                    vehicle_make_model: isPersonal ? commuteForm.vehicleMakeModel : null,
                    vehicle_mileage: isPersonal ? commuteForm.vehicleMileage : null,
                    fuel_type: isPersonal ? commuteForm.fuelType : null
                }),
            });
            const data = await readApiResponse(response);
            if (!response.ok) {
                throw new Error(data.message || "Unable to save commute details.");
            }
            setCommuteForm({
                mode: "",
                distance: "",
                transportType: "",
                routeDetails: "",
                vehicleType: "",
                vehicleMakeModel: "",
                vehicleMileage: "",
                fuelType: "",
                status: data.status || "Pending"
            });
            setCommuteFeedback("Travel details submitted (Status: Pending admin approval).");
        } catch (error) {
            setCommuteFeedback(error.message || "Unable to save commute details.");
        } finally {
            setCommuteSaving(false);
        }
    };

  return (
    <>
<div className="px-0 px-md-5 employee-dashboard">
                

<div className="employee-settings-page">

    
    <div className="es-page-header">
        <div>
            <h2>My Settings</h2>
            <p>Manage your personal information, bank details, and account preferences.</p>
        </div>
        <button
            className="btn es-btn-light"
            type="button"
            style={TOP_ACTION_STYLE}
            onMouseEnter={(e) => setTopActionHover(e, true)}
            onMouseLeave={(e) => setTopActionHover(e, false)}
        >
            <i className="bi bi-shield-check"></i> Privacy & Security
        </button>
    </div>

    
    <div className="es-profile-banner">
        <div className="es-profile-avatar">
            {employeeAvatar
                ? <img src={employeeAvatar} alt={`${employeeName} profile`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "23px" }} />
                : <span>{employeeInitials}</span>}
            <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="d-none"
                onChange={uploadProfilePicture}
            />
            <button
                type="button"
                title={profilePictureUploading ? "Uploading profile photo" : "Change profile photo"}
                aria-label={profilePictureUploading ? "Uploading profile photo" : "Change profile photo"}
                disabled={profilePictureUploading}
                onClick={() => profilePictureInputRef.current?.click()}
            >
                <i className={`bi ${profilePictureUploading ? "bi-arrow-repeat" : "bi-camera-fill"}`}></i>
            </button>
        </div>
        <div className="es-profile-info">
            <span className="es-profile-label">EMPLOYEE PROFILE</span>
            <h3>{employeeName}</h3>
            <p>{employeeProfile?.designation || employeeProfile?.role_name || "Position not set"} · {employeeProfile?.department || "Department not set"}{employeeProfile?.team ? ` / ${employeeProfile.team}` : ""}</p>
            <div className="es-profile-tags">
                <span><i className="bi bi-person-badge"></i> {employeeProfile?.employee_code || "Not assigned"}</span>
                <span><i className="bi bi-geo-alt"></i> {contactInfo?.current_city || employeeProfile?.city || employeeProfile?.location || "Location not set"}</span>
                <span className={employeeStatus.toLowerCase() === "active" ? "es-active-tag" : ""}><i className="bi bi-check-circle-fill"></i> {employeeStatus}</span>
            </div>
            {profilePictureError && <p className="text-danger mb-0" role="alert">{profilePictureError}</p>}
        </div>
        <div className="es-profile-completion">
            <div className="es-completion-top">
                <span>Profile Completion</span>
                <strong>{profileCompletion}%</strong>
            </div>
            <div className="progress es-progress">
                <div className="progress-bar" style={{width: `${profileCompletion}%`}}></div>
            </div>
            <small>Complete your remaining profile details.</small>
        </div>
    </div>

    
    <div className="es-layout">

        
        <aside className="es-navigation">
            <div className="es-nav-heading">SETTINGS MENU</div>

            {SETTINGS_NAV_ITEMS.map((item) => (
                <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`es-nav-link ${activeSection === item.id ? "active" : ""}`}
                    onClick={(e) => scrollToSection(item.id, e)}
                >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                    {item.badge && <span className="es-nav-badge">{item.badge}</span>}
                </a>
            ))}

            <div className="es-nav-help">
                <div className="es-help-icon"><i className="bi bi-headset"></i></div>
                <strong>Need help?</strong>
                <p>Contact HR if you need help updating your employee information.</p>
                <button type="button">
                    Contact HR <i className="bi bi-arrow-up-right"></i>
                </button>
            </div>
        </aside>

        
        <main className="es-main-content">

            
            <section className="es-section-card" id="esPersonal">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-purple"><i className="bi bi-person-vcard"></i></div>
                        <div>
                            <h4>Personal Information</h4>
                            <p>Your basic identity and personal details</p>
                        </div>
                    </div>
                    <button className="btn" type="button" style={EDIT_TRIGGER_STYLE} onMouseEnter={(event) => setEditTriggerHover(event, true)} onMouseLeave={(event) => setEditTriggerHover(event, false)} onClick={openPersonalEdit}>
                        <i className="bi bi-pencil"></i> Edit
                    </button>
                </div>

                <div className="es-info-grid">
                    <div className="es-info-item"><span>First Name</span><strong>{displayValue(personalInfo?.first_name)}</strong></div>
                    <div className="es-info-item"><span>Middle Name</span><strong>{displayValue(personalInfo?.middle_name)}</strong></div>
                    <div className="es-info-item"><span>Last Name</span><strong>{displayValue(personalInfo?.last_name)}</strong></div>
                    <div className="es-info-item"><span>Preferred Name</span><strong>{displayValue(personalInfo?.first_name)}</strong></div>
                    <div className="es-info-item"><span>Date of Birth</span><strong>{dateOfBirth}</strong></div>
                    <div className="es-info-item"><span>Gender</span><strong>{displayValue(personalInfo?.gender)}</strong></div>
                    <div className="es-info-item"><span>Marital Status</span><strong>{displayValue(personalInfo?.marital_status)}</strong></div>
                    <div className="es-info-item"><span>Nationality</span><strong>{displayValue(personalInfo?.nationality)}</strong></div>
                    <div className="es-info-item"><span>Blood Group</span><strong>{displayValue(personalInfo?.blood_group)}</strong></div>
                </div>
                {personalInfoLoading && <p role="status">Loading personal information...</p>}
                {personalInfoError && <p role="alert">{personalInfoError}</p>}
            </section>

            
            <section className="es-section-card" id="esContact">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-blue"><i className="bi bi-telephone"></i></div>
                        <div>
                            <h4>Contact Information</h4>
                            <p>Your personal contact details and addresses</p>
                        </div>
                    </div>
                    <button className="btn" type="button" style={EDIT_TRIGGER_STYLE} onMouseEnter={(event) => setEditTriggerHover(event, true)} onMouseLeave={(event) => setEditTriggerHover(event, false)} onClick={openContactEdit}>
                        <i className="bi bi-pencil"></i> Edit
                    </button>
                </div>

                <div className="es-info-grid">
                    <div className="es-info-item"><span>Personal Email</span><strong>{displayValue(contactInfo?.personal_email)}</strong></div>
                    <div className="es-info-item"><span>Work Email</span><strong>{displayValue(contactInfo?.work_email)}</strong></div>
                    <div className="es-info-item"><span>Mobile Number</span><strong>{displayValue(contactInfo?.phone_number)}</strong></div>
                    <div className="es-info-item"><span>Alternate Phone</span><strong>{displayValue(contactInfo?.alternate_phone)}</strong></div>
                </div>
                {contactInfoLoading && <p role="status">Loading contact information...</p>}
                {contactInfoError && <p role="alert">{contactInfoError}</p>}

                <div className="es-address-grid">
                    <div className="es-address-box">
                        <div className="es-address-heading"><i className="bi bi-house"></i> Current Address</div>
                        <p>{displayValue(contactInfo?.current_address_line)}</p>
                        <span>{formatAddress(contactInfo?.current_city, contactInfo?.current_state, contactInfo?.current_postal_code, contactInfo?.current_country)}</span>
                    </div>
                    <div className="es-address-box">
                        <div className="es-address-heading"><i className="bi bi-house-door"></i> Permanent Address</div>
                        <p>{displayValue(contactInfo?.permanent_address_line)}</p>
                        <span>{formatAddress(contactInfo?.permanent_city, contactInfo?.permanent_state, contactInfo?.permanent_postal_code, contactInfo?.permanent_country)}</span>
                    </div>
                </div>
            </section>

            
            <section className="es-section-card" id="esEmployment">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-orange"><i className="bi bi-briefcase"></i></div>
                        <div>
                            <h4>Employment Details</h4>
                            <p>Your official job and organizational information</p>
                        </div>
                    </div>
                    <span className="es-readonly-badge"><i className="bi bi-lock"></i> HR Managed</span>
                </div>

                <div className="es-info-grid">
                    <div className="es-info-item"><span>Employee ID</span><strong>{displayValue(employmentInfo?.employee_code)}</strong></div>
                    <div className="es-info-item"><span>Employment Type</span><strong>{displayValue(employmentInfo?.employment_type)}</strong></div>
                    <div className="es-info-item"><span>Department</span><strong>{displayValue(employmentInfo?.department)}</strong></div>
                    <div className="es-info-item"><span>Team</span><strong>—</strong></div>
                    <div className="es-info-item"><span>Designation</span><strong>{displayValue(employmentInfo?.designation)}</strong></div>
                    <div className="es-info-item"><span>Reporting Manager</span><strong>{displayValue(employmentInfo?.reporting_manager)}</strong></div>
                    <div className="es-info-item"><span>Joining Date</span><strong>{formatDate(employmentInfo?.joining_date)}</strong></div>
                    <div className="es-info-item"><span>Work Mode</span><strong>{displayValue(employmentInfo?.work_mode)}</strong></div>
                    <div className="es-info-item"><span>Office Location</span><strong>{displayValue(employmentInfo?.office_location)}</strong></div>
                    <div className="es-info-item"><span>Employment Status</span><strong><span className="es-status-active">{displayValue(employmentInfo?.employment_status)}</span></strong></div>
                </div>
                {employmentInfoLoading && <p role="status">Loading employment information...</p>}
                {employmentInfoError && <p role="alert">{employmentInfoError}</p>}
            </section>


            <section className="es-section-card" id="esCommute">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-green"><i className="bi bi-bus-front"></i></div>
                        <div>
                            <h4>Commute &amp; Travel</h4>
                            <p>Tell us how you usually travel to the office</p>
                        </div>
                    </div>
                    {(commuteForm.status || commuteForm.mode) && (
                        <span className={`badge ${
                            commuteForm.status === 'Approved' ? 'bg-success' :
                            commuteForm.status === 'Rejected' ? 'bg-danger' :
                            'bg-warning text-dark'
                        }`} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <i className={`bi ${
                                commuteForm.status === 'Approved' ? 'bi-check-circle-fill' :
                                commuteForm.status === 'Rejected' ? 'bi-x-circle-fill' :
                                'bi-clock-history'
                            }`}></i>
                            {commuteForm.status || 'Pending'}
                        </span>
                    )}
                </div>

                {commuteLoading && <p role="status">Loading travel details...</p>}
                <form className="es-commute-form" onSubmit={saveCommuteDetails}>
                    {(() => {
                        const isPublicTransport = commuteForm.mode === "Public transport";
                        const isPersonalVehicle = commuteForm.mode === "Personal vehicle";

                        return (
                            <div className="es-commute-fields">
                                <label className="es-commute-field">
                                    <span>Usual mode of travel</span>
                                    <select
                                        value={commuteForm.mode}
                                        onChange={(event) => {
                                            const selectedMode = event.target.value;
                                            setCommuteForm((form) => {
                                                if (selectedMode === "Public transport") {
                                                    return {
                                                        ...form,
                                                        mode: selectedMode,
                                                        vehicleType: "",
                                                        vehicleMakeModel: "",
                                                        vehicleMileage: "",
                                                        fuelType: ""
                                                    };
                                                }
                                                if (selectedMode === "Personal vehicle") {
                                                    return {
                                                        ...form,
                                                        mode: "Personal vehicle",
                                                        transportType: "",
                                                        routeDetails: "",
                                                        vehicleType: form.vehicleType === "Car" || form.vehicleType === "Bike" ? form.vehicleType : ""
                                                    };
                                                }
                                                return {
                                                    ...form,
                                                    mode: selectedMode,
                                                    transportType: "",
                                                    routeDetails: "",
                                                    vehicleType: "",
                                                    vehicleMakeModel: "",
                                                    vehicleMileage: "",
                                                    fuelType: ""
                                                };
                                            });
                                            setCommuteFeedback("");
                                        }}
                                        required
                                    >
                                        <option value="" disabled>Select a travel mode</option>
                                        <option value="Personal vehicle">Personal vehicle</option>
                                        <option value="Public transport">Public transport</option>
                                    </select>
                                </label>
                                <label className="es-commute-field">
                                    <span>One-way commute distance (km)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="e.g. 12.5"
                                        value={commuteForm.distance}
                                        onChange={(event) => {
                                            setCommuteForm((form) => ({ ...form, distance: event.target.value }));
                                            setCommuteFeedback("");
                                        }}
                                    />
                                </label>

                                {isPublicTransport && (
                                    <>
                                        <label className="es-commute-field">
                                            <span>Public transport type</span>
                                            <select
                                                value={commuteForm.transportType}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, transportType: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                                required
                                            >
                                                <option value="" disabled>Select a transport type</option>
                                                <option value="Bus">Bus</option>
                                                <option value="Train / Metro">Train / Metro</option>
                                                <option value="Auto rickshaw">Auto rickshaw</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </label>
                                        <label className="es-commute-field">
                                            <span>Route or service details (optional)</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. Bus route or metro line"
                                                value={commuteForm.routeDetails}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, routeDetails: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                            />
                                        </label>
                                    </>
                                )}

                                {isPersonalVehicle && (
                                    <>
                                        <label className="es-commute-field">
                                            <span>Vehicle type</span>
                                            <select
                                                value={commuteForm.vehicleType}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, vehicleType: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                                required
                                            >
                                                <option value="" disabled>Select a vehicle type</option>
                                                <option value="Car">Car</option>
                                                <option value="Bike">Bike</option>
                                            </select>
                                        </label>
                                        <label className="es-commute-field">
                                            <span>Vehicle make and model</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. Honda Activa"
                                                value={commuteForm.vehicleMakeModel}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, vehicleMakeModel: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                            />
                                        </label>
                                        <label className="es-commute-field">
                                            <span>Mileage (km/L, if applicable)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                placeholder="e.g. 45"
                                                value={commuteForm.vehicleMileage}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, vehicleMileage: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                            />
                                        </label>
                                        <label className="es-commute-field">
                                            <span>Fuel type</span>
                                            <select
                                                value={commuteForm.fuelType}
                                                onChange={(event) => {
                                                    setCommuteForm((form) => ({ ...form, fuelType: event.target.value }));
                                                    setCommuteFeedback("");
                                                }}
                                            >
                                                <option value="" disabled>Select a fuel type</option>
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Electric">Electric</option>
                                                <option value="CNG">CNG</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </label>
                                    </>
                                )}
                            </div>
                        );
                    })()}
                    <div className="es-commute-actions">
                        <button
                            type="submit"
                            className="btn es-commute-save"
                            style={EDIT_TRIGGER_STYLE}
                            onMouseEnter={(event) => setEditTriggerHover(event, true)}
                            onMouseLeave={(event) => setEditTriggerHover(event, false)}
                            disabled={commuteLoading || commuteSaving}
                        >
                            <i className={`bi ${commuteSaving ? "bi-arrow-repeat" : "bi-check2"}`}></i> {commuteSaving ? "Saving..." : "Save Travel Details"}
                        </button>
                        <span className="es-commute-note"><i className="bi bi-info-circle"></i> Your details are saved to your employee profile.</span>
                        {commuteFeedback && <span className="es-commute-feedback" role="status">{commuteFeedback}</span>}
                    </div>
                </form>
            </section>

            
            <section className="es-section-card es-bank-section" id="esBank">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-green"><i className="bi bi-bank"></i></div>
                        <div>
                            <h4>Bank Details</h4>
                            <p>Your salary account and payment information</p>
                        </div>
                    </div>
                    <button className="btn" type="button" style={EDIT_TRIGGER_STYLE} onMouseEnter={(event) => setEditTriggerHover(event, true)} onMouseLeave={(event) => setEditTriggerHover(event, false)} onClick={openBankEdit}>
                        <i className="bi bi-pencil"></i> Request Update
                    </button>
                </div>

                <div className="es-bank-security">
                    <div className="es-bank-security-icon"><i className="bi bi-shield-lock-fill"></i></div>
                    <div>
                        <strong>Your bank information is protected</strong>
                        <p>Account numbers are masked. Changes may require HR verification before payroll updates.</p>
                    </div>
                    <span className={`es-verified-badge${bankInfo?.verification_status?.toLowerCase() === "pending" ? " es-pending-badge" : ""}`}>
                        <i className="bi bi-patch-check-fill"></i> {displayValue(bankInfo?.verification_status)}
                    </span>
                </div>

                <div className="es-bank-card">
                    <div className="es-bank-card-top">
                        <div className="es-bank-logo"><i className="bi bi-bank2"></i></div>
                        <span className="es-bank-account-type">{displayValue(bankInfo?.account_type).toUpperCase()}</span>
                    </div>
                    <h3>{displayValue(bankInfo?.bank_name)}</h3>
                    <p>Account Holder</p>
                    <strong className="es-account-holder">{displayValue(bankInfo?.account_holder_name)}</strong>
                    <div className="es-account-number-row">
                        <div>
                            <span>Account Number</span>
                            <strong id="esAccountNumber">
                                {bankInfo?.account_last_four
                                    ? accountLastFourVisible
                                        ? fullAccountNumber || "—"
                                        : `•••• •••• ${bankInfo.account_last_four}`
                                    : "—"}
                            </strong>
                        </div>
                        <button
                            className="es-reveal-btn"
                            id="esRevealAccount"
                            type="button"
                            disabled={!bankInfo?.account_last_four || accountRevealLoading}
                            onClick={toggleAccountNumber}
                        >
                            <i className={`bi ${accountRevealLoading ? "bi-arrow-repeat" : accountLastFourVisible ? "bi-eye-slash" : "bi-eye"}`}></i>
                            {accountRevealLoading ? "Loading..." : accountLastFourVisible ? "Hide" : "Show"}
                        </button>
                    </div>
                    {accountRevealError && <p className="text-danger mb-0" role="alert">{accountRevealError}</p>}
                    <div className="es-bank-card-footer">
                        <div><span>IFSC Code</span><strong>{displayValue(bankInfo?.ifsc_code)}</strong></div>
                        <div><span>Branch</span><strong>{displayValue(bankInfo?.branch_name)}</strong></div>
                    </div>
                </div>
                {bankInfoLoading && <p role="status">Loading bank information...</p>}
                {bankInfoError && <p role="alert">{bankInfoError}</p>}

                <div className="es-info-grid es-bank-extra">
                    <div className="es-info-item"><span>Account Type</span><strong>{displayValue(bankInfo?.account_type)}</strong></div>
                    <div className="es-info-item">
                        <span>Bank Verification</span>
                        <strong>
                            {bankInfo?.verification_status?.toLowerCase() === "verified"
                                ? <span className="es-status-active">{bankInfo.verification_status}</span>
                                : bankInfo?.verification_status?.toLowerCase() === "pending"
                                    ? <span className="es-status-pending">{bankInfo.verification_status}</span>
                                    : displayValue(bankInfo?.verification_status)}
                        </strong>
                    </div>
                    <div className="es-info-item"><span>Last Verified</span><strong>—</strong></div>
                    <div className="es-info-item"><span>Payment Method</span><strong>—</strong></div>
                </div>
            </section>

            
            <section className="es-section-card" id="esIdentity">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-pink"><i className="bi bi-fingerprint"></i></div>
                        <div>
                            <h4>Identity Information</h4>
                            <p>Government-issued identity details</p>
                        </div>
                    </div>
                    <button className="btn" type="button" style={EDIT_TRIGGER_STYLE} onMouseEnter={(event) => setEditTriggerHover(event, true)} onMouseLeave={(event) => setEditTriggerHover(event, false)} onClick={openIdentityEdit}>
                        <i className="bi bi-pencil"></i> Request Update
                    </button>
                </div>

                <div className="es-info-grid">
                    <div className="es-info-item">
                        <span>Aadhaar Number</span>
                        <strong>{identityInfo?.aadhaar_last_four ? `XXXX XXXX ${identityInfo.aadhaar_last_four}` : "—"}</strong>
                    </div>
                    <div className="es-info-item">
                        <span>PAN Number</span>
                        <strong>{displayValue(identityInfo?.pan_number_masked)}</strong>
                    </div>
                    <div className="es-info-item">
                        <span>Passport Number</span>
                        <strong>{displayValue(identityInfo?.passport_number_masked)}</strong>
                    </div>
                    <div className="es-info-item">
                        <span>UAN Number</span>
                        <strong>{identityInfo?.uan_last_four ? `•••• •••• ${identityInfo.uan_last_four}` : "—"}</strong>
                    </div>
                </div>
                {identityInfoLoading && <p role="status">Loading identity information...</p>}
                {identityInfoError && <p role="alert">{identityInfoError}</p>}
                <div className="es-security-note">
                    <i className="bi bi-shield-lock"></i>
                    Identity numbers are masked for privacy. Contact HR for verified document updates.
                </div>
            </section>

            
            <section className="es-section-card" id="esEmergency">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-red"><i className="bi bi-person-hearts"></i></div>
                        <div>
                            <h4>Emergency Contact</h4>
                            <p>Person to contact in case of an emergency</p>
                        </div>
                    </div>
                    <button className="btn" type="button" style={EDIT_TRIGGER_STYLE} onMouseEnter={(event) => setEditTriggerHover(event, true)} onMouseLeave={(event) => setEditTriggerHover(event, false)} onClick={openEmergencyEdit}>
                        <i className="bi bi-pencil"></i> Edit
                    </button>
                </div>

                <div className="es-info-grid">
                    <div className="es-info-item"><span>Contact Name</span><strong>{displayValue(primaryEmergencyContact?.contact_name)}</strong></div>
                    <div className="es-info-item"><span>Relationship</span><strong>{displayValue(primaryEmergencyContact?.relationship)}</strong></div>
                    <div className="es-info-item"><span>Phone Number</span><strong>{displayValue(primaryEmergencyContact?.phone_number)}</strong></div>
                    <div className="es-info-item"><span>Address</span><strong>{displayValue(primaryEmergencyContact?.address)}</strong></div>
                </div>
                {emergencyContactLoading && <p role="status">Loading emergency contact...</p>}
                {emergencyContactError && <p role="alert">{emergencyContactError}</p>}
            </section>

            
            <section className="es-section-card" id="esAccount">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-purple"><i className="bi bi-shield-lock"></i></div>
                        <div>
                            <h4>Account & Security</h4>
                            <p>Manage your login and account security</p>
                        </div>
                    </div>
                </div>

                <div className="es-security-list">
                    <div className="es-security-row">
                        <div className="es-security-row-icon"><i className="bi bi-envelope-check"></i></div>
                        <div className="es-security-row-content">
                            <strong>Corporate Email</strong>
                            <span>{contactInfo?.work_email || currentUser?.email || "Email not set"}</span>
                        </div>
                        <span className="es-verified-badge">Verified</span>
                    </div>

                    <div className="es-security-row">
                        <div className="es-security-row-icon"><i className="bi bi-key"></i></div>
                        <div className="es-security-row-content">
                            <strong>Password</strong>
                            <span>••••••••</span>
                        </div>
                        <button 
                            className="btn es-edit-btn"
                            type="button"
                            style={EDIT_TRIGGER_STYLE}
                            onMouseEnter={(event) => setEditTriggerHover(event, true)}
                            onMouseLeave={(event) => setEditTriggerHover(event, false)}
                            onClick={() => {
                                setIsPasswordModalOpen(true);
                                setPasswordFeedback("");
                                setPasswordSuccess("");
                                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                            }}
                        >
                            Change
                        </button>
                    </div>

                    <div className="es-security-row">
                        <div className="es-security-row-icon"><i className="bi bi-phone"></i></div>
                        <div className="es-security-row-content">
                            <strong>Multi-Factor Authentication</strong>
                            <span>Extra protection for your account</span>
                        </div>
                        <span className="es-status-active">Enabled</span>
                    </div>

                    <div className="es-security-row">
                        <div className="es-security-row-icon"><i className="bi bi-laptop"></i></div>
                        <div className="es-security-row-content">
                            <strong>Active Sessions</strong>
                            <span>Current browser · Windows · Active Session</span>
                        </div>
                        <button
                            className="btn es-edit-btn"
                            type="button"
                            style={EDIT_TRIGGER_STYLE}
                            onMouseEnter={(event) => setEditTriggerHover(event, true)}
                            onMouseLeave={(event) => setEditTriggerHover(event, false)}
                        >
                            Manage
                        </button>
                    </div>
                </div>
            </section>

            
            <section className="es-section-card" id="esPreferences">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-blue"><i className="bi bi-sliders"></i></div>
                        <div>
                            <h4>Preferences</h4>
                            <p>Personalize your employee workspace</p>
                        </div>
                    </div>
                    <button 
                        className="btn es-edit-btn"
                        type="button"
                        style={EDIT_TRIGGER_STYLE}
                        onMouseEnter={(event) => setEditTriggerHover(event, true)}
                        onMouseLeave={(event) => setEditTriggerHover(event, false)}
                        onClick={savePreferences}
                        disabled={preferencesSaving}
                    >
                        <i className={`bi ${preferencesSaving ? "bi-arrow-repeat" : "bi-check2"}`}></i>
                        {preferencesSaving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>

                {preferencesSuccess && (
                    <div className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ borderRadius: 10, fontSize: 13 }}>
                        <i className="bi bi-check-circle-fill"></i>
                        <span>{preferencesSuccess}</span>
                    </div>
                )}
                {preferencesFeedback && (
                    <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ borderRadius: 10, fontSize: 13 }}>
                        <i className="bi bi-exclamation-circle-fill"></i>
                        <span>{preferencesFeedback}</span>
                    </div>
                )}

                <div className="es-preference-grid">
                    <div className="es-preference-field">
                        <label htmlFor="esLanguage">Language</label>
                        <select 
                            className="form-select" 
                            id="esLanguage"
                            value={preferencesForm.preferredLanguage}
                            onChange={(e) => setPreferencesForm(p => ({ ...p, preferredLanguage: e.target.value }))}
                        >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Telugu">Telugu</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Marathi">Marathi</option>
                        </select>
                    </div>
                    <div className="es-preference-field">
                        <label htmlFor="esDateFormat">Date Format</label>
                        <select 
                            className="form-select" 
                            id="esDateFormat"
                            value={preferencesForm.dateFormat}
                            onChange={(e) => setPreferencesForm(p => ({ ...p, dateFormat: e.target.value }))}
                        >
                            <option value="DD MMM YYYY">DD MMM YYYY (e.g. 27 Oct 2026)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 27/10/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/27/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-27)</option>
                        </select>
                    </div>
                    <div className="es-preference-field">
                        <label htmlFor="esTheme">Appearance</label>
                        <select 
                            className="form-select" 
                            id="esTheme"
                            value={preferencesForm.theme}
                            onChange={(e) => setPreferencesForm(p => ({ ...p, theme: e.target.value }))}
                        >
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="system">System Default</option>
                        </select>
                    </div>
                </div>

                <div className="es-preference-toggles">
                    <div className="es-preference-toggle">
                        <div>
                            <strong>Email Notifications</strong>
                            <p>Receive important updates by email.</p>
                        </div>
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="esEmailNotifications" 
                                checked={preferencesForm.emailNotifications}
                                onChange={(e) => setPreferencesForm(p => ({ ...p, emailNotifications: e.target.checked }))}
                            />
                        </div>
                    </div>
                    <div className="es-preference-toggle">
                        <div>
                            <strong>Push Notifications</strong>
                            <p>Receive updates in your employee workspace.</p>
                        </div>
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="esPushNotifications" 
                                checked={preferencesForm.pushNotifications}
                                onChange={(e) => setPreferencesForm(p => ({ ...p, pushNotifications: e.target.checked }))}
                            />
                        </div>
                    </div>
                    <div className="es-preference-toggle">
                        <div>
                            <strong>Birthday & Work Anniversary Reminders</strong>
                            <p>Get notified about your teammates' special days.</p>
                        </div>
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="esCelebrationNotifications" 
                                checked={preferencesForm.celebrationNotifications}
                                onChange={(e) => setPreferencesForm(p => ({ ...p, celebrationNotifications: e.target.checked }))}
                            />
                        </div>
                    </div>
                </div>
            </section>

            
            <section className="es-section-card" id="esShortcuts">
                <div className="es-section-header">
                    <div className="es-section-title">
                        <div className="es-section-icon es-blue"><i className="bi bi-command"></i></div>
                        <div>
                            <h4>Shortcuts Selection</h4>
                            <p>Personalize your employee dashboard shortcuts</p>
                        </div>
                    </div>
                    
                </div>

                <div className="row g-3">
                    {EMPLOYEE_SHORTCUTS.map((shortcut) => {
                        const isSelected = selectedShortcutIds.includes(shortcut.id);
                        return (
                            <div className="col-xl-3 col-lg-3 col-md-4 col-6 d-flex" key={shortcut.id}>
                                <button
                                    type="button"
                                    className="ed-quick-card flex-fill"
                                    aria-pressed={isSelected}
                                    disabled={shortcutSelectionsLoading || shortcutSelectionsSaving || !currentUser?.id}
                                    onClick={() => toggleShortcutSelection(shortcut.id)}
                                >
                                    <div className="d-flex justify-content-between">
                                        <span className={`ed-quick-icon ed-q-${shortcut.color}`}>
                                            <i className={`bi ${shortcut.icon}`}></i>
                                        </span>
                                        <span aria-hidden="true">
                                            <i
                                                className={`bi ${isSelected ? "bi-star-fill" : "bi-star"}`}
                                                style={isSelected ? { color: "#f08a24" } : undefined}
                                            ></i>
                                        </span>
                                    </div>
                                    <strong>{shortcut.label}</strong>
                                    <small>{shortcut.description}</small>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4" role={shortcutSelectionError ? "alert" : "status"}>
                    {shortcutSelectionError ? (
                        <span className="text-danger">{shortcutSelectionError}</span>
                    ) : shortcutSelectionsLoading ? (
                        <span>Loading saved shortcuts...</span>
                    ) : shortcutSelectionsSaving ? (
                        <span>Saving shortcut selections...</span>
                    ) : (
                        <>
                            <i className="bi bi-info-circle"></i>
                            <strong> Note:</strong> Select up to 6 shortcuts as favourites for quick access.
                        </>
                    )}
                </div>
            </section>

            
            <div className="es-bottom-note">
                <i className="bi bi-info-circle"></i>
                Some information is managed by HR. For corrections to official employment or payroll records, submit a request to HR.
            </div>
        </main>
    </div>
</div>


{isPersonalEditOpen && <div className="modal-backdrop fade show" onClick={() => setIsPersonalEditOpen(false)}></div>}
{isContactEditOpen && <div className="modal-backdrop fade show" onClick={() => setIsContactEditOpen(false)}></div>}
{isBankEditOpen && <div className="modal-backdrop fade show" onClick={closeBankEdit}></div>}
{isIdentityEditOpen && <div className="modal-backdrop fade show" onClick={() => setIsIdentityEditOpen(false)}></div>}
{isEmergencyEditOpen && <div className="modal-backdrop fade show" onClick={() => setIsEmergencyEditOpen(false)}></div>}
{accountRevealModalOpen && <div className="modal-backdrop fade show" onClick={closeAccountRevealModal}></div>}
<div
    className={`modal fade${isPersonalEditOpen ? " show d-block" : ""}`}
    id="esEditModal"
    tabIndex="-1"
    aria-hidden={!isPersonalEditOpen}
    aria-modal={isPersonalEditOpen || undefined}
    role={isPersonalEditOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) setIsPersonalEditOpen(false);
    }}
>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <form id="esEditForm" className="modal-content es-modal-content" onSubmit={submitPersonalEditRequest}>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title" id="esEditTitle">Update Personal Information</h5>
                    <p className="es-modal-subtitle" id="esEditSubtitle">Submit changes to your personal information for review.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsPersonalEditOpen(false)}></button>
            </div>
            <div className="modal-body">
                <div className="row g-3" id="esEditFields">
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditFirstName">First Name</label>
                        <input id="personalEditFirstName" className="form-control" name="firstName" value={personalEditForm.firstName} onChange={updatePersonalEditField} required />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditMiddleName">Middle Name</label>
                        <input id="personalEditMiddleName" className="form-control" name="middleName" value={personalEditForm.middleName} onChange={updatePersonalEditField} placeholder="Enter middle name" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditLastName">Last Name</label>
                        <input id="personalEditLastName" className="form-control" name="lastName" value={personalEditForm.lastName} onChange={updatePersonalEditField} required />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditPreferredName">Preferred Name</label>
                        <input id="personalEditPreferredName" className="form-control" name="preferredName" value={personalEditForm.preferredName} readOnly />
                        <small className="text-muted">Preferred Name follows First Name because it has no separate database field.</small>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditDateOfBirth">Date of Birth</label>
                        <input
                            id="personalEditDateOfBirth"
                            type="date"
                            className="form-control"
                            name="dateOfBirth"
                            value={personalEditForm.dateOfBirth}
                            max={getLatestEligibleDateOfBirth()}
                            onChange={updatePersonalEditField}
                            onClick={(e) => {
                                try { e.currentTarget.showPicker(); } catch (_) {}
                            }}
                            onFocus={(e) => {
                                try { e.currentTarget.showPicker(); } catch (_) {}
                            }}
                            style={{ cursor: "pointer" }}
                        />
                        <small className="text-muted">Employees must be at least 18 years old.</small>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditGender">Gender</label>
                        <select id="personalEditGender" className="form-select" name="gender" value={personalEditForm.gender} onChange={updatePersonalEditField}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditMaritalStatus">Marital Status</label>
                        <select id="personalEditMaritalStatus" className="form-select" name="maritalStatus" value={personalEditForm.maritalStatus} onChange={updatePersonalEditField}>
                            <option value="">Select marital status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditNationality">Nationality</label>
                        <input id="personalEditNationality" className="form-control" name="nationality" value={personalEditForm.nationality} onChange={updatePersonalEditField} />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="personalEditBloodGroup">Blood Group</label>
                        <select id="personalEditBloodGroup" className="form-select" name="bloodGroup" value={personalEditForm.bloodGroup} onChange={updatePersonalEditField}>
                            <option value="">Select blood group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>
                </div>
                <div className="es-security-note mt-3">
                    <i className="bi bi-shield-lock"></i>
                    Changes to sensitive information may require HR verification. Do not enter passwords or account credentials.
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" style={{ minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600 }} onClick={() => setIsPersonalEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn es-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }}>
                    <i className={`bi ${personalEditSubmitting ? "bi-arrow-repeat" : "bi-send"}`}></i>
                    {personalEditSubmitting ? "Submitting..." : "Submit Update Request"}
                </button>
            </div>
            {personalEditFeedback && <p className="px-4 pb-3 mb-0 text-muted" role="status">{personalEditFeedback}</p>}
        </form>
    </div>
</div>

<div
    className={`modal fade${accountRevealModalOpen ? " show d-block" : ""}`}
    id="esAccountRevealModal"
    tabIndex="-1"
    aria-hidden={!accountRevealModalOpen}
    aria-modal={accountRevealModalOpen || undefined}
    role={accountRevealModalOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) closeAccountRevealModal();
    }}
>
    <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content es-modal-content" onSubmit={submitAccountReveal}>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title">Verify Your Password</h5>
                    <p className="es-modal-subtitle">Confirm your identity to reveal your account number.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeAccountRevealModal}></button>
            </div>
            <div className="modal-body">
                <div className="es-edit-field">
                    <label htmlFor="accountRevealPassword">Password</label>
                    <input
                        id="accountRevealPassword"
                        type="password"
                        autoComplete="current-password"
                        className="form-control"
                        value={accountRevealPassword}
                        onChange={(event) => setAccountRevealPassword(event.target.value)}
                        required
                    />
                </div>
                {accountRevealError && <p className="text-danger mt-3 mb-0" role="alert">{accountRevealError}</p>}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" onClick={closeAccountRevealModal}>Cancel</button>
                <button type="submit" className="btn es-btn-primary">
                    {accountRevealLoading ? "Verifying..." : "Reveal Account Number"}
                </button>
            </div>
        </form>
    </div>
</div>

<div
    className={`modal fade${isBankEditOpen ? " show d-block" : ""}`}
    id="esBankEditModal"
    tabIndex="-1"
    aria-hidden={!isBankEditOpen}
    aria-modal={isBankEditOpen || undefined}
    role={isBankEditOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) setIsBankEditOpen(false);
    }}
>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <form className="modal-content es-modal-content" onSubmit={submitBankEdit} noValidate>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title">Request Bank Details Update</h5>
                    <p className="es-modal-subtitle">Submit your new bank details for HR and payroll verification.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeBankEdit}></button>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditName">Bank Name</label>
                        <input id="bankEditName" className="form-control" name="bankName" value={bankEditForm.bankName} onChange={updateBankEditField} maxLength="150" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditHolder">Account Holder Name</label>
                        <input id="bankEditHolder" className="form-control" name="accountHolderName" value={bankEditForm.accountHolderName} onChange={updateBankEditField} maxLength="150" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditAccount">Account Number</label>
                        <input id="bankEditAccount" type="password" inputMode="numeric" autoComplete="off" className="form-control" name="accountNumber" value={bankEditForm.accountNumber} onChange={updateBankEditField} maxLength="16" placeholder="Enter account number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditConfirmAccount">Confirm Account Number</label>
                        <input id="bankEditConfirmAccount" type="text" inputMode="numeric" autoComplete="off" className="form-control" name="confirmAccountNumber" value={bankEditForm.confirmAccountNumber} onChange={updateBankEditField} maxLength="16" placeholder="Enter confirm account number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditIfsc">IFSC Code</label>
                        <input id="bankEditIfsc" className="form-control" name="ifscCode" value={bankEditForm.ifscCode} onChange={updateBankEditField} maxLength="20" placeholder="Enter IFSC code" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditBranch">Branch Name</label>
                        <input id="bankEditBranch" className="form-control" name="branchName" value={bankEditForm.branchName} onChange={updateBankEditField} maxLength="100" placeholder="Enter branch name" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditType">Account Type</label>
                        <select id="bankEditType" className="form-select" name="accountType" value={bankEditForm.accountType} onChange={updateBankEditField}>
                            <option value="Salary / Savings">Salary / Savings</option>
                            <option value="Savings">Savings</option>
                            <option value="Current">Current</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="bankEditReason">Reason for Change</label>
                        <textarea id="bankEditReason" className="form-control" name="reason" value={bankEditForm.reason} onChange={updateBankEditField} rows="3" maxLength="2000" placeholder="Enter reason for change"></textarea>
                    </div>
                </div>
                <div className="es-security-note mt-3">
                    <i className="bi bi-shield-lock"></i>
                    Changes will require HR verification before the bank details are marked verified.
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" onClick={closeBankEdit}>Cancel</button>
                <button type="submit" className="btn es-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }}>
                    <i className={`bi ${bankEditSubmitting ? "bi-arrow-repeat" : "bi-send"}`}></i>
                    {bankEditSubmitting ? "Submitting..." : "Submit Update Request"}
                </button>
            </div>
            {bankEditFeedback && <p className="px-4 pb-3 mb-0 text-danger" role="alert">{bankEditFeedback}</p>}
        </form>
    </div>
</div>

<div
    className={`modal fade${isContactEditOpen ? " show d-block" : ""}`}
    id="esContactEditModal"
    tabIndex="-1"
    aria-hidden={!isContactEditOpen}
    aria-modal={isContactEditOpen || undefined}
    role={isContactEditOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) setIsContactEditOpen(false);
    }}
>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <form className="modal-content es-modal-content" onSubmit={submitContactEdit} noValidate>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title">Update Contact Information</h5>
                    <p className="es-modal-subtitle">Keep your contact details and addresses up to date.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsContactEditOpen(false)}></button>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    {/* <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditWorkEmail">Work Email</label>
                        <input id="contactEditWorkEmail" type="email" className="form-control" name="workEmail" value={contactEditForm.workEmail} onChange={updateContactEditField} />
                    </div> */}
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPersonalEmail">Personal Email</label>
                        <input id="contactEditPersonalEmail" type="email" className="form-control" name="personalEmail" value={contactEditForm.personalEmail} onChange={updateContactEditField} placeholder="Enter personal email" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditMobile">Mobile Number</label>
                        <input id="contactEditMobile" type="tel" inputMode="numeric" className="form-control" name="mobile" value={contactEditForm.mobile} onChange={updateContactEditField} placeholder="Enter mobile number" maxlength="10" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditAlternatePhone">Alternate Phone</label>
                        <input id="contactEditAlternatePhone" type="tel" inputMode="numeric" className="form-control" name="alternatePhone" value={contactEditForm.alternatePhone} onChange={updateContactEditField} placeholder="Enter alternate phone" maxlength="10" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditCurrentAddress">Current Address</label>
                        <input id="contactEditCurrentAddress" className="form-control" name="currentAddress" value={contactEditForm.currentAddress} onChange={updateContactEditField} placeholder="Enter current address" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditCurrentCity">Current City</label>
                        <input id="contactEditCurrentCity" className="form-control" name="currentCity" value={contactEditForm.currentCity} onChange={updateContactEditField} placeholder="Enter current city" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditCurrentState">Current State</label>
                        <input id="contactEditCurrentState" className="form-control" name="currentState" value={contactEditForm.currentState} onChange={updateContactEditField} placeholder="Enter current state" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditCurrentPostalCode">Current Postal Code</label>
                        <input id="contactEditCurrentPostalCode" inputMode="numeric" className="form-control" name="currentPostalCode" value={contactEditForm.currentPostalCode} onChange={updateContactEditField} placeholder="Enter current postal code" maxlength="6" />
                    </div>
                    {/* <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditCurrentCountry">Current Country</label>
                        <input id="contactEditCurrentCountry" className="form-control" name="currentCountry" value={contactEditForm.currentCountry} onChange={updateContactEditField} placeholder="Enter current country" />
                    </div> */}
                    <div className="col-12 es-edit-field es-edit-checkbox-field">
                        <div className="form-check">
                            <input id="contactEditSameAddress" type="checkbox" className="form-check-input" name="sameAsCurrentAddress" checked={contactEditForm.sameAsCurrentAddress} onChange={updateContactEditField} />
                            <label className="form-check-label" htmlFor="contactEditSameAddress">Permanent address is same as current address</label>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPermanentAddress">Permanent Address</label>
                        <input id="contactEditPermanentAddress" className="form-control" name="permanentAddress" value={contactEditForm.permanentAddress} onChange={updateContactEditField} disabled={contactEditForm.sameAsCurrentAddress} placeholder="Enter permanent address" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPermanentCity">Permanent City</label>
                        <input id="contactEditPermanentCity" className="form-control" name="permanentCity" value={contactEditForm.permanentCity} onChange={updateContactEditField} disabled={contactEditForm.sameAsCurrentAddress} placeholder="Enter permanent city" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPermanentState">Permanent State</label>
                        <input id="contactEditPermanentState" className="form-control" name="permanentState" value={contactEditForm.permanentState} onChange={updateContactEditField} disabled={contactEditForm.sameAsCurrentAddress} placeholder="Enter permanent state" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPermanentPostalCode">Permanent Postal Code</label>
                        <input id="contactEditPermanentPostalCode" className="form-control" name="permanentPostalCode" value={contactEditForm.permanentPostalCode} onChange={updateContactEditField} disabled={contactEditForm.sameAsCurrentAddress} placeholder="Enter permanent postal code" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="contactEditPermanentCountry">Permanent Country</label>
                        <input id="contactEditPermanentCountry" className="form-control" name="permanentCountry" value={contactEditForm.permanentCountry} onChange={updateContactEditField} disabled={contactEditForm.sameAsCurrentAddress} placeholder="Enter permanent country" />
                    </div>
                </div>
                <div className="es-security-note mt-3">
                    <i className="bi bi-shield-lock"></i>
                    Contact updates are saved to your employee profile.
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" onClick={() => setIsContactEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn es-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }} disabled={contactEditSubmitting}>
                    <i className={`bi ${contactEditSubmitting ? "bi-arrow-repeat" : "bi-check-lg"}`}></i>
                    {contactEditSubmitting ? "Saving..." : "Save Changes"}
                </button>
            </div>
            {contactEditFeedback && <p className="px-4 pb-3 mb-0 text-danger" role="alert">{contactEditFeedback}</p>}
        </form>
    </div>
</div>


<div
    className={`modal fade${isIdentityEditOpen ? " show d-block" : ""}`}
    id="esIdentityEditModal"
    tabIndex="-1"
    aria-hidden={!isIdentityEditOpen}
    aria-modal={isIdentityEditOpen || undefined}
    role={isIdentityEditOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) setIsIdentityEditOpen(false);
    }}
>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <form className="modal-content es-modal-content" onSubmit={submitIdentityEdit} noValidate>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title">Request Identity Information Update</h5>
                    <p className="es-modal-subtitle">Submit identity corrections for HR verification.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsIdentityEditOpen(false)}></button>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="identityEditAadhaar">Aadhaar Number</label>
                        <input id="identityEditAadhaar" className="form-control" name="aadhaarNumber" value={identityEditForm.aadhaarNumber} onFocus={focusIdentityNumberField} onChange={updateIdentityEditField} inputMode="numeric" maxLength="20" placeholder="Enter aadhaar number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="identityEditPan">PAN Number</label>
                        <input id="identityEditPan" className="form-control" name="panNumber" value={identityEditForm.panNumber} onFocus={focusIdentityNumberField} onChange={updateIdentityEditField} maxLength="20" placeholder="Enter PAN number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="identityEditPassport">Passport Number</label>
                        <input id="identityEditPassport" className="form-control" name="passportNumber" value={identityEditForm.passportNumber} onFocus={focusIdentityNumberField} onChange={updateIdentityEditField} maxLength="30" placeholder="Enter passport number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="identityEditUan">UAN Number</label>
                        <input id="identityEditUan" type="text" inputMode="numeric" className="form-control" name="uanNumber" value={identityEditForm.uanNumber} onFocus={focusIdentityNumberField} onChange={updateIdentityEditField} maxLength="12" placeholder="Enter UAN number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="identityEditReason">Reason for Change</label>
                        <textarea id="identityEditReason" className="form-control" name="reason" value={identityEditForm.reason} onChange={updateIdentityEditField} rows="3" maxLength="2000" placeholder="Enter reason for change"></textarea>
                    </div>
                </div>
                <div className="es-security-note mt-3">
                    <i className="bi bi-shield-lock"></i>
                    <span>Identity details will require HR verification. Focus a masked number to replace it.</span>
                </div>
                {identityEditFeedback && <p className="text-danger mt-3 mb-0" role="alert">{identityEditFeedback}</p>}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" onClick={() => setIsIdentityEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn es-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }} disabled={identityEditSubmitting}>
                    <i className={`bi ${identityEditSubmitting ? "bi-arrow-repeat" : "bi-send"}`}></i>
                    {identityEditSubmitting ? "Submitting..." : "Submit Update Request"}
                </button>
            </div>
        </form>
    </div>
</div>

<div
    className={`modal fade${isEmergencyEditOpen ? " show d-block" : ""}`}
    id="esEmergencyEditModal"
    tabIndex="-1"
    aria-hidden={!isEmergencyEditOpen}
    aria-modal={isEmergencyEditOpen || undefined}
    role={isEmergencyEditOpen ? "dialog" : undefined}
    onClick={(event) => {
        if (event.target === event.currentTarget) setIsEmergencyEditOpen(false);
    }}
>
    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <form className="modal-content es-modal-content" onSubmit={handleEmergencyEditSubmit}>
            <div className="modal-header">
                <div>
                    <h5 className="modal-title">Update Emergency Contact</h5>
                    <p className="es-modal-subtitle">Keep your emergency contact information current.</p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsEmergencyEditOpen(false)}></button>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    <div className="col-12 es-edit-section-heading">
                        <h6>Primary Emergency Contact (Mandatory)</h6>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditName">Contact Name</label>
                        <input id="emergencyEditName" className="form-control" name="contactName" value={emergencyEditForm.contactName} onChange={updateEmergencyEditField} maxLength="150" placeholder="Enter contact name" required />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditRelationship">Relationship</label>
                        <select id="emergencyEditRelationship" className="form-select" name="relationship" value={emergencyEditForm.relationship} onChange={updateEmergencyEditField} required>
                            <option value="">Select relationship</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditPhone">Phone Number</label>
                        <input id="emergencyEditPhone" type="tel" className="form-control" name="phoneNumber" value={emergencyEditForm.phoneNumber} onChange={updateEmergencyEditField} maxLength="25" placeholder="Enter phone number" required />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditAddress">Address</label>
                        <input id="emergencyEditAddress" className="form-control" name="address" value={emergencyEditForm.address} onChange={updateEmergencyEditField} placeholder="Enter address" />
                    </div>
                    <div className="col-12 es-edit-section-heading">
                        <h6>Second Emergency Contact (Optional)</h6>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditSecondName">Contact Name</label>
                        <input id="emergencyEditSecondName" className="form-control" name="secondContactName" value={emergencyEditForm.secondContactName} onChange={updateEmergencyEditField} maxLength="150" placeholder="Enter contact name" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditSecondRelationship">Relationship</label>
                        <select id="emergencyEditSecondRelationship" className="form-select" name="secondRelationship" value={emergencyEditForm.secondRelationship} onChange={updateEmergencyEditField}>
                            <option value="">Select relationship</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditSecondPhone">Phone Number</label>
                        <input id="emergencyEditSecondPhone" type="tel" className="form-control" name="secondPhoneNumber" value={emergencyEditForm.secondPhoneNumber} onChange={updateEmergencyEditField} maxLength="25" placeholder="Enter phone number" />
                    </div>
                    <div className="col-12 col-md-6 es-edit-field">
                        <label htmlFor="emergencyEditSecondAddress">Address</label>
                        <textarea id="emergencyEditSecondAddress" className="form-control" name="secondAddress" value={emergencyEditForm.secondAddress} onChange={updateEmergencyEditField} rows="3" placeholder="Enter address"></textarea>
                    </div>
                </div>
                <div className="es-security-note mt-3">
                    <i className="bi bi-shield-lock"></i>
                    <span>Emergency contact updates are managed by HR.</span>
                </div>
                {emergencyEditFeedback && <p className="text-danger mt-3 mb-0" role="alert">{emergencyEditFeedback}</p>}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn es-btn-light" onClick={() => setIsEmergencyEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn es-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "11px 16px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }} disabled={emergencyEditSubmitting}>
                    {emergencyEditSubmitting ? "Saving..." : "Submit Update Request"}
                </button>
            </div>
        </form>
    </div>
</div>

            {/* Shortcut Limit Toast Alert */}
            {shortcutLimitToast && (
                <div 
                    className="position-fixed top-0 start-50 translate-middle-x mt-4 shadow-lg rounded-4 p-3 d-flex align-items-center gap-3 animate__animated animate__fadeInDown"
                    style={{ 
                        zIndex: 10500, 
                        minWidth: 360, 
                        maxWidth: 520, 
                        backgroundColor: "#fff9f0", 
                        border: "1.5px solid #ffcc80",
                        boxShadow: "0 14px 40px rgba(240, 138, 36, 0.22)"
                    }}
                >
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: 42, height: 42, backgroundColor: "#ffe0b2", color: "#b76e00" }}
                    >
                        <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    </div>
                    <div className="flex-grow-1">
                        <strong className="d-block text-dark" style={{ fontSize: 14 }}>Maximum 6 Shortcuts Allowed</strong>
                        <span className="text-secondary" style={{ fontSize: 12 }}>
                            You have reached the maximum limit of 6 shortcuts. Please unselect an existing shortcut before selecting a new one.
                        </span>
                    </div>
                    <button 
                        type="button" 
                        className="btn-close flex-shrink-0" 
                        aria-label="Close" 
                        onClick={() => setShortcutLimitToast(false)}
                    ></button>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-backdrop fade show" onClick={() => setIsPasswordModalOpen(false)}></div>
            )}
            <div
                className={`modal fade${isPasswordModalOpen ? " show d-block" : ""}`}
                id="esPasswordModal"
                tabIndex="-1"
                aria-hidden={!isPasswordModalOpen}
                aria-modal={isPasswordModalOpen || undefined}
                role={isPasswordModalOpen ? "dialog" : undefined}
                onClick={(event) => {
                    if (event.target === event.currentTarget) setIsPasswordModalOpen(false);
                }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <form className="modal-content es-modal-content" onSubmit={submitPasswordChange} noValidate>
                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title">Change Password</h5>
                                <p className="es-modal-subtitle">Update your password to keep your account secure.</p>
                            </div>
                            <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsPasswordModalOpen(false)}></button>
                        </div>
                        <div className="modal-body">
                            {passwordSuccess && (
                                <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3" role="alert" style={{ borderRadius: 10, fontSize: 13 }}>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span>{passwordSuccess}</span>
                                </div>
                            )}
                            {passwordFeedback && (
                                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3" role="alert" style={{ borderRadius: 10, fontSize: 13 }}>
                                    <i className="bi bi-exclamation-circle-fill"></i>
                                    <span>{passwordFeedback}</span>
                                </div>
                            )}
                            <div>
                                <div className="mb-3">
                                    <label className="form-label text-xs fw-semibold mb-1" htmlFor="currentPassword">Current Password <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Enter current password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-xs fw-semibold mb-1" htmlFor="newPassword">New Password <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Enter at least 6 characters"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                    </div>
                                    <span className="text-muted" style={{ fontSize: 11 }}>Minimum 6 characters.</span>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-xs fw-semibold mb-1" htmlFor="confirmPassword">Confirm New Password <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Re-enter new password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn es-btn-light" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                            <button
                                type="submit"
                                className="btn es-btn-primary"
                                disabled={passwordSubmitting}
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, padding: "10px 18px", borderRadius: 12, fontWeight: 600, backgroundColor: "#3c2fbc", borderColor: "#3c2fbc", color: "#fff" }}
                            >
                                <i className={`bi ${passwordSubmitting ? "bi-arrow-repeat" : "bi-shield-check"}`}></i>
                                {passwordSubmitting ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="es-toast" id="esToast">
                <div className="es-toast-icon"><i className="bi bi-check-lg"></i></div>
                <div>
                    <strong id="esToastTitle">Success</strong>
                    <p id="esToastMessage">Action completed.</p>
                </div>
                <button><i className="bi bi-x-lg"></i></button>
            </div>

            </div>
    </>
  );
}
