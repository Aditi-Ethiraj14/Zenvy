// ============================================================
// i18n.js — Multi-language Support (EN / HI / TA / TE)
// ============================================================
import React, { createContext, useContext, useState } from 'react'

export const LANGUAGES = {
  en: { label: 'English', flag: '🇬🇧' },
  hi: { label: 'हिन्दी', flag: '🇮🇳' },
  ta: { label: 'தமிழ்', flag: '🇮🇳' },
  te: { label: 'తెలుగు', flag: '🇮🇳' },
}

export const STRINGS = {
  en: {
    // Nav
    dashboard: 'Dashboard', myPolicy: 'My Policy', fileClaim: 'File Claim',
    alerts: 'Alerts', payouts: 'Payouts', riskMap: 'Risk Map',
    adminDashboard: 'Admin Dashboard', logout: 'Logout',
    // Dashboard
    goodDay: 'Good day', riskScore: 'AI RISK SCORE (RADAR)',
    weeklyPremium: 'Weekly Premium', rain: 'Rain', aqi: 'AQI',
    policyStatus: 'Policy Status', temperature: 'Temperature', windSpeed: 'Wind Speed',
    activePolicy: 'Active Policy', getProtected: 'Get Protected Now!',
    buyPolicy: 'Buy Policy', forecast: 'Short-Term Forecast', tipsForYou: 'Tips for You',
    // Policy
    incomePolicy: 'Income Insurance Policy', riskAssessment: 'RADAR Risk Assessment',
    riskFactors: 'Top Risk Factors', buyWeeklyPolicy: 'Buy Weekly Policy',
    alreadyProtected: 'You already have an active policy!', policyHistory: 'Policy History',
    upiId: 'Enter your UPI ID', verifyUpi: 'Verify UPI', upiVerified: 'UPI ID Verified ✓',
    payNow: 'Pay Now', processing: 'Processing payment...', paymentSuccess: 'Payment Successful!',
    paymentFailed: 'Payment Failed', enterUpi: 'e.g. yourname@upi',
    // Claims
    fileClaim: 'File a Claim', noPolicy: 'No active policy found',
    describe: 'Describe the income loss event', submitClaim: 'Submit Claim',
    claimUnderReview: 'Claim Under Review', claimPaid: 'Claim Approved & Paid!',
    // Payouts
    transactions: 'Transaction & Payout History', totalPayouts: 'Total Payouts Received',
    approvedClaims: 'Approved Claims', flaggedClaims: 'Flagged Claims',
    // Alerts
    alertsTitle: 'Alerts', unread: 'unread', markRead: 'Mark read', allClear: 'No alerts. All clear!',
    // Common
    loading: 'Loading...', refresh: 'Refresh', status: 'Status', amount: 'Amount',
    date: 'Date', cancel: 'Cancel', confirm: 'Confirm',
  },
  hi: {
    dashboard: 'डैशबोर्ड', myPolicy: 'मेरी पॉलिसी', fileClaim: 'दावा दर्ज करें',
    alerts: 'सूचनाएं', payouts: 'भुगतान', riskMap: 'जोखिम मानचित्र',
    adminDashboard: 'एडमिन डैशबोर्ड', logout: 'लॉगआउट',
    goodDay: 'नमस्ते', riskScore: 'AI जोखिम स्कोर (RADAR)',
    weeklyPremium: 'साप्ताहिक प्रीमियम', rain: 'बारिश', aqi: 'वायु गुणवत्ता',
    policyStatus: 'पॉलिसी स्थिति', temperature: 'तापमान', windSpeed: 'हवा की गति',
    activePolicy: 'सक्रिय पॉलिसी', getProtected: 'अभी सुरक्षित हों!',
    buyPolicy: 'पॉलिसी खरीदें', forecast: 'अल्पकालिक पूर्वानुमान', tipsForYou: 'आपके लिए सुझाव',
    incomePolicy: 'आय बीमा पॉलिसी', riskAssessment: 'RADAR जोखिम मूल्यांकन',
    riskFactors: 'मुख्य जोखिम कारक', buyWeeklyPolicy: 'साप्ताहिक पॉलिसी खरीदें',
    alreadyProtected: 'आपकी पहले से एक सक्रिय पॉलिसी है!', policyHistory: 'पॉलिसी इतिहास',
    upiId: 'अपना UPI ID दर्ज करें', verifyUpi: 'UPI सत्यापित करें', upiVerified: 'UPI ID सत्यापित ✓',
    payNow: 'अभी भुगतान करें', processing: 'भुगतान हो रहा है...', paymentSuccess: 'भुगतान सफल!',
    paymentFailed: 'भुगतान विफल', enterUpi: 'उदा. yourname@upi',
    fileClaim: 'दावा दर्ज करें', noPolicy: 'कोई सक्रिय पॉलिसी नहीं',
    describe: 'आय हानि की घटना का वर्णन करें', submitClaim: 'दावा जमा करें',
    claimUnderReview: 'दावा समीक्षाधीन', claimPaid: 'दावा स्वीकृत और भुगतान!',
    transactions: 'लेनदेन एवं भुगतान इतिहास', totalPayouts: 'कुल प्राप्त भुगतान',
    approvedClaims: 'स्वीकृत दावे', flaggedClaims: 'चिह्नित दावे',
    alertsTitle: 'सूचनाएं', unread: 'अपठित', markRead: 'पढ़ा गया चिह्नित करें', allClear: 'कोई सूचना नहीं। सब ठीक है!',
    loading: 'लोड हो रहा है...', refresh: 'ताज़ा करें', status: 'स्थिति', amount: 'राशि',
    date: 'तारीख', cancel: 'रद्द करें', confirm: 'पुष्टि करें',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', myPolicy: 'என் கொள்கை', fileClaim: 'கோரிக்கை தாக்கல்',
    alerts: 'அறிவிப்புகள்', payouts: 'பணம் செலுத்துதல்', riskMap: 'ஆபத்து வரைபடம்',
    adminDashboard: 'நிர்வாக டாஷ்போர்டு', logout: 'வெளியேறு',
    goodDay: 'வணக்கம்', riskScore: 'AI ஆபத்து மதிப்பெண் (RADAR)',
    weeklyPremium: 'வாராந்திர பிரீமியம்', rain: 'மழை', aqi: 'காற்று தரம்',
    policyStatus: 'கொள்கை நிலை', temperature: 'வெப்பநிலை', windSpeed: 'காற்று வேகம்',
    activePolicy: 'செயலில் உள்ள கொள்கை', getProtected: 'இப்போது பாதுகாக்கப்படுங்கள்!',
    buyPolicy: 'கொள்கை வாங்குங்கள்', forecast: 'குறுகிய கால முன்னறிவிப்பு', tipsForYou: 'உங்களுக்கான குறிப்புகள்',
    incomePolicy: 'வருமான காப்பீட்டு கொள்கை', riskAssessment: 'RADAR ஆபத்து மதிப்பீடு',
    riskFactors: 'முக்கிய ஆபத்து காரணிகள்', buyWeeklyPolicy: 'வாராந்திர கொள்கை வாங்குங்கள்',
    alreadyProtected: 'உங்களிடம் ஏற்கனவே ஒரு செயலில் உள்ள கொள்கை உள்ளது!', policyHistory: 'கொள்கை வரலாறு',
    upiId: 'உங்கள் UPI ID ஐ உள்ளிடுங்கள்', verifyUpi: 'UPI சரிபார்', upiVerified: 'UPI சரிபார்க்கப்பட்டது ✓',
    payNow: 'இப்போது செலுத்துங்கள்', processing: 'பணம் செலுத்தப்படுகிறது...', paymentSuccess: 'பணம் செலுத்தப்பட்டது!',
    paymentFailed: 'பணம் செலுத்துவதில் தோல்வி', enterUpi: 'எ.கா. yourname@upi',
    fileClaim: 'கோரிக்கை தாக்கல்', noPolicy: 'செயலில் உள்ள கொள்கை இல்லை',
    describe: 'வருமான இழப்பு நிகழ்வை விவரிக்கவும்', submitClaim: 'கோரிக்கை சமர்ப்பி',
    claimUnderReview: 'கோரிக்கை மதிப்பாய்வில் உள்ளது', claimPaid: 'கோரிக்கை அங்கீகரிக்கப்பட்டது & செலுத்தப்பட்டது!',
    transactions: 'பரிவர்த்தனை & செலுத்தல் வரலாறு', totalPayouts: 'மொத்த பெறப்பட்ட பணம்',
    approvedClaims: 'அங்கீகரிக்கப்பட்ட கோரிக்கைகள்', flaggedClaims: 'கொடியிடப்பட்ட கோரிக்கைகள்',
    alertsTitle: 'அறிவிப்புகள்', unread: 'படிக்காத', markRead: 'படித்தது என்று குறி', allClear: 'அறிவிப்புகள் இல்லை. அனைத்தும் சரி!',
    loading: 'ஏற்றுகிறது...', refresh: 'புதுப்பி', status: 'நிலை', amount: 'தொகை',
    date: 'தேதி', cancel: 'ரத்து', confirm: 'உறுதிப்படுத்து',
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్', myPolicy: 'నా పాలసీ', fileClaim: 'క్లెయిమ్ దాఖలు',
    alerts: 'హెచ్చరికలు', payouts: 'చెల్లింపులు', riskMap: 'రిస్క్ మ్యాప్',
    adminDashboard: 'అడ్మిన్ డాష్‌బోర్డ్', logout: 'లాగ్‌అవుట్',
    goodDay: 'నమస్కారం', riskScore: 'AI రిస్క్ స్కోర్ (RADAR)',
    weeklyPremium: 'వారపు ప్రీమియం', rain: 'వర్షం', aqi: 'వాయు నాణ్యత',
    policyStatus: 'పాలసీ స్థితి', temperature: 'ఉష్ణోగ్రత', windSpeed: 'గాలి వేగం',
    activePolicy: 'క్రియాశీల పాలసీ', getProtected: 'ఇప్పుడే రక్షించుకోండి!',
    buyPolicy: 'పాలసీ కొనండి', forecast: 'స్వల్పకాలిక అంచనా', tipsForYou: 'మీకు చిట్కాలు',
    incomePolicy: 'ఆదాయ భీమా పాలసీ', riskAssessment: 'RADAR రిస్క్ అంచనా',
    riskFactors: 'ముఖ్య రిస్క్ కారణాలు', buyWeeklyPolicy: 'వారపు పాలసీ కొనండి',
    alreadyProtected: 'మీకు ఇప్పటికే క్రియాశీల పాలసీ ఉంది!', policyHistory: 'పాలసీ చరిత్ర',
    upiId: 'మీ UPI ID నమోదు చేయండి', verifyUpi: 'UPI ధృవీకరించండి', upiVerified: 'UPI ధృవీకరించబడింది ✓',
    payNow: 'ఇప్పుడు చెల్లించండి', processing: 'చెల్లింపు జరుగుతోంది...', paymentSuccess: 'చెల్లింపు విజయవంతమైంది!',
    paymentFailed: 'చెల్లింపు విఫలమైంది', enterUpi: 'ఉదా. yourname@upi',
    fileClaim: 'క్లెయిమ్ దాఖలు', noPolicy: 'క్రియాశీల పాలసీ లేదు',
    describe: 'ఆదాయ నష్ట సంఘటనను వివరించండి', submitClaim: 'క్లెయిమ్ సమర్పించండి',
    claimUnderReview: 'క్లెయిమ్ సమీక్షలో ఉంది', claimPaid: 'క్లెయిమ్ ఆమోదించబడింది & చెల్లించబడింది!',
    transactions: 'లావాదేవీ & చెల్లింపు చరిత్ర', totalPayouts: 'మొత్తం అందుకున్న చెల్లింపులు',
    approvedClaims: 'ఆమోదించిన క్లెయిముల', flaggedClaims: 'ఫ్లాగ్ చేసిన క్లెయిములు',
    alertsTitle: 'హెచ్చరికలు', unread: 'చదవని', markRead: 'చదివినట్లు గుర్తించు', allClear: 'హెచ్చరికలు లేవు. అన్నీ సరే!',
    loading: 'లోడవుతోంది...', refresh: 'రిఫ్రెష్', status: 'స్థితి', amount: 'మొత్తం',
    date: 'తేదీ', cancel: 'రద్దు చేయి', confirm: 'నిర్ధారించు',
  },
}

export const LangContext = createContext({ lang: 'en', t: (k) => k, setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('zenvy_lang') || 'en')

  const changeLang = (l) => {
    setLang(l)
    localStorage.setItem('zenvy_lang', l)
  }

  const t = (key) => STRINGS[lang]?.[key] || STRINGS['en']?.[key] || key

  return (
    <LangContext.Provider value={{ lang, t, setLang: changeLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
