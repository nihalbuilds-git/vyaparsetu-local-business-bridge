import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "hi";

const translations = {
  en: {
    // Nav
    dashboard: "Dashboard",
    workers: "Workers",
    attendance: "Attendance",
    salary: "Salary",
    aiCampaigns: "AI Campaigns",
    profile: "Profile",
    signOut: "Sign Out",

    // Index
    heroTagline: "The simplest business tool for local Indian shopkeepers. Manage workers, attendance, salary & more.",
    getStarted: "Get Started",
    workersManagement: "Workers Management",
    workersManagementDesc: "Add, edit and manage your team easily",
    dailyAttendance: "Daily Attendance",
    dailyAttendanceDesc: "Mark attendance with one tap",
    salaryCalculator: "Salary Calculator",
    salaryCalculatorDesc: "Auto-calculate monthly wages",
    aiCampaignsFeature: "AI Campaigns",
    aiCampaignsDesc: "Generate marketing messages with AI",

    // Login
    signInWithPhone: "Sign in with Phone",
    verifyOtp: "Verify OTP",
    logIn: "Log in to your account",
    createAccount: "Create your account",
    otpSmsHint: "We'll send a 6-digit OTP via SMS",
    enterCodeHint: "Enter the code sent to your phone",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    phoneNumber: "Phone Number",
    phonePlaceholder: "Enter 10-digit mobile number",
    sendOtp: "Send OTP",
    sendingOtp: "Sending OTP...",
    verificationCode: "Verification Code",
    otpPlaceholder: "Enter 6-digit OTP",
    verifyAndLogin: "Verify & Login",
    verifying: "Verifying...",
    changePhone: "← Change phone number",
    pleaseWait: "Please wait...",
    forgotPassword: "Forgot password?",
    orContinueWith: "Or continue with",
    continueWithGoogle: "Continue with Google",
    phoneOtp: "Phone OTP",

    // Dashboard
    welcome: "Welcome",
    totalWorkers: "Total Workers",
    todaysAttendance: "Today's Attendance",
    thisMonthSalary: "This Month Salary",
    totalCampaigns: "Total Campaigns",
    campaignHistory: "Campaign History",

    // Workers page
    manageTeam: "Manage your team",
    addWorker: "Add Worker",
    editWorker: "Edit Worker",
    name: "Name",
    phone: "Phone",
    role: "Role",
    dailySalary: "Daily Salary",
    dailySalaryRs: "Daily Salary (₹)",
    save: "Save",
    saving: "Saving...",
    noWorkersYet: "No workers added yet",
    nameRequired: "Name is required",
    validSalary: "Enter a valid salary",
    validPhone: "Enter a 10-digit phone number",
    workerUpdated: "Worker updated",
    workerAdded: "Worker added",
    workerRemoved: "Worker removed",
    removeWorker: "Remove Worker?",
    removeWorkerDesc: "Are you sure you want to delete \"{name}\"? This will also remove their attendance records. This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    tapToUpload: "Tap to upload photo",
    fileTooLarge: "File too large",
    maxFileSize: "Max 2MB allowed",
    noRole: "No role",
    workerNamePlaceholder: "Worker's name",
    phonePlaceholder10: "10 digit number",
    rolePlaceholder: "e.g. Helper, Driver",

    // Attendance
    today: "Today",
    calendarView: "Calendar View",
    markAllPresent: "Mark All Present",
    present: "Present",
    absent: "Absent",
    halfDay: "Half Day",
    tapToSet: "Tap to set",
    addWorkersFirst: "Add workers first to mark attendance",
    attendanceSaved: "Attendance saved successfully!",
    worker: "Worker",

    // Attendance Calendar
    attendanceCalendar: "Attendance Calendar",
    monthlyOverview: "Monthly attendance overview",
    allWorkers: "All Workers",
    addWorkersCalendar: "Add workers first to view attendance calendar",

    // Salary
    monthlySalaryBreakdown: "Monthly salary breakdown",
    totalPayable: "Total Payable",
    workers_count: "workers",
    addWorkersForSalary: "Add workers to calculate salaries",
    presentDays: "Present",
    halfDays: "Half Day",
    dailyRate: "Daily Rate",
    exportPdf: "Export PDF",
    whatsApp: "WhatsApp",
    pdfDownloaded: "PDF Downloaded",
    salarySlipDownloaded: "Salary slip for {name} has been downloaded.",
    salarySlip: "Salary Slip",
    month: "Month",
    workerName: "Worker Name",
    totalDaysInMonth: "Total Days in Month",
    absentDays: "Absent Days",
    dailySalaryBase: "Daily Salary (Base)",
    finalSalary: "Final Salary",
    generatedOn: "Generated on",

    // Campaigns
    generateMarketing: "Generate marketing messages for your business",
    campaignType: "Campaign Type",
    offerPromotion: "Offer / Promotion",
    offerPlaceholder: "e.g. 20% off on all grocery items this weekend",
    generateCampaign: "Generate Campaign ✨",
    generating: "Generating...",
    setupBusinessFirst: "Please set up your business profile first",
    enterOffer: "Please enter an offer",
    marketingMessage: "Marketing Message",
    imagePrompt: "Image Prompt",
    posterPreview: "Poster Preview",
    posterPlaceholder: "🖼️ AI-generated poster will appear here",
    copy: "Copy",
    copiedToClipboard: "Copied to clipboard!",

    // Campaign History
    viewPastCampaigns: "View all your past campaigns",
    noCampaignsYet: "No campaigns created yet",
    campaignDetails: "Campaign Details",
    created: "Created",
    noMessage: "No message",
    view: "View",

    // Profile
    businessProfile: "Business Profile",
    enterShopDetails: "Enter your shop details",
    shopName: "Shop Name",
    address: "Address",
    category: "Category",
    shopNameRequired: "Shop name is required",
    selectCategory: "Please select a category",
    profileSaved: "Profile saved successfully!",
    shopNamePlaceholder: "My Shop",
    addressPlaceholder: "Shop location",
    selectCategoryPlaceholder: "Select a category",

    // Reset Password
    resetPassword: "Reset Password",
    passwordUpdated: "Your password has been updated",
    enterNewPassword: "Enter your new password below",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    atLeast6Chars: "At least 6 characters",
    reEnterPassword: "Re-enter your password",
    updatePassword: "Update Password",
    updating: "Updating...",
    redirecting: "Redirecting to dashboard...",
    resetLinkInfo: "This page is accessed via the password reset link sent to your email. If you haven't requested a reset, go back to login.",
    backToLogin: "Back to Login",

    // Onboarding
    welcomeVyaparSetu: "Welcome to VyaparSetu! 🎉",
    letsSetup: "Let's set up your business first",
    businessProfileStep: "Business Profile",
    firstWorkerStep: "First Worker",
    allSetStep: "All Set!",
    addFirstWorker: "Add Your First Worker 👷",
    addMoreLater: "You can always add more later",
    workerNameRequired: "Worker name is required",
    continue: "Continue",
    back: "Back",
    skipForNow: "Skip for now",
    youreAllSet: "You're All Set! 🚀",
    businessReady: "Your business is ready. Head to the dashboard to start managing your team.",
    goToDashboard: "Go to Dashboard",

    // Toasts
    error: "Error",
    otpSent: "OTP sent!",
    checkSms: "Check SMS on {phone}",
    validPhoneNumber: "Enter a valid phone number",
    validOtp: "Enter a valid 6-digit OTP",
    verificationFailed: "Verification failed",
    fillAllFields: "Fill in all fields",
    accountCreated: "Account created!",
    verifyEmail: "Check your email to verify, then log in.",
    googleSignInFailed: "Google sign-in failed",
    enterEmailFirst: "Enter your email first",
    resetLinkSent: "Reset link sent!",
    checkInbox: "Check your email inbox.",
    uploadFailed: "Upload failed",
    passwordMin6: "Password must be at least 6 characters",
    passwordsMismatch: "Passwords do not match",
    passwordUpdatedSuccess: "Password updated successfully!",

    // Language
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
  },
  hi: {
    // Nav
    dashboard: "डैशबोर्ड",
    workers: "कर्मचारी",
    attendance: "उपस्थिति",
    salary: "वेतन",
    aiCampaigns: "AI अभियान",
    profile: "प्रोफ़ाइल",
    signOut: "लॉग आउट",

    // Index
    heroTagline: "स्थानीय भारतीय दुकानदारों के लिए सबसे आसान बिज़नेस टूल। कर्मचारी, उपस्थिति, वेतन और बहुत कुछ प्रबंधित करें।",
    getStarted: "शुरू करें",
    workersManagement: "कर्मचारी प्रबंधन",
    workersManagementDesc: "अपनी टीम को आसानी से जोड़ें, संपादित करें और प्रबंधित करें",
    dailyAttendance: "दैनिक उपस्थिति",
    dailyAttendanceDesc: "एक टैप से उपस्थिति लगाएं",
    salaryCalculator: "वेतन कैलकुलेटर",
    salaryCalculatorDesc: "मासिक वेतन की स्वचालित गणना",
    aiCampaignsFeature: "AI अभियान",
    aiCampaignsDesc: "AI से मार्केटिंग संदेश बनाएं",

    // Login
    signInWithPhone: "फ़ोन से साइन इन करें",
    verifyOtp: "OTP सत्यापित करें",
    logIn: "अपने अकाउंट में लॉग इन करें",
    createAccount: "अपना अकाउंट बनाएं",
    otpSmsHint: "हम SMS द्वारा 6 अंकों का OTP भेजेंगे",
    enterCodeHint: "अपने फ़ोन पर भेजा गया कोड दर्ज करें",
    dontHaveAccount: "अकाउंट नहीं है?",
    alreadyHaveAccount: "पहले से अकाउंट है?",
    signUp: "साइन अप",
    signIn: "साइन इन",
    email: "ईमेल",
    password: "पासवर्ड",
    phoneNumber: "फ़ोन नंबर",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें",
    sendOtp: "OTP भेजें",
    sendingOtp: "OTP भेज रहे हैं...",
    verificationCode: "सत्यापन कोड",
    otpPlaceholder: "6 अंकों का OTP दर्ज करें",
    verifyAndLogin: "सत्यापित करें और लॉगिन करें",
    verifying: "सत्यापित कर रहे हैं...",
    changePhone: "← फ़ोन नंबर बदलें",
    pleaseWait: "कृपया प्रतीक्षा करें...",
    forgotPassword: "पासवर्ड भूल गए?",
    orContinueWith: "या इससे जारी रखें",
    continueWithGoogle: "Google से जारी रखें",
    phoneOtp: "फ़ोन OTP",

    // Dashboard
    welcome: "स्वागत है",
    totalWorkers: "कुल कर्मचारी",
    todaysAttendance: "आज की उपस्थिति",
    thisMonthSalary: "इस महीने का वेतन",
    totalCampaigns: "कुल अभियान",
    campaignHistory: "अभियान इतिहास",

    // Workers page
    manageTeam: "अपनी टीम प्रबंधित करें",
    addWorker: "कर्मचारी जोड़ें",
    editWorker: "कर्मचारी संपादित करें",
    name: "नाम",
    phone: "फ़ोन",
    role: "भूमिका",
    dailySalary: "दैनिक वेतन",
    dailySalaryRs: "दैनिक वेतन (₹)",
    save: "सेव करें",
    saving: "सेव हो रहा है...",
    noWorkersYet: "अभी तक कोई कर्मचारी नहीं जोड़ा गया",
    nameRequired: "नाम आवश्यक है",
    validSalary: "एक मान्य वेतन दर्ज करें",
    validPhone: "10 अंकों का फ़ोन नंबर दर्ज करें",
    workerUpdated: "कर्मचारी अपडेट किया गया",
    workerAdded: "कर्मचारी जोड़ा गया",
    workerRemoved: "कर्मचारी हटाया गया",
    removeWorker: "कर्मचारी हटाएं?",
    removeWorkerDesc: "क्या आप वाकई \"{name}\" को हटाना चाहते हैं? इससे उनके उपस्थिति रिकॉर्ड भी हट जाएंगे। यह क्रिया पूर्ववत नहीं की जा सकती।",
    cancel: "रद्द करें",
    delete: "हटाएं",
    tapToUpload: "फ़ोटो अपलोड करने के लिए टैप करें",
    fileTooLarge: "फ़ाइल बहुत बड़ी है",
    maxFileSize: "अधिकतम 2MB अनुमत है",
    noRole: "कोई भूमिका नहीं",
    workerNamePlaceholder: "कर्मचारी का नाम",
    phonePlaceholder10: "10 अंकों का नंबर",
    rolePlaceholder: "जैसे हेल्पर, ड्राइवर",

    // Attendance
    today: "आज",
    calendarView: "कैलेंडर दृश्य",
    markAllPresent: "सभी को उपस्थित करें",
    present: "उपस्थित",
    absent: "अनुपस्थित",
    halfDay: "आधा दिन",
    tapToSet: "सेट करने के लिए टैप करें",
    addWorkersFirst: "उपस्थिति लगाने के लिए पहले कर्मचारी जोड़ें",
    attendanceSaved: "उपस्थिति सफलतापूर्वक सेव हो गई!",
    worker: "कर्मचारी",

    // Attendance Calendar
    attendanceCalendar: "उपस्थिति कैलेंडर",
    monthlyOverview: "मासिक उपस्थिति अवलोकन",
    allWorkers: "सभी कर्मचारी",
    addWorkersCalendar: "उपस्थिति कैलेंडर देखने के लिए पहले कर्मचारी जोड़ें",

    // Salary
    monthlySalaryBreakdown: "मासिक वेतन विवरण",
    totalPayable: "कुल देय",
    workers_count: "कर्मचारी",
    addWorkersForSalary: "वेतन गणना के लिए कर्मचारी जोड़ें",
    presentDays: "उपस्थित",
    halfDays: "आधा दिन",
    dailyRate: "दैनिक दर",
    exportPdf: "PDF डाउनलोड",
    whatsApp: "WhatsApp",
    pdfDownloaded: "PDF डाउनलोड हो गई",
    salarySlipDownloaded: "{name} की वेतन पर्ची डाउनलोड हो गई।",
    salarySlip: "वेतन पर्ची",
    month: "महीना",
    workerName: "कर्मचारी का नाम",
    totalDaysInMonth: "महीने में कुल दिन",
    absentDays: "अनुपस्थित दिन",
    dailySalaryBase: "दैनिक वेतन (आधार)",
    finalSalary: "अंतिम वेतन",
    generatedOn: "बनाया गया",

    // Campaigns
    generateMarketing: "अपने बिज़नेस के लिए मार्केटिंग संदेश बनाएं",
    campaignType: "अभियान का प्रकार",
    offerPromotion: "ऑफ़र / प्रमोशन",
    offerPlaceholder: "जैसे इस सप्ताहांत सभी किराने की वस्तुओं पर 20% की छूट",
    generateCampaign: "अभियान बनाएं ✨",
    generating: "बना रहे हैं...",
    setupBusinessFirst: "कृपया पहले अपनी बिज़नेस प्रोफ़ाइल सेट करें",
    enterOffer: "कृपया एक ऑफ़र दर्ज करें",
    marketingMessage: "मार्केटिंग संदेश",
    imagePrompt: "इमेज प्रॉम्प्ट",
    posterPreview: "पोस्टर प्रीव्यू",
    posterPlaceholder: "🖼️ AI-जनित पोस्टर यहाँ दिखाई देगा",
    copy: "कॉपी",
    copiedToClipboard: "क्लिपबोर्ड में कॉपी किया गया!",

    // Campaign History
    viewPastCampaigns: "अपने सभी पिछले अभियान देखें",
    noCampaignsYet: "अभी तक कोई अभियान नहीं बनाया गया",
    campaignDetails: "अभियान विवरण",
    created: "बनाया गया",
    noMessage: "कोई संदेश नहीं",
    view: "देखें",

    // Profile
    businessProfile: "बिज़नेस प्रोफ़ाइल",
    enterShopDetails: "अपनी दुकान का विवरण दर्ज करें",
    shopName: "दुकान का नाम",
    address: "पता",
    category: "श्रेणी",
    shopNameRequired: "दुकान का नाम आवश्यक है",
    selectCategory: "कृपया एक श्रेणी चुनें",
    profileSaved: "प्रोफ़ाइल सफलतापूर्वक सेव हो गई!",
    shopNamePlaceholder: "मेरी दुकान",
    addressPlaceholder: "दुकान का स्थान",
    selectCategoryPlaceholder: "एक श्रेणी चुनें",

    // Reset Password
    resetPassword: "पासवर्ड रीसेट करें",
    passwordUpdated: "आपका पासवर्ड अपडेट हो गया है",
    enterNewPassword: "नीचे अपना नया पासवर्ड दर्ज करें",
    newPassword: "नया पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    atLeast6Chars: "कम से कम 6 अक्षर",
    reEnterPassword: "अपना पासवर्ड दोबारा दर्ज करें",
    updatePassword: "पासवर्ड अपडेट करें",
    updating: "अपडेट हो रहा है...",
    redirecting: "डैशबोर्ड पर जा रहे हैं...",
    resetLinkInfo: "यह पेज आपके ईमेल पर भेजे गए पासवर्ड रीसेट लिंक से एक्सेस किया जाता है। यदि आपने रीसेट का अनुरोध नहीं किया है, तो लॉगिन पर वापस जाएं।",
    backToLogin: "लॉगिन पर वापस जाएं",

    // Onboarding
    welcomeVyaparSetu: "VyaparSetu में आपका स्वागत है! 🎉",
    letsSetup: "पहले अपना बिज़नेस सेट करते हैं",
    businessProfileStep: "बिज़नेस प्रोफ़ाइल",
    firstWorkerStep: "पहला कर्मचारी",
    allSetStep: "तैयार!",
    addFirstWorker: "अपना पहला कर्मचारी जोड़ें 👷",
    addMoreLater: "आप बाद में और जोड़ सकते हैं",
    workerNameRequired: "कर्मचारी का नाम आवश्यक है",
    continue: "जारी रखें",
    back: "वापस",
    skipForNow: "अभी छोड़ें",
    youreAllSet: "आप तैयार हैं! 🚀",
    businessReady: "आपका बिज़नेस तैयार है। अपनी टीम प्रबंधित करने के लिए डैशबोर्ड पर जाएं।",
    goToDashboard: "डैशबोर्ड पर जाएं",

    // Toasts
    error: "त्रुटि",
    otpSent: "OTP भेजा गया!",
    checkSms: "{phone} पर SMS देखें",
    validPhoneNumber: "एक मान्य फ़ोन नंबर दर्ज करें",
    validOtp: "एक मान्य 6 अंकों का OTP दर्ज करें",
    verificationFailed: "सत्यापन विफल",
    fillAllFields: "सभी फ़ील्ड भरें",
    accountCreated: "अकाउंट बनाया गया!",
    verifyEmail: "सत्यापित करने के लिए अपना ईमेल देखें, फिर लॉग इन करें।",
    googleSignInFailed: "Google साइन-इन विफल",
    enterEmailFirst: "पहले अपना ईमेल दर्ज करें",
    resetLinkSent: "रीसेट लिंक भेजा गया!",
    checkInbox: "अपना ईमेल इनबॉक्स देखें।",
    uploadFailed: "अपलोड विफल",
    passwordMin6: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    passwordsMismatch: "पासवर्ड मेल नहीं खाते",
    passwordUpdatedSuccess: "पासवर्ड सफलतापूर्वक अपडेट हो गया!",

    // Language
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("vyaparsetu-lang");
    return (saved === "hi" ? "hi" : "en") as Lang;
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("vyaparsetu-lang", l);
  };

  const t = (key: TranslationKey, replacements?: Record<string, string>): string => {
    let text: string = (translations[lang][key] as string) || (translations.en[key] as string) || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
