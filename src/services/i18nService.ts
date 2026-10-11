/**
 * NagarSetu i18n Localization Service
 * Supports the civic application language switch between English and Kannada,
 * while keeping legacy locale values for compatibility with existing stored data.
 */

import { storageService } from './storageService';

export type SupportedLocale = 'en' | 'kn' | 'hi' | 'mr';

const LOCALE_KEY = 'portal_locale';

interface TranslationMap {
  portalName: string;
  tagline: string;
  smartCity: string;
  citizenPortal: string;
  opsPortal: string;
  adminPortal: string;
  reportIssue: string;
  trackComplaint: string;
  myComplaints: string;
  nearbyIssues: string;
  emergencyHelpline: string;
  notifications: string;
  profile: string;
  transparency: string;
  searchPlaceholder: string;
  goodMorning: string;
  betterCities: string;
  fasterAction: string;
  signIn: string;
  language: string;
  english: string;
  kannada: string;
  selectPortal: string;
  emailAddress: string;
  password: string;
  registerHere: string;
  createAccount: string;
  login: string;
  home: string;
  dashboard: string;
  emergency: string;
  signOut: string;
  helpLine: string;
  officialPortal: string;
  officialMunicipalPortal: string;
  publicLandingHeading: string;
  publicLandingSubtitle: string;
  howItWorks: string;
  howItWorksSubtitle: string;
  commonIssues: string;
  issueCategoryPrompt: string;
  emergencyQuestion: string;
  emergencyAction: string;
  reportTheProblem: string;
  reportTheProblemBody: string;
  municipalDispatch: string;
  municipalDispatchBody: string;
  verifiedResolution: string;
  verifiedResolutionBody: string;
  welcomeCitizen: string;
  welcomeCitizenSubtitle: string;
  activeComplaints: string;
  currentlyInProgress: string;
  resolvedIssues: string;
  repairsCompleted: string;
  recentComplaints: string;
  recentComplaintsSubtitle: string;
  viewAll: string;
  emergencyHelplineCard: string;
  emergencyHelplineCardSubtitle: string;
  accessibilityLabel: string;
  accessibilityNote: string;
  privacyLabel: string;
  privacyNote: string;
}

const TRANSLATIONS: Record<SupportedLocale, TranslationMap> = {
  en: {
    portalName: 'NagarSetu',
    tagline: 'Better Cities. Faster Action.',
    smartCity: 'SMART CITY',
    citizenPortal: 'Citizen Portal',
    opsPortal: 'Ops Field',
    adminPortal: 'Admin Command',
    reportIssue: '+ Report an Issue',
    trackComplaint: 'Track Complaint',
    myComplaints: 'My Complaints',
    nearbyIssues: 'Nearby Issues',
    emergencyHelpline: 'Emergency 24/7',
    notifications: 'Notifications',
    profile: 'Citizen Profile',
    transparency: 'Transparency Gallery',
    searchPlaceholder: 'Search complaints, tokens, locations...',
    goodMorning: 'Good morning',
    betterCities: 'Better Cities.',
    fasterAction: 'Faster Action.',
    signIn: 'Sign In',
    language: 'Language',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    selectPortal: 'Select your portal',
    emailAddress: 'Email address',
    password: 'Password',
    registerHere: 'Register here',
    createAccount: 'Create Citizen Account',
    login: 'Sign In',
    home: 'Home',
    dashboard: 'Dashboard',
    emergency: 'Emergency Assistance',
    signOut: 'Sign Out',
    helpLine: 'Citizen Helpline',
    officialPortal: 'Official Municipal Portal',
    officialMunicipalPortal: 'Official Municipal Portal',
    publicLandingHeading: 'Better Cities. Faster Action.',
    publicLandingSubtitle: 'Report civic issues directly to your municipal team and track repairs in real time.',
    howItWorks: 'How NagarSetu Works',
    howItWorksSubtitle: 'Three simple steps from filing to verified repair.',
    commonIssues: 'Common Issues to Report',
    issueCategoryPrompt: 'Select any category to quickly submit a report.',
    emergencyQuestion: 'Emergency?',
    emergencyAction: 'Dial 112 or Call 1913 Helpline',
    reportTheProblem: 'Report the Problem',
    reportTheProblemBody: 'Choose the issue category, take an optional photo, and confirm your location.',
    municipalDispatch: 'Municipal Dispatch',
    municipalDispatchBody: 'Your report is routed immediately to the assigned local ward repair crew.',
    verifiedResolution: 'Verified Resolution',
    verifiedResolutionBody: 'Track status in real time and verify the repair once work is completed.',
    welcomeCitizen: 'Welcome to NagarSetu',
    welcomeCitizenSubtitle: 'Report local civic issues, track field crew progress, and stay updated on your neighbourhood.',
    activeComplaints: 'Active Complaints',
    currentlyInProgress: 'Currently in progress',
    resolvedIssues: 'Resolved Issues',
    repairsCompleted: 'Repairs completed',
    recentComplaints: 'Your Recent Complaints',
    recentComplaintsSubtitle: 'Track the status of reports you have submitted.',
    viewAll: 'View All',
    emergencyHelplineCard: 'Emergency Helpline',
    emergencyHelplineCardSubtitle: '24/7 Rapid municipal dispatch',
    accessibilityLabel: 'Accessibility',
    accessibilityNote: 'Keyboard-accessible controls and clear focus states.',
    privacyLabel: 'Privacy',
    privacyNote: 'Your credentials are never stored in the browser.',
  },
  kn: {
    portalName: 'ನಾಗರಸೇತು',
    tagline: 'ಉತ್ತಮ ನಗರಗಳು. ವೇಗದ ನಿರ್ವಹಣೆ.',
    smartCity: 'ಸ್ಮಾರ್ಟ್ ಸಿಟಿ',
    citizenPortal: 'ನಾಗರಿಕ ಪೋರ್ಟಲ್',
    opsPortal: 'ಆಪ್ಸ್ ಫೀಲ್ಡ್',
    adminPortal: 'ಆಡ್ಮಿನ್ ಕಮಾಂಡ್',
    reportIssue: '+ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    trackComplaint: 'ತಕರಾರು ಹ jälە',
    myComplaints: 'ನನ್ನ ದೂರುಗಳು',
    nearbyIssues: 'ಸಮೀಪದ ಸಮಸ್ಯೆಗಳು',
    emergencyHelpline: 'ತುರ್ತು ನೆರವ 24/7',
    notifications: 'ಅಧಿಕೃತಿಗಳು',
    profile: 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್',
    transparency: 'ಪಾರದರ್ಶಕತೆ ಗ್ಯಾಲರಿ',
    searchPlaceholder: 'ದೂರುಗಳು, ಟೋಕನ್‌ಗಳು, ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ...',
    goodMorning: 'ಶುಭೋದಯ',
    betterCities: 'ಉತ್ತಮ ನಗರಗಳು.',
    fasterAction: 'ವೇಗದ ನಿರ್ವಹಣೆ.',
    signIn: 'ಪ್ರವೇಶಿಸಿ',
    language: 'ಭಾಷೆ',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    selectPortal: 'ನಿಮ್ಮ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ',
    emailAddress: 'ಇಮೇಲ್ ವಿಳಾಸ',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    registerHere: 'ಇಲ್ಲಿ ನೋಂದಾಯಿಸಿ',
    createAccount: 'ನಾಗರಿಕ ಖಾತೆ ರಚಿಸಿ',
    login: 'ಪ್ರವೇಶಿಸಿ',
    home: 'ಹೋಂ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    emergency: 'ತುರ್ತು ಸಹಾಯ',
    signOut: 'ಹೊರನಡೆ',
    helpLine: 'ನಾಗರಿಕ ಸಹಾಯವಾಣಿ',
    officialPortal: 'ಅಧಿಕೃತ ಪಾಲಿಕೆ ಪೋರ್ಟಲ್',
    officialMunicipalPortal: 'ಅಧಿಕೃತ ಪಾಲಿಕೆ ಪೋರ್ಟಲ್',
    publicLandingHeading: 'ಉತ್ತಮ ನಗರಗಳು. ವೇಗದ ನಿರ್ವಹಣೆ.',
    publicLandingSubtitle: 'ಸಮಸ್ಯೆಗಳನ್ನು ನೇರವಾಗಿ ಪಾಲಿಕೆ ತಂಡಕ್ಕೆ ವರದಿ ಮಾಡಿ ಮತ್ತು ದುರಸ್ತಿಗಳನ್ನು ನೇರವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    howItWorks: 'ನಾಗರಸೇತು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    howItWorksSubtitle: 'ದೂರು ಸಲ್ಲಿಕೆದಿಂದ ಪರಿಶೀಲಿತ ದುರಸ್ತಿ ವರೆಗೆ ಮೂರು ಸರಳ ಹಂತಗಳು.',
    commonIssues: 'ವರದಿ ಮಾಡಲು ಸಾಮಾನ್ಯ ಸಮಸ್ಯೆಗಳು',
    issueCategoryPrompt: 'ತ್ವರಿತ ವರದಿಗಾಗಿ ಯಾವುದೇ ಶ್ರೇಣಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    emergencyQuestion: 'ತುರ್ತು?',
    emergencyAction: '112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ 1913 ಸಹಾಯವಾಣಿ',
    reportTheProblem: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    reportTheProblemBody: 'ಸಮಸ್ಯೆಯ ವರ್ಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ಐಚ್ಛಿಕ ಫೋಟೋ ಸೇರಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ದೃಢೀಕರಿಸಿ.',
    municipalDispatch: 'ಮ್ಯುನಿಸಿಪಲ್ ಡಿಸ್ಪ್ಯಾಚ್',
    municipalDispatchBody: 'ನಿಮ್ಮ ವರದಿಯನ್ನು ತಕ್ಷಣ ಸ್ಥಳೀಯ ವಾರ್ಡ್ ದುರಸ್ತಿ ತಂಡಕ್ಕೆ ರವಾನಿಸಲಾಗುತ್ತದೆ.',
    verifiedResolution: 'ಪರಿಶೀಲಿಸಿದ ಪರಿಹಾರ',
    verifiedResolutionBody: 'ಸ್ಥಿತಿಯನ್ನು ನಿಜ ಸಮಯದಲ್ಲಿ ಗಮನಿಸಿ ಮತ್ತು ಕೆಲಸ ಪೂರ್ಣಗೊಂಡ ನಂತರ ದುರಸ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
    welcomeCitizen: 'ನಾಗರಸೇತುವಿಗೆ ಸ್ವಾಗತ',
    welcomeCitizenSubtitle: 'ಸ್ಥಳೀಯ civic ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಕ್ಷೇತ್ರ ತಂಡದ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಬಡಾವಣೆಯ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ.',
    activeComplaints: 'ಸಕ್ರಿಯ ದೂರುಗಳು',
    currentlyInProgress: 'ಪ್ರಸ್ತುತ ಪ್ರಗತಿಯಲ್ಲಿವೆ',
    resolvedIssues: 'ಪರಿಹಾರಗೊಂಡ ಸಮಸ್ಯೆಗಳು',
    repairsCompleted: 'ದುಸ್ತರಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
    recentComplaints: 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ ದೂರುಗಳು',
    recentComplaintsSubtitle: 'ನೀವು ಸಲ್ಲಿಸಿದ ವರದಿಗಳ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    emergencyHelplineCard: 'ತುರ್ತು ಸಹಾಯವಾಣಿ',
    emergencyHelplineCardSubtitle: '24/7 ವೇಗದ ಪಾಲಿಕೆ ಡಿಸ್ಪ್ಯಾಚ್',
    accessibilityLabel: 'ಪ್ರವೇಶಸೌಲಭ್ಯ',
    accessibilityNote: 'ಕೀಬೋರ್ಡ್ ಮೂಲಕ ಬಳಸಬಹುದಾದ ನಿಯಂತ್ರಣಗಳು ಮತ್ತು ಸ್ಪಷ್ಟ ಫೋಕಸ್ ಸೂಚನೆಗಳು.',
    privacyLabel: 'ಗೌಪ್ಯತೆ',
    privacyNote: 'ನಿಮ್ಮ ರುಜುವಾತುಗಳನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಎಂದಿಗೂ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.',
  },
  hi: {
    portalName: 'नगरसेतु',
    tagline: 'बेहतर शहर। त्वरित कार्रवाई।',
    smartCity: 'स्मार्ट सिटी',
    citizenPortal: 'नागरिक पोर्टल',
    opsPortal: 'फील्ड ऑप्स',
    adminPortal: 'कमांड सेंटर',
    reportIssue: '+ समस्या दर्ज करें',
    trackComplaint: 'शिकायत ट्रैक करें',
    myComplaints: 'मेरी शिकायतें',
    nearbyIssues: 'आस-पास की समस्याएं',
    emergencyHelpline: 'आपातकालीन सहायता 24/7',
    notifications: 'सूचनाएं',
    profile: 'नागरिक प्रोफाइल',
    transparency: 'पारदर्शिता गैलरी',
    searchPlaceholder: 'शिकायत, टोकन, स्थान खोजें...',
    goodMorning: 'शुभ प्रभात',
    betterCities: 'बेहतर शहर।',
    fasterAction: 'त्वरित कार्रवाई।',
    signIn: 'साइन इन',
    language: 'भाषा',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    selectPortal: 'अपना पोर्टल चुनें',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    registerHere: 'यहाँ रजिस्टर करें',
    createAccount: 'नागरिक खाता बनाएं',
    login: 'साइन इन',
    home: 'मुखपृष्ठ',
    dashboard: 'डैशबोर्ड',
    emergency: 'आपातकालीन सहायता',
    signOut: 'साइन आउट',
    helpLine: 'नागरिक हेल्पलाइन',
    officialPortal: 'अधिकृत नगरपालिका पोर्टल',
    officialMunicipalPortal: 'अधिकृत नगरपालिका पोर्टल',
    publicLandingHeading: 'बेहतर शहर। त्वरित कार्रवाई।',
    publicLandingSubtitle: 'अपने नगर निकाय की टीम को नागरिक समस्याएँ सीधे रिपोर्ट करें और मरम्मत की स्थिति ट्रैक करें।',
    howItWorks: 'नगरसेतु कैसे काम करता है',
    howItWorksSubtitle: 'दर्ज़ से सत्यापित मरम्मत तक तीन आसान चरण।',
    commonIssues: 'रिपोर्ट करने योग्य सामान्य समस्याएँ',
    issueCategoryPrompt: 'त्वरित रिपोर्ट के लिए कोई भी श्रेणी चुनें।',
    emergencyQuestion: 'आपातकाल?',
    emergencyAction: '112 पर कॉल करें या 1913 हेल्पलाइन',
    reportTheProblem: 'समस्या दर्ज करें',
    reportTheProblemBody: 'समस्या श्रेणी चुनें, वैकल्पिक फोटो जोड़ें और अपना स्थान पुष्टि करें।',
    municipalDispatch: 'नगर पालिका डिस्पैच',
    municipalDispatchBody: 'आपकी रिपोर्ट तुरंत स्थानीय वार्ड मरम्मत दल को भेज दी जाती है।',
    verifiedResolution: 'सत्यापित समाधान',
    verifiedResolutionBody: 'स्थिति वास्तविक समय में ट्रैक करें और काम पूरा होने पर समाधान सत्यापित करें।',
    welcomeCitizen: 'नगरसेतु में आपका स्वागत है',
    welcomeCitizenSubtitle: 'स्थानीय नागरिक समस्याएँ रिपोर्ट करें, फील्ड दल की प्रगति ट्रैक करें और अपने इलाके की जानकारी बनाए रखें।',
    activeComplaints: 'सक्रिय शिकायतें',
    currentlyInProgress: 'वर्तमान में प्रगति पर',
    resolvedIssues: 'समाधान की गई शिकायतें',
    repairsCompleted: 'मरम्मत पूर्ण',
    recentComplaints: 'आपकी हाल की शिकायतें',
    recentComplaintsSubtitle: 'आपके द्वारा प्रस्तुत रिपोर्ट की स्थिति ट्रैक करें।',
    viewAll: 'सभी देखें',
    emergencyHelplineCard: 'आपातकालीन हेल्पलाइन',
    emergencyHelplineCardSubtitle: '24/7 त्वरित नगरपालिका डिस्पैच',
    accessibilityLabel: 'सुगम्यता',
    accessibilityNote: 'कीबोर्ड से उपयोग योग्य नियंत्रण और स्पष्ट फ़ोकस संकेत।',
    privacyLabel: 'गोपनीयता',
    privacyNote: 'आपके क्रेडेंशियल ब्राउज़र में कभी संग्रहीत नहीं किए जाते।',
  },
  mr: {
    portalName: 'नगरसेतू',
    tagline: 'उत्तम शहरे. जलद कारवाई.',
    smartCity: 'स्मार्ट सिटी',
    citizenPortal: 'नागरिक पोर्टल',
    opsPortal: 'फील्ड ऑप्स',
    adminPortal: 'प्रशासन कमांड',
    reportIssue: '+ तक्रार नोंदवा',
    trackComplaint: 'तक्रार ट्रॅक करा',
    myComplaints: 'माझ्या तक्रारी',
    nearbyIssues: 'परिसरातील समस्या',
    emergencyHelpline: 'आपत्कालीन सेवा 24/7',
    notifications: 'सूचना',
    profile: 'नागरिक प्रोफाइल',
    transparency: 'पारदर्शकता दालन',
    searchPlaceholder: 'तक्रार, टोकन, ठिकाण शोधा...',
    goodMorning: 'शुभ सकाळ',
    betterCities: 'उत्तम शहरे.',
    fasterAction: 'जलद कारवाई.',
    signIn: 'साइन इन',
    language: 'भाषा',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    selectPortal: 'तुमचा पोर्टल निवडा',
    emailAddress: 'ईमेल पत्ता',
    password: 'पासवर्ड',
    registerHere: 'येथे नोंदणी करा',
    createAccount: 'नागरिक खाते तयार करा',
    login: 'साइन इन',
    home: 'मुख्यपृष्ठ',
    dashboard: 'डॅशबोर्ड',
    emergency: 'आपत्कालीन मदत',
    signOut: 'साइन आउट',
    helpLine: 'नागरिक हेल्पलाइन',
    officialPortal: 'अधिकृत नगरपालिका पोर्टल',
    officialMunicipalPortal: 'अधिकृत नगरपालिका पोर्टल',
    publicLandingHeading: 'उत्तम शहरे. जलद कारवाई.',
    publicLandingSubtitle: 'तुमच्या नगरपरिषदेच्या टीमकडे नागरिक समस्या थेट नोंदवा आणि दुरुस्तीची प्रगती ट्रॅक करा.',
    howItWorks: 'नगरसेतू कसे काम करते',
    howItWorksSubtitle: 'नोंदणीपासून सत्यापित दुरुस्तीपर्यंत तीन सोपे चरण.',
    commonIssues: 'नोंदणीसाठी सामान्य समस्याएँ',
    issueCategoryPrompt: 'त्वरित अहवालासाठी श्रेणी निवडा.',
    emergencyQuestion: 'आपत्काल?',
    emergencyAction: '112 वर कॉल करा किंवा 1913 हेल्पलाइन',
    reportTheProblem: 'समस्येची नोंदणी करा',
    reportTheProblemBody: 'समस्येची श्रेणी निवडा, पर्यायी फोटो जोडा आणि आपले स्थान निश्चित करा.',
    municipalDispatch: 'नगरपालिका डिस्पॅच',
    municipalDispatchBody: 'तुमची तक्रार ताबडतोब तात्काळ स्थानिक वार्ड दुरूस्ती टीमकडे पाठवली जाते.',
    verifiedResolution: 'सत्यापित निराकरण',
    verifiedResolutionBody: 'स्थिती वास्तविक वेळेत ट्रॅक करा आणि काम संपल्यावर निराकरण पडताळा.',
    welcomeCitizen: 'नगरसेतूमध्ये आपले स्वागत आहे',
    welcomeCitizenSubtitle: 'स्थानिक नागरी समस्यांची नोंदणी करा, फील्ड टीमची प्रगती ट्रॅक करा आणि आपल्या परिसरातील अपडेट पहा.',
    activeComplaints: 'सक्रिय तक्रारी',
    currentlyInProgress: 'सध्या प्रगतीपथावर',
    resolvedIssues: 'निकालीकृत तक्रारी',
    repairsCompleted: 'दुरुस्ती पूर्ण',
    recentComplaints: 'तुमच्या अलीकडील तक्रारी',
    recentComplaintsSubtitle: 'तुम्ही दिलेल्या अहवालांची स्थिती ट्रॅक करा.',
    viewAll: 'सर्व पहा',
    emergencyHelplineCard: 'आपत्कालीन हेल्पलाइन',
    emergencyHelplineCardSubtitle: '24/7 जलद नगरपालिका डिस्पॅच',
    accessibilityLabel: 'सुलभता',
    accessibilityNote: 'कीबोर्डद्वारे वापरता येणारी नियंत्रणे आणि स्पष्ट फोकस संकेत.',
    privacyLabel: 'गोपनीयता',
    privacyNote: 'तुमची क्रेडेन्शियल्स ब्राउझरमध्ये कधीही साठवली जात नाहीत.',
  }
};

export const i18nService = {
  getLocale: (): SupportedLocale => {
    return storageService.get<SupportedLocale>(LOCALE_KEY, 'en');
  },

  setLocale: (locale: SupportedLocale): void => {
    storageService.set(LOCALE_KEY, locale);
  },

  getTranslations: (locale?: SupportedLocale): TranslationMap => {
    const active = locale || i18nService.getLocale();
    return TRANSLATIONS[active] || TRANSLATIONS.en;
  }
};
