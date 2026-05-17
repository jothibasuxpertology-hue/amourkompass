import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { motion, AnimatePresence, useSpring } from 'motion/react';
import { Compass, Navigation, Heart, Info, MapPin, AlertCircle, Users, LogIn, LogOut, Settings, Sparkles, UserPlus, MessageCircle, Send, Smile, X, ArrowLeft, Download, Share2, Check, XCircle, ShieldCheck, Instagram, Mail, Globe, Plus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { auth, db } from './firebase';
import SoulmateGlobe from './components/SoulmateGlobe';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, collection, query, where, getDocs, updateDoc, addDoc, orderBy, limit } from 'firebase/firestore';

// Firestore Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Card Component
const ConnectionCard = ({ 
  type, 
  user1, 
  user2, 
  cardRef 
}: { 
  type: 'soulmate' | 'friendship', 
  user1: any, 
  user2: any,
  cardRef: React.RefObject<HTMLDivElement>
}) => {
  const isSoulmate = type === 'soulmate';
  
  return (
    <div 
      ref={cardRef}
      className={`w-[320px] h-[480px] p-8 relative overflow-hidden flex flex-col items-center justify-between text-center ${
        isSoulmate 
          ? 'bg-gradient-to-br from-[#FFF5F5] via-white to-[#FFE4E4]' 
          : 'bg-gradient-to-br from-[#FDFCF8] via-white to-[#F5F5F0]'
      }`}
      style={{ borderRadius: '40px' }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-[#E86B6B] rounded-full rotate-45" />
        <div className="absolute bottom-10 right-10 w-32 h-32 border border-[#D4A373] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#E86B6B]/20 rounded-full" />
      </div>

      <div className="z-10 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Compass size={20} className="text-[#D4A373]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8970]">Amour Compass</span>
        </div>
        <h2 className={`text-3xl font-serif ${isSoulmate ? 'text-[#E86B6B]' : 'text-[#D4A373]'}`}>
          {isSoulmate ? 'Soulmate Bond' : 'Eternal Friendship'}
        </h2>
        <p className="text-[10px] text-[#8C8970] italic">A connection written in the stars</p>
      </div>

      <div className="z-10 flex items-center justify-center gap-4 w-full">
        <div className="flex flex-col items-center gap-2">
          {user1.profilePic ? (
            <img src={user1.profilePic} alt={user1.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border border-[#FFD7D7]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-[#FFD7D7] flex items-center justify-center text-2xl font-serif italic text-[#E86B6B]">
              {user1.name[0]}
            </div>
          )}
          <span className="text-xs font-bold text-[#4A4A3A]">{user1.name}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#8C8970]">{user1.zodiac}</span>
        </div>

        <div className="flex flex-col items-center">
          {isSoulmate ? (
            <Heart size={24} className="text-[#E86B6B] animate-pulse" fill="#E86B6B" />
          ) : (
            <Sparkles size={24} className="text-[#D4A373]" />
          )}
          <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-[#FFD7D7] to-transparent my-2" />
        </div>

        <div className="flex flex-col items-center gap-2">
          {user2.profilePic ? (
            <img src={user2.profilePic} alt={user2.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border border-[#FFD7D7]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-[#FFD7D7] flex items-center justify-center text-2xl font-serif italic text-[#E86B6B]">
              {user2.name[0]}
            </div>
          )}
          <span className="text-xs font-bold text-[#4A4A3A]">{user2.name}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#8C8970]">{user2.zodiac}</span>
        </div>
      </div>

      <div className="z-10 w-full space-y-4">
        <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-[#FFD7D7] shadow-sm">
          <p className="text-[10px] leading-relaxed text-[#4A4A3A] italic">
            {isSoulmate 
              ? "Destiny brought them together through the Amour Compass. A bond forged in the stars and guided by the heart."
              : "A friendship that transcends boundaries. Two souls connected by shared moments and mutual understanding."}
          </p>
        </div>
        <div className="text-[8px] text-[#8C8970] font-bold uppercase tracking-widest">
          Verified Connection • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  state = { hasError: false, error: null as any };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error.includes("Missing or insufficient permissions")) {
          message = "You don't have permission to perform this action. Please check your connection or sign in again.";
        }
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 bg-[#E86B6B]/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-[#E86B6B]" size={32} />
            </div>
            <h1 className="text-xl font-sans font-bold text-[#4A4A3A] uppercase tracking-widest">Application Error</h1>
            <p className="text-[#8C8970] text-sm leading-relaxed">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#4A4A3A] text-white rounded-full font-sans font-bold tracking-widest uppercase text-xs shadow-lg"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// Helper for bearing calculation
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const ZODIAC_COMPATIBILITY: { [key: string]: string[] } = {
  'Aries': ['Leo', 'Sagittarius'],
  'Taurus': ['Virgo', 'Capricorn'],
  'Gemini': ['Libra', 'Aquarius'],
  'Cancer': ['Scorpio', 'Pisces'],
  'Leo': ['Aries', 'Sagittarius'],
  'Virgo': ['Taurus', 'Capricorn'],
  'Libra': ['Gemini', 'Aquarius'],
  'Scorpio': ['Cancer', 'Pisces'],
  'Sagittarius': ['Aries', 'Leo'],
  'Capricorn': ['Taurus', 'Virgo'],
  'Aquarius': ['Gemini', 'Libra'],
  'Pisces': ['Cancer', 'Scorpio'],
};

import { PROFILE_PICS } from './profilePics';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [heading, setHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Friend State
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const activeUsersCount = useMemo(() => {
    const now = Date.now();
    const active = allUsers.filter(u => {
      const lastSeen = u.lastSeen?.toMillis ? u.lastSeen.toMillis() : 0;
      return lastSeen > now - 300000; // 5 minutes
    });
    return active.length + 1; // +1 for the current user
  }, [allUsers]);
  const [soulmateMatches, setSoulmateMatches] = useState<any[]>([]);
  const [friendData, setFriendData] = useState<any>(null);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState<'friend' | 'love'>('love');
  const [isFacingEachOther, setIsFacingEachOther] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  const [globeMatches, setGlobeMatches] = useState<any[]>([]);
  const [globeRotation, setGlobeRotation] = useState<[number, number, number]>([0, -20, 0]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState<'compass' | 'messages' | 'friends' | 'saved'>('compass');
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardToDownload, setCardToDownload] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [activeLoveMatch, setActiveLoveMatch] = useState<any>(null);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [lastMessageContent, setLastMessageContent] = useState('');
  const [dismissedLoveMatchId, setDismissedLoveMatchId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ name: string; text: string; uid: string } | null>(null);
  const [sensorStatus, setSensorStatus] = useState<'inactive' | 'active' | 'stuck' | 'relative'>('inactive');
  const [hasAcceptedSafetyWarning, setHasAcceptedSafetyWarning] = useState(false);
  const [showChatActions, setShowChatActions] = useState(false);
  const [authMethod, setAuthMethod] = useState<'welcome' | 'email' | 'signup'>('welcome');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const isFullyAuthed = user && (user.isAnonymous || user.emailVerified);
  const lastHeadingRef = useRef(0);
  const lastHeadingTimeRef = useRef(Date.now());

  // Onboarding State
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    country: 'United States',
    language: 'English',
    gender: 'Male',
    age: 18,
    zodiac: 'Aries',
    targetCountry: 'United States',
    lookingForLove: true,
    profilePic: '',
    bio: ''
  });

  const [onboardingStep, setOnboardingStep] = useState(1);

  const openEditProfile = () => {
    if (userData) {
      setOnboardingData({
        name: userData.name || '',
        country: userData.country || 'United States',
        language: userData.language || 'English',
        gender: userData.gender || 'Male',
        age: userData.age || 18,
        zodiac: userData.zodiac || 'Aries',
        targetCountry: userData.targetCountry || 'United States',
        lookingForLove: userData.lookingForLove || false,
        profilePic: userData.profilePic || '',
        bio: userData.bio || ''
      });
      setOnboardingStep(1);
      setShowOnboarding(true);
      setShowSettings(false);
    }
  };

  useEffect(() => {
    if (!user || userChats.length === 0) return;

    const lastChat = userChats[0];
    if (!lastChat.lastMessage) return;

    // Only notify if message is from other user
    const isFromOther = lastChat.lastMessage.senderId !== user.uid;
    
    // Check if the message is very recent (last 5 seconds)
    const messageTime = lastChat.updatedAt?.toMillis?.() || 0;
    const isRecent = messageTime > Date.now() - 5000;
    
    // Don't notify if we are already chatting with this person
    const isNotCurrentChat = selectedChatUser?.uid !== lastChat.otherUser.uid;

    if (isFromOther && isRecent && isNotCurrentChat) {
      setNotification({
        name: lastChat.otherUser.name,
        text: lastChat.lastMessage.text,
        uid: lastChat.otherUser.uid
      });
      
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [userChats, user, selectedChatUser]);

  // Smooth rotation using a spring
  const springHeading = useSpring(0, {
    stiffness: 50,
    damping: 20,
    mass: 1
  });

  const accumulatedRotation = useRef(0);

  useEffect(() => {
    // Shortest path rotation logic
    const target = -heading;
    const current = accumulatedRotation.current;
    let diff = (target - current) % 360;
    
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const next = current + diff;
    accumulatedRotation.current = next;
    springHeading.set(next);
  }, [heading, springHeading]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setIsAuthLoading(true);
      setUser(u);
      if (u) {
        try {
          // Check if user has a complete profile
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.data();
          if (!snap.exists() || !data?.country || !data?.profilePic || !data?.age || !data?.zodiac) {
            setShowWelcome(true);
            setOnboardingData(prev => ({ 
              ...prev, 
              name: data?.name || u.displayName || '',
              country: data?.country || 'United States',
              age: data?.age || 18,
              zodiac: data?.zodiac || 'Aries',
              profilePic: data?.profilePic || ''
            }));
          }
        } catch (error) {
          console.error("Auth check error:", error);
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Compass Reliability & Calibration
  useEffect(() => {
    const handleCalibration = (e: any) => {
      e.preventDefault();
      setNotification({
        name: "Compass",
        text: "Calibration needed! Move your phone in a figure-8.",
        uid: "system"
      });
    };
    window.addEventListener('compassneedscalibration', handleCalibration);
    
    // Monitor sensor health
    const healthCheck = setInterval(() => {
      if (!isDesktop && permissionGranted) {
        if (heading === lastHeadingRef.current) {
          if (Date.now() - lastHeadingTimeRef.current > 10000) {
            setSensorStatus('stuck');
            // Auto-refresh attempt if stuck
            setupOrientationListeners();
          }
        } else {
          setSensorStatus('active');
          lastHeadingRef.current = heading;
          lastHeadingTimeRef.current = Date.now();
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('compassneedscalibration', handleCalibration);
      clearInterval(healthCheck);
    };
  }, [isDesktop, permissionGranted, heading]);
  const lastUpdateRef = useRef({ heading: -1, location: null as any, relationshipType: '' });

  useEffect(() => {
    if (!user || showOnboarding || showWelcome || !userData) return;
    
    // Update every 8 seconds as requested
    const interval = setInterval(() => {
      updateDoc(doc(db, 'users', user.uid), {
        heading,
        location,
        lastSeen: serverTimestamp(),
        relationshipType,
        lookingForLove: userData.lookingForLove ?? true
      })
      .then(() => {
        lastUpdateRef.current = { heading, location, relationshipType };
      })
      .catch(e => {
        if (e.message?.includes('offline')) return;
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [user, heading, location, relationshipType, showOnboarding, showWelcome, userData]);

  // Listen to All Users
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs
        .map(d => d.data())
        .filter(u => u.uid !== user.uid);
      setAllUsers(users);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'users'));
    return () => unsub();
  }, [user]);

  // Matching Logic
  useEffect(() => {
    if (!user || !userData) return;

    const oppositeDegree = (heading + 180) % 360;
    const threshold = 10; // Liberal 10 degree tolerance as requested

    const rawMatches = allUsers.filter(other => {
      if (!other.heading || !other.zodiac || !other.age) return false;
      
      // Only match people active in the last 5 minutes
      const lastSeen = other.lastSeen?.toMillis ? other.lastSeen.toMillis() : 0;
      const isActive = lastSeen > Date.now() - 300000;
      if (!isActive) return false;
      
      // Only match people in the opposite direction (180 degrees offset)
      const oppDir = Math.abs(oppositeDegree - other.heading) < threshold || Math.abs(oppositeDegree - other.heading) > (360 - threshold);
      return oppDir;
    });

    // Randomly shuffle matches to provide variety
    const shuffled = [...rawMatches].sort(() => Math.random() - 0.5);
    
    // Potential Soulmates: Anyone in the compass direction
    const limitedMatches = shuffled.slice(0, 6);
    setSoulmateMatches(limitedMatches);

    // Check for "Soulmate Found" (Active Love Match Popup)
    // Rule: Zodiac match AND age difference <= 10 years
    if (userData.lookingForLove) {
      const loveMatches = shuffled.filter(m => {
        if (!m.lookingForLove) return false;
        
        // Zodiac Matching Logic for Popup
        const myZodiac = userData.zodiac;
        const otherZodiac = m.zodiac;
        const isZodiacCompatible = ZODIAC_COMPATIBILITY[myZodiac]?.includes(otherZodiac);
        if (!isZodiacCompatible) return false;

        // Age-restricted matching logic:
        // 1. Both must be 18 or above.
        // 2. Allow up to 10 years gap.
        const myAge = userData.age || 0;
        const otherAge = m.age || 0;
        const ageDiff = Math.abs(myAge - otherAge);

        return ageDiff <= 10;
      });
      
      const loveMatch = loveMatches.length > 0 ? loveMatches[0] : null;
      
      if (loveMatch) {
        if (loveMatch.uid !== dismissedLoveMatchId) {
          setActiveLoveMatch(loveMatch);
          // Automatically show globe for perfect matches if not already showing
          if (!showGlobe) {
            setGlobeMatches([loveMatch]);
            setShowGlobe(true);
          }
        }
      } else {
        setActiveLoveMatch(null);
        setDismissedLoveMatchId(null);
      }
    } else {
      setActiveLoveMatch(null);
      setDismissedLoveMatchId(null);
    }
  }, [heading, allUsers, userData, dismissedLoveMatchId]);

  // Listen to User Data
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUserData(snap.data());
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
    return () => unsub();
  }, [user]);

  // Listen to Friend Data
  useEffect(() => {
    if (!user || !userData?.friendId) {
      setFriendData(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', userData.friendId), (snap) => {
      setFriendData(snap.data());
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${userData.friendId}`));
    return () => unsub();
  }, [user, userData?.friendId]);

  // Facing Logic
  useEffect(() => {
    if (!location || !friendData?.location || !friendData?.heading) {
      setIsFacingEachOther(false);
      return;
    }

    const bearingToFriend = calculateBearing(location.lat, location.lng, friendData.location.lat, friendData.location.lng);
    const bearingToMe = calculateBearing(friendData.location.lat, friendData.location.lng, location.lat, location.lng);

    const myDiff = Math.abs((heading - bearingToFriend + 540) % 360 - 180);
    const friendDiff = Math.abs((friendData.heading - bearingToMe + 540) % 360 - 180);

    // If both are pointing at each other within 20 degrees
    const threshold = 25;
    setIsFacingEachOther(myDiff < threshold && friendDiff < threshold);
  }, [heading, location, friendData]);

  // Chat Listener
  useEffect(() => {
    if (!user || !selectedChatUser) {
      setChatMessages([]);
      return;
    }

    const chatId = [user.uid, selectedChatUser.uid].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.LIST, `chats/${chatId}/messages`));

    return () => unsub();
  }, [user, selectedChatUser]);

  // User Chats Listener
  useEffect(() => {
    if (!user) {
      setUserChats([]);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      limit(50)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chatsData = (await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        const otherId = data.participants.find((id: string) => id !== user.uid);
        if (!otherId) return null;
        const userSnap = await getDoc(doc(db, 'users', otherId));
        return { 
          id: d.id, 
          ...data, 
          otherUser: userSnap.exists() ? { uid: otherId, ...userSnap.data() } : null
        };
      }))).filter(c => c !== null && c.otherUser);
      
      // Sort client-side to avoid composite index requirement
      const sortedChats = chatsData.sort((a: any, b: any) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setUserChats(sortedChats);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'chats'));

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const checkSupport = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsDesktop(!isTouch);
    };
    checkSupport();

    if (navigator.geolocation) {
      // Fast initial fix
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.log("Location error:", err);
          setIsLocating(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setIsLocating(false);
    }
  }, []);

  const unreadCount = userChats.filter(chat => {
    if (!user) return false;
    const isFromOther = chat.lastMessage?.senderId !== user.uid;
    const lastReadTime = chat.lastRead?.[user.uid]?.toMillis?.() || 0;
    const lastUpdateTime = chat.updatedAt?.toMillis?.() || 0;
    return isFromOther && lastUpdateTime > lastReadTime;
  }).length;

  // Update lastRead when chat is opened
  useEffect(() => {
    if (!user || !selectedChatUser) return;
    
    const chatId = [user.uid, selectedChatUser.uid].sort().join('_');
    const updateLastRead = async () => {
      try {
        const chatDoc = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatDoc);
        
        if (!chatSnap.exists()) {
          await setDoc(chatDoc, {
            participants: [user.uid, selectedChatUser.uid],
            updatedAt: serverTimestamp(),
            lastRead: {
              [user.uid]: serverTimestamp()
            }
          });
        } else {
          await updateDoc(chatDoc, {
            [`lastRead.${user.uid}`]: serverTimestamp()
          });
        }
      } catch (e) {
        console.error("Error updating lastRead:", e);
      }
    };
    
    updateLastRead();
  }, [user, selectedChatUser]);

  // Handle hardware back button for chat and settings
  useEffect(() => {
    const handlePopState = () => {
      if (selectedChatUser) {
        setSelectedChatUser(null);
        setHasAcceptedSafetyWarning(false);
      } else if (showSettings) {
        setShowSettings(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedChatUser, showSettings]);

  useEffect(() => {
    const isAnyModalOpen = selectedChatUser !== null || showSettings;
    if (isAnyModalOpen && window.history.state?.modalOpen !== true) {
      window.history.pushState({ modalOpen: true }, '');
    }
  }, [selectedChatUser !== null, showSettings]);

  const closeSettings = () => {
    setShowSettings(false);
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
  };

  const closeChat = () => {
    setSelectedChatUser(null);
    setHasAcceptedSafetyWarning(false);
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
  };

  const openChat = (chatUser: any) => {
    setHasAcceptedSafetyWarning(false);
    setSelectedChatUser(chatUser);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (onboardingData.age < 18) {
      setNotification({ name: "Age Restricted", text: "If you are under 18, you can't enter.", uid: "system" });
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...onboardingData,
        uid: user.uid,
        lastSeen: serverTimestamp(),
        isAnonymous: user.isAnonymous || false,
        // Only set these if they don't exist yet
        ...(userData ? {} : { relationshipType: 'love', heading: 0 })
      }, { merge: true });
      setShowOnboarding(false);
      setOnboardingStep(1);
    } catch (error) {
      console.error("Onboarding error:", error);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setIsAuthLoading(false);
        return;
      }
      console.error("Login Error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Anonymous Login Error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      await sendEmailVerification(userCredential.user);
    } catch (error: any) {
      console.error("Email Signup Error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (error: any) {
      console.error("Email Login Error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    auth.signOut();
    setUser(null);
    setUserData(null);
    setShowWelcome(true);
    setShowOnboarding(false);
    setShowSettings(false);
    setAuthMethod('welcome');
  };

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'users', 'connection-test'));
      } catch (error: any) {
        if (error.message?.includes('offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  const connectFriend = async () => {
    const input = friendIdInput.trim();
    if (!user || !input) return;
    
    if (input === user.uid || (userData?.username && input === userData.username)) {
      setConnectError("You cannot connect to yourself.");
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      let targetUid = input;

      // If input doesn't look like a UID (usually long and alphanumeric), treat as username
      // Or just always try username lookup first if it's short
      if (input.length < 25) {
        const usernameSnap = await getDoc(doc(db, 'usernames', input.toLowerCase()));
        if (usernameSnap.exists()) {
          targetUid = usernameSnap.data().uid;
        } else if (input.length < 20) {
          // If it's short and not found in usernames, it's likely a missing username
          setConnectError("Username not found.");
          setIsConnecting(false);
          return;
        }
      }

      // Verify friend exists
      const friendSnap = await getDoc(doc(db, 'users', targetUid)).catch(e => {
        handleFirestoreError(e, OperationType.GET, `users/${targetUid}`);
        throw e;
      });
      
      if (!friendSnap || !friendSnap.exists()) {
        setConnectError("Friend not found. Check the ID or Username.");
        setIsConnecting(false);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        friendId: targetUid
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
      setShowSettings(false);
      setFriendIdInput('');
    } catch (error) {
      console.error("Connection error:", error);
      setConnectError("Failed to connect. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetUsername = async () => {
    const newUsername = usernameInput.trim().toLowerCase();
    if (!user || !newUsername) return;
    if (newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    setIsSettingUsername(true);
    setUsernameError(null);

    try {
      // 1. Check if username is already taken
      const usernameDoc = doc(db, 'usernames', newUsername);
      const usernameSnap = await getDoc(usernameDoc);
      
      if (usernameSnap.exists()) {
        if (usernameSnap.data().uid === user.uid) {
          setUsernameError("This is already your username.");
        } else {
          setUsernameError("Username is already taken.");
        }
        setIsSettingUsername(false);
        return;
      }

      // 2. If user already had a username, delete the old mapping
      if (userData?.username) {
        // This is a bit complex for a simple rule set, but let's try
        // In a real app, you'd use a transaction or cloud function
        // For now, we just overwrite/add new one
      }

      // 3. Create the username mapping
      await setDoc(usernameDoc, { uid: user.uid });

      // 4. Update the user profile
      await updateDoc(doc(db, 'users', user.uid), {
        username: newUsername
      });

      setUsernameInput('');
      setUsernameError(null);
    } catch (error) {
      console.error("Username error:", error);
      setUsernameError("Failed to set username. It might be taken.");
    } finally {
      setIsSettingUsername(false);
    }
  };

  const toggleSaved = async (targetUid: string, type: 'friends' | 'loves') => {
    if (!user || !userData) return;
    
    const currentList = userData[type] || [];
    const newList = currentList.includes(targetUid)
      ? currentList.filter((id: string) => id !== targetUid)
      : [...currentList, targetUid];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [type]: newList
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const sendChatMessage = async (type: 'text' | 'emoji', content: string) => {
    if (!user || !selectedChatUser) return;
    
    // Rate limiting: 1 message every 1.5 seconds to prevent bot spam
    const now = Date.now();
    if (now - lastSentTime < 1500) {
      return;
    }

    // Spam prevention: ignore identical messages sent consecutively
    if (type === 'text' && content.trim() === lastMessageContent.trim()) {
      return;
    }

    // Basic content validation
    if (type === 'text' && (content.trim().length === 0 || content.length > 1000)) {
      return;
    }
    
    // Prevent sending external links
    if (type === 'text') {
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|io|me|co|us|uk|ca|de|fr|in|app|dev|link|xyz)(\/[^\s]*)?)/i;
      if (urlRegex.test(content)) {
        setChatError("External links are not allowed in the chat.");
        setTimeout(() => setChatError(null), 3000);
        return;
      }

      // Prevent sending forbidden words (drugs, sex, harassment)
      const forbiddenWordsRegex = /\b(drug|drugs|sex|porn|sexual|harass|harassment|abuse|rape|kill|suicide|nude|naked|slut|whore|bitch|cunt|dick|pussy|cock|vagina)\b/i;
      if (forbiddenWordsRegex.test(content)) {
        setChatError("Inappropriate content is not allowed.");
        setTimeout(() => setChatError(null), 3000);
        return;
      }

      // Prevent sending continuous numbers (phone numbers, OTPs)
      const continuousNumbersRegex = /\d{10,}/;
      if (continuousNumbersRegex.test(content.replace(/\s/g, ''))) {
        setChatError("You cannot send 10 or more continuous numbers for safety.");
        setTimeout(() => setChatError(null), 3000);
        return;
      }
    }
    
    const chatId = [user.uid, selectedChatUser.uid].sort().join('_');
    const messageData = {
      senderId: user.uid,
      receiverId: selectedChatUser.uid,
      timestamp: serverTimestamp(),
      type,
      [type === 'text' ? 'text' : 'emoji']: content
    };

    // Optimistically update state to prevent double-sends
    setLastSentTime(now);
    setLastMessageContent(content);
    if (type === 'text') setChatInput('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      // Update chat metadata
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, selectedChatUser.uid],
        lastMessage: {
          text: type === 'text' ? content : (type === 'emoji' ? content : 'Sent an emoji'),
          senderId: user.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        lastRead: {
          [user.uid]: serverTimestamp() // Sender has read their own message
        }
      }, { merge: true });
    } catch (e) {
      console.error("Error sending message:", e);
      // Reset last sent time on error to allow retry
      setLastSentTime(0);
      handleFirestoreError(e, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  const sendCardRequest = async (cardType: 'soulmate' | 'friendship') => {
    if (!user || !selectedChatUser) return;
    
    const chatId = [user.uid, selectedChatUser.uid].sort().join('_');
    const messageData = {
      senderId: user.uid,
      receiverId: selectedChatUser.uid,
      timestamp: serverTimestamp(),
      type: 'card_request',
      cardType,
      status: 'pending'
    };

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, selectedChatUser.uid],
        lastMessage: {
          text: `Requested a ${cardType} card`,
          senderId: user.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Error sending card request:", e);
      handleFirestoreError(e, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  const respondToCardRequest = async (messageId: string, status: 'accepted' | 'declined', cardType: 'soulmate' | 'friendship') => {
    if (!user || !selectedChatUser) return;
    
    const chatId = [user.uid, selectedChatUser.uid].sort().join('_');
    
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        status
      });

      if (status === 'accepted') {
        // Send a "card generated" message
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: user.uid,
          receiverId: selectedChatUser.uid,
          timestamp: serverTimestamp(),
          type: 'card_generated',
          cardType
        });

        await setDoc(doc(db, 'chats', chatId), {
          participants: [user.uid, selectedChatUser.uid],
          lastMessage: {
            text: `Generated a ${cardType} card!`,
            senderId: user.uid,
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.error("Error responding to card request:", e);
      handleFirestoreError(e, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  const downloadCard = async (cardData: any) => {
    setCardToDownload(cardData);
    // Wait for render
    setTimeout(async () => {
      if (cardRef.current) {
        setIsGeneratingCard(true);
        try {
          const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
          const link = document.createElement('a');
          link.download = `amour-compass-${cardData.type}-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Could not generate card', err);
        } finally {
          setIsGeneratingCard(false);
          setCardToDownload(null);
        }
      }
    }, 100);
  };

  const copyId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    // Simple visual feedback could be added here
  };

  const requestPermission = async () => {
    // @ts-ignore
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        // @ts-ignore
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          setupOrientationListeners();
        } else {
          setPermissionGranted(false);
        }
      } catch (error) {
        setPermissionGranted(false);
      }
    } else {
      setPermissionGranted(true);
      setupOrientationListeners();
    }
  };

  // Auto-setup for browsers that don't require explicit permission
  useEffect(() => {
    if (!isDesktop && permissionGranted === null) {
      // @ts-ignore
      if (!(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')) {
        setupOrientationListeners();
      }
    }
  }, [isDesktop, permissionGranted]);

  // Compass Visibility Refresh & Persistence
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Re-setup listeners when tab becomes active to ensure fresh sensor data
      if (document.visibilityState === 'visible' && permissionGranted) {
        setupOrientationListeners();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [permissionGranted]);

  const setupOrientationListeners = () => {
    console.log("Setting up orientation listeners...");
    // Always clean up first to avoid duplicates
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
    
    // Try absolute orientation first (Android/Chrome)
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    // Fallback/Standard orientation (iOS/Safari)
    window.addEventListener('deviceorientation', handleOrientation, true);
    
    setPermissionGranted(true);
  };

  const hasAbsoluteRef = useRef(false);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let h: number | null = null;
    let isAbsolute = false;

    // iOS check
    // @ts-ignore
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      // @ts-ignore
      h = event.webkitCompassHeading;
      isAbsolute = true;
      hasAbsoluteRef.current = true;
    } 
    // Android Absolute check
    else if (event.alpha !== null) {
      // @ts-ignore
      const isAbsoluteEvent = event.absolute === true || (event as any).type === 'deviceorientationabsolute';
      
      // If we've already had an absolute event, ignore relative ones
      if (hasAbsoluteRef.current && !isAbsoluteEvent) return;

      if (isAbsoluteEvent) {
        // Standard alpha is 0 at North, increases counter-clockwise.
        // But many devices/browsers vary. Based on user report (North as East),
        // we adjust to align correctly.
        h = (360 - event.alpha) % 360;
        isAbsolute = true;
        hasAbsoluteRef.current = true;
      } else {
        // Fallback for non-absolute (relative to start)
        h = (360 - event.alpha) % 360;
        isAbsolute = false;
      }
    }

    if (h !== null) {
      // Apply correction: 
      // iOS (webkitCompassHeading) is absolute North, usually correct (0=N, 90=E).
      // Android alpha (from deviceorientationabsolute) is usually 0 at North, but some browsers vary.
      // We removed the -90 offset as it was causing inaccuracies for most standard mobile browsers.
      // @ts-ignore
      const isIOS = event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null;
      const finalHeading = (h + 360) % 360;
      setHeading(finalHeading);
      setSensorStatus(isAbsolute ? 'active' : 'relative');
      lastHeadingTimeRef.current = Date.now();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    // Apply 180 degree offset to fix inverted directions, and ensure North (Top) is 0
    const angle = (Math.atan2(y, x) * (180 / Math.PI) + 90 + 360) % 360;
    setHeading(angle);
  };

  const getDirectionName = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  return (
    <AnimatePresence mode="wait">
      {isAuthLoading ? (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-6"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center border border-[#FFD7D7]"
          >
            <Heart size={48} className="text-[#E86B6B]" fill="#E86B6B" />
          </motion.div>
          <p className="mt-8 text-[#D4A373] font-serif italic animate-pulse">Aligning your stars...</p>
        </motion.div>
      ) : !user ? (
        <motion.div 
          key="signin" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative"
        >
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
                animate={{ y: '-10vh', opacity: [0, 0.5, 0] }}
                transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, delay: Math.random() * 5 }}
                className="absolute text-[#FFD7D7]"
              >
                <Heart fill="currentColor" size={Math.random() * 15 + 10} />
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 w-full max-w-sm relative z-10">
            <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center mx-auto border border-[#FFD7D7]">
              <Heart size={40} className="text-[#E86B6B]" fill="#E86B6B" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl font-serif text-[#D4A373]">Amour <span className="italic text-[#E86B6B]">Compass</span></h1>
              <p className="text-[#8C8970] font-bold tracking-[0.2em] uppercase text-[9px]">Your love stars are aligning</p>
            </div>

            <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-xl space-y-4">
              {authMethod === 'welcome' ? (
                <div className="space-y-3">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    disabled={isAuthLoading}
                    className="w-full py-4 bg-white border-2 border-[#FFD7D7] text-[#4A4A3A] rounded-2xl flex items-center justify-center gap-3 font-sans font-bold tracking-widest uppercase text-[10px] hover:border-[#E86B6B] transition-all shadow-sm"
                  >
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjczIDEuMjIgOS4yMyAzLjU4bDYuOTEtNi45MUMzNS40MyAyLjQ3IDMwLjI0IDAgMjQgMEMxNC45OSAwIDcuNDEgNS43IDQuNTQgMTMuOTdsNy40NyA1LjgxQzEzLjg3IDEyLjMzIDE4LjQ3IDkuNSAyNCA5LjV6Ii8+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1YzAgLTEuNjEtLjE0LTMuMTctLjM5LTQuNTVIMjR2OS4wMmgxMi45NGMtLjU2IDIuOTYtMi4yNiA1LjQ4LTQuNzcgNy4xOGw3LjQ3IDUuODFjNC4zOC00LjA1IDYuOTItNC4wNSA2LjkyLTE3LjQ2eiIvPjxwYXRoIGZpbGw9IiNGQkJDMDQiIGQ9Ik0xMC41MyAyOC41OWMtLjQ4LTEuNDEtLjc2LTIuOTEtLjc2LTQuNDVzLjI4LTMuMDQuNzYtNC40NWwtNy40Ny01LjgxQy42NCAxNy45MSAwIDIwLjkxIDAgMjRzLjY0IDYuMDkgMi4zMiA5LjIybDcuNTYtNS42MnoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy40Ny01LjgxYy0yLjA2IDEuMTEtNC43MiAxLjc3LTcuNDcgMS43Ny05LjUzIDAtMTAuMTMtMy43NC0xMS44LTguNzlMLjY0IDM0LjhDMy4zMiA0Mi4zIDExLjU0IDQ4IDI0IDQ4eiIvPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoNDh2NDhoLTQ4eiIvPjwvc3ZnPg==" 
                      className="w-5 h-5" 
                      alt="Google" 
                    />
                    Continue with Google
                  </motion.button>

                  <button 
                    onClick={() => setAuthMethod('email')}
                    disabled={isAuthLoading}
                    className="w-full py-4 bg-[#E86B6B] text-white rounded-2xl flex items-center justify-center gap-3 font-sans font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-[#E86B6B]/20 hover:bg-[#D85B5B] transition-all"
                  >
                    <Mail size={16} />
                    Continue with Email
                  </button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-[#FFD7D7]" />
                    <span className="text-[10px] font-bold text-[#D4A373] uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-[#FFD7D7]" />
                  </div>

                  <button 
                    onClick={handleAnonymousLogin}
                    disabled={isAuthLoading}
                    className="w-full py-4 bg-white/30 border border-dashed border-[#8C8970]/50 text-[#8C8970] rounded-2xl flex items-center justify-center gap-3 font-sans font-bold tracking-widest uppercase text-[10px] hover:bg-white/50 transition-all"
                  >
                    <Users size={16} />
                    Browse Anonymously
                  </button>
                </div>
              ) : (
                <form onSubmit={authMethod === 'email' ? handleEmailLogin : handleEmailSignup} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8970] ml-2">Email Address</label>
                    <input 
                      required 
                      type="email" 
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="star@amour.com"
                      className="w-full p-4 bg-white border border-[#FFD7D7] rounded-2xl text-sm focus:border-[#E86B6B] outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8970] ml-2">Password</label>
                    <input 
                      required 
                      type="password" 
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-4 bg-white border border-[#FFD7D7] rounded-2xl text-sm focus:border-[#E86B6B] outline-none transition-all shadow-sm" 
                    />
                  </div>

                  <button 
                    disabled={isAuthLoading}
                    className="w-full py-4 bg-[#E86B6B] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#E86B6B]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isAuthLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      authMethod === 'email' ? 'Sign In' : 'Create Account'
                    )}
                  </button>

                  <div className="flex justify-between items-center px-2">
                    <button 
                      type="button" 
                      onClick={() => setAuthMethod(authMethod === 'email' ? 'signup' : 'email')}
                      className="text-[10px] font-bold text-[#E86B6B] uppercase tracking-widest hover:underline"
                    >
                      {authMethod === 'email' ? "Need an account?" : "Have an account?"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAuthMethod('welcome')}
                      className="text-[10px] font-bold text-[#8C8970] uppercase tracking-widest hover:underline"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
              >
                <AlertCircle size={14} />
                {authError}
              </motion.div>
            )}

            <div className="pt-4 text-[8px] font-sans font-bold uppercase tracking-[0.4em] text-[#D4A373]/40">
              By continuing you agree to the stars
            </div>
          </motion.div>
        </motion.div>
      ) : !isFullyAuthed ? (
        <motion.div 
          key="verify" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="max-w-sm space-y-8 bg-white p-10 rounded-[3rem] border border-[#FFD7D7] shadow-xl">
            <div className="w-20 h-20 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto border-2 border-[#E86B6B]">
              <Mail size={40} className="text-[#E86B6B] animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-serif text-[#D4A373]">Verify your <span className="italic text-[#E86B6B]">Email</span></h2>
              <p className="text-sm text-[#8C8970] leading-relaxed">
                We've sent a cosmic link to <span className="font-bold text-[#4A4A3A]">{user.email}</span>. Please verify your email to unlock the compass.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-[#E86B6B] text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#E86B6B]/20"
              >
                I've Verified My Email
              </button>
              <button 
                onClick={logout}
                className="w-full py-4 text-[#8C8970] font-bold uppercase tracking-widest text-[10px] hover:text-[#E86B6B]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      ) : showWelcome ? (
        <motion.div 
          key="welcome" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative"
        >
          {/* Floating Hearts Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0, scale: Math.random() * 0.5 + 0.5 }}
                animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
                transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, delay: Math.random() * 10 }}
                className="absolute text-[#FFB7B7]"
              >
                <Heart fill="currentColor" size={Math.random() * 20 + 10} />
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 space-y-12 max-w-lg"
          >
            <div className="space-y-4">
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-6xl md:text-8xl font-serif text-[#D4A373] drop-shadow-sm"
              >
                Amour <span className="italic text-[#E86B6B]">Compass</span>
              </motion.h1>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(232, 107, 107, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowWelcome(false);
                setShowOnboarding(true);
              }}
              className="group relative px-12 py-5 bg-[#E86B6B] text-white rounded-full font-sans font-bold tracking-[0.2em] uppercase text-sm shadow-2xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Let's find your soulmate ✨
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </motion.div>

          {/* Gold Accent Lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A373]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A373]/30 to-transparent" />
          
          <div className="absolute bottom-8 text-[8px] font-sans font-bold uppercase tracking-[0.4em] text-[#D4A373]/40 z-10">
            All rights reserved for Amour Compass by Crea8tiv
          </div>
        </motion.div>
      ) : showOnboarding ? (
        <motion.div 
          key="onboarding" 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -50 }}
          className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-4 sm:p-6 text-[#4A4A3A]"
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-[#FFD7D7] flex flex-col max-h-[90vh] overflow-hidden">
            <div className="text-center space-y-2 p-6 sm:p-8 pb-4 shrink-0 bg-white z-10 border-b border-[#FFD7D7]/30">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#D4A373]">
                {onboardingStep === 1 ? "Choose your " : "Almost "}
                <span className="italic text-[#E86B6B]">{onboardingStep === 1 ? "Avatar" : "there"}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8C8970]">
                {onboardingStep === 1 ? "Select an animated profile image to represent you." : "Just a few more details to find your match."}
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 overflow-y-auto p-6 sm:p-8 pt-4">
              {onboardingStep === 1 ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-[#FFF5F5] rounded-[2.5rem] border-4 border-[#FFD7D7] shadow-inner flex items-center justify-center overflow-hidden relative">
                      {onboardingData.profilePic ? (
                        <img src={onboardingData.profilePic} alt="Selected Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#D4A373]">
                          <Sparkles size={32} className="animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Select Below</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 w-full text-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Your Display Name</label>
                      <input 
                        required 
                        placeholder="What should we call you?"
                        value={onboardingData.name} 
                        onChange={e => setOnboardingData({...onboardingData, name: e.target.value})} 
                        className="w-full p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-2xl text-center text-lg font-serif" 
                      />
                    </div>
                    <div className="space-y-1 w-full text-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Your Vibe & Bio</label>
                      <textarea 
                        required 
                        placeholder="Tell the stars about yourself..."
                        value={onboardingData.bio} 
                        onChange={e => setOnboardingData({...onboardingData, bio: e.target.value})} 
                        className="w-full p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-2xl text-center text-sm font-sans min-h-[80px] resize-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970] block text-center">Animated Avatars</label>
                    <div className="grid grid-cols-4 gap-3 p-4 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-3xl">
                      {PROFILE_PICS.map((pic, idx) => (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setOnboardingData({...onboardingData, profilePic: pic})}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${onboardingData.profilePic === pic ? 'border-[#E86B6B] shadow-lg ring-4 ring-[#E86B6B]/10' : 'border-transparent hover:border-[#FFD7D7] grayscale-[0.5] hover:grayscale-0'}`}
                        >
                          <img src={pic} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          {onboardingData.profilePic === pic && (
                            <div className="absolute inset-0 bg-[#E86B6B]/10 flex items-center justify-center">
                              <Check size={20} className="text-[#E86B6B] drop-shadow-md" />
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button"
                    disabled={!onboardingData.profilePic || !onboardingData.name}
                    onClick={() => setOnboardingStep(2)}
                    className="w-full py-4 bg-[#E86B6B] text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#E86B6B]/20 disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    Continue to Details
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Age</label>
                      <input required type="number" min="18" value={onboardingData.age} onChange={e => setOnboardingData({...onboardingData, age: parseInt(e.target.value)})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Gender</label>
                      <select value={onboardingData.gender} onChange={e => setOnboardingData({...onboardingData, gender: e.target.value})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Country</label>
                      <select required value={onboardingData.country} onChange={e => setOnboardingData({...onboardingData, country: e.target.value})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm">
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Zodiac</label>
                      <select value={onboardingData.zodiac} onChange={e => setOnboardingData({...onboardingData, zodiac: e.target.value})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm">
                        {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(z => <option key={z}>{z}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Language</label>
                    <input value={onboardingData.language} onChange={e => setOnboardingData({...onboardingData, language: e.target.value})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm" placeholder="e.g. English, Spanish" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Searching for soulmate in (Country)</label>
                    <select required value={onboardingData.targetCountry} onChange={e => setOnboardingData({...onboardingData, targetCountry: e.target.value})} className="w-full p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl text-sm">
                      <option value="Any">Any Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8970]">Looking for Love?</label>
                    <div className="flex items-center gap-3 p-2 sm:p-3 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-xl">
                      <input 
                        type="checkbox" 
                        checked={onboardingData.lookingForLove} 
                        onChange={e => setOnboardingData({...onboardingData, lookingForLove: e.target.checked})}
                        className="w-5 h-5 accent-[#E86B6B]"
                      />
                      <span className="text-sm text-[#4A4A3A]">Enable Love Compass</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="flex-1 py-4 bg-[#FFF5F5] text-[#E86B6B] border border-[#FFD7D7] rounded-full font-bold uppercase tracking-widest text-xs"
                    >
                      Back
                    </button>
                    <button type="submit" className="flex-[2] py-4 bg-[#E86B6B] text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#E86B6B]/20">
                      Find my Soulmate
                    </button>
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="app" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="min-h-screen w-full bg-[#FFF5F5] text-[#4A4A3A] font-serif selection:bg-[#FFD7D7] overflow-x-hidden overflow-y-auto flex flex-col items-center p-4 sm:p-6"
        >
          {/* Background Decorative Elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -left-20 w-96 h-96 bg-[#FFD7D7] rounded-full blur-3xl opacity-30" 
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-40 -right-20 w-[30rem] h-[30rem] bg-[#FFD7D7] rounded-full blur-3xl opacity-20" 
            />
          </div>

          {/* Notification Popup */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                onClick={() => {
                  const chatUser = userChats.find(c => c.otherUser.uid === notification.uid)?.otherUser;
                  if (chatUser) {
                    openChat(chatUser);
                    setActiveTab('messages');
                  }
                  setNotification(null);
                }}
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm bg-white rounded-2xl p-4 shadow-2xl border border-[#FFD7D7] flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 bg-[#FFF5F5] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} className="text-[#E86B6B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[#D4A373] uppercase tracking-widest">{notification.name}</div>
                  <div className="text-xs text-[#4A4A3A] truncate">{notification.text}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setNotification(null); }} className="text-[#8C8970] hover:text-[#E86B6B]">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Facing Each Other Overlay */}
          <AnimatePresence>
            {isFacingEachOther && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#FFF5F5]/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[#E86B6B]"
                >
                  {relationshipType === 'love' ? <Heart size={120} fill="currentColor" /> : <Sparkles size={120} />}
                </motion.div>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-8 text-3xl font-light italic"
                >
                  {relationshipType === 'love' ? "You've found each other!" : "Connected!"}
                </motion.h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Love Match Effect */}
          <AnimatePresence>
            {activeLoveMatch && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden"
              >
                {/* Pulsing Pink Glow */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-[150%] h-[150%] bg-radial from-[#FFB7B7]/40 to-transparent"
                />
                
                {/* Floating Hearts */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: '100vh', x: (Math.random() * 100 - 50) + 'vw', opacity: 0, scale: 0 }}
                    animate={{ y: '-20vh', opacity: [0, 1, 1, 0], scale: [0, 1.5, 1.5, 0] }}
                    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    className="absolute text-[#E86B6B]"
                  >
                    <Heart fill="currentColor" size={20 + Math.random() * 30} />
                  </motion.div>
                ))}

                {/* Soulmate Found Message */}
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 bg-white/90 backdrop-blur-lg p-8 rounded-[3rem] border-2 border-[#E86B6B] shadow-2xl text-center space-y-6 pointer-events-auto max-w-[280px]"
                >
                  <button 
                    onClick={() => {
                      setDismissedLoveMatchId(activeLoveMatch.uid);
                      setActiveLoveMatch(null);
                    }}
                    className="absolute top-6 right-6 text-[#8C8970] hover:text-[#E86B6B] transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-[#FFF5F5] rounded-full flex items-center justify-center mx-auto overflow-hidden border-2 border-[#E86B6B]">
                      {activeLoveMatch.profilePic ? (
                        <img src={activeLoveMatch.profilePic} alt={activeLoveMatch.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Heart size={40} className="text-[#E86B6B] animate-bounce" fill="currentColor" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-serif text-[#E86B6B]">Soulmate Found!</h2>
                      <p className="text-[#8C8970] text-sm">You are aligned with <span className="font-bold text-[#4A4A3A]">{activeLoveMatch.name}</span></p>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C8970] font-sans font-bold uppercase tracking-widest pt-1">
                        <span>{activeLoveMatch.age} Years</span>
                        <span className="w-1 h-1 bg-[#FFD7D7] rounded-full" />
                        <span>{activeLoveMatch.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => {
                        openChat(activeLoveMatch);
                        setDismissedLoveMatchId(activeLoveMatch.uid);
                        setActiveLoveMatch(null);
                      }}
                      className="w-full py-3 bg-[#E86B6B] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#E86B6B]/20 hover:bg-[#D85B5B] transition-all"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => {
                        setGlobeMatches([activeLoveMatch]);
                        setShowGlobe(true);
                        setDismissedLoveMatchId(activeLoveMatch.uid);
                        setActiveLoveMatch(null);
                      }}
                      className="w-full py-3 bg-white text-[#E86B6B] border-2 border-[#E86B6B] rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#FFF5F5] transition-all flex items-center justify-center gap-2"
                    >
                      <Globe size={14} /> See on Globe
                    </button>
                    <div className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#D4A373]">Destiny is calling...</div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showGlobe && (
              <SoulmateGlobe 
                userUid={user?.uid || ''}
                userLocation={location}
                matches={globeMatches}
                allMatches={userChats.map(c => c.otherUser)}
                rotation={globeRotation}
                onRotationChange={setGlobeRotation}
                onMatchSelect={(match) => {
                  setSelectedChatUser(match);
                  setGlobeMatches([match]);
                }}
                onClose={() => setShowGlobe(false)}
              />
            )}
          </AnimatePresence>

          <main className="relative z-10 w-full max-w-md flex flex-col items-center gap-8 sm:gap-10 my-auto py-8">
            {/* Header */}
            <header className="w-full flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#8C8970] uppercase tracking-[0.2em] text-[10px] font-sans font-semibold">
                  <MapPin size={12} />
                  {location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : "Locating..."}
                </div>
                <h1 className="text-3xl font-serif text-[#D4A373]">Amour <span className="italic text-[#E86B6B]">Compass</span></h1>
              </div>
              <div className="flex gap-2">
                <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-[#FFD7D7]">
                  <a 
                    href="https://www.instagram.com/amourcompass/?hl=en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-[#E86B6B] hover:bg-[#FFF5F5] transition-all"
                    title="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                  <button 
                    onClick={() => setActiveTab('compass')}
                    className={`p-2 rounded-xl transition-all ${activeTab === 'compass' ? 'bg-[#E86B6B] text-white' : 'text-[#8C8970]'}`}
                  >
                    <Compass size={18} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className={`p-2 rounded-xl transition-all relative ${activeTab === 'messages' ? 'bg-[#E86B6B] text-white' : 'text-[#8C8970]'}`}
                  >
                    <MessageCircle size={18} />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className={`p-2 rounded-xl transition-all ${activeTab === 'friends' ? 'bg-[#E86B6B] text-white' : 'text-[#8C8970]'}`}
                  >
                    <Users size={18} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('saved')}
                    className={`p-2 rounded-xl transition-all ${activeTab === 'saved' ? 'bg-[#E86B6B] text-white' : 'text-[#8C8970]'}`}
                  >
                    <Heart size={18} />
                  </button>
                </div>
                <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-[#FFD7D7] text-[#8C8970] hover:border-[#E86B6B] transition-all overflow-hidden flex items-center justify-center">
                  {userData?.profilePic ? (
                    <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Settings size={20} />
                  )}
                </button>
              </div>
            </header>

            {activeTab === 'compass' ? (
              <div className="relative">
                {isLocating && !location && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-2"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-[#E86B6B]"
                    >
                      <MapPin size={24} />
                    </motion.div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E86B6B]">Locating...</span>
                  </motion.div>
                )}
                
                {/* Compass Container */}
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex flex-col items-center justify-center" onMouseMove={handleMouseMove}>
                  {/* Outer Static Ring */}
                  <div className="absolute inset-0 border-[1px] border-[#FFD7D7] rounded-full" />
                  
                  {/* Rotating Compass Card */}
                  <motion.div 
                    style={{ rotate: springHeading }} 
                    className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-white shadow-[0_20px_50px_rgba(232,107,107,0.08)] flex items-center justify-center border border-[#FFD7D7]"
                  >
                    {/* Degree Markers (Inside rotating card) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(72)].map((_, i) => (
                        <div key={i} className="absolute w-[1px] h-full" style={{ transform: `rotate(${i * 5}deg)` }}>
                          <div className={`w-full h-2 ${i % 18 === 0 ? 'bg-[#D4A373] h-3' : 'bg-[#FFD7D7]'}`} />
                        </div>
                      ))}
                    </div>

                    {/* Cardinal Points */}
                    <div className="absolute inset-4 flex flex-col justify-between items-center py-2">
                      <span className="text-xl font-medium text-[#E86B6B]">N</span>
                      <span className="text-xl font-medium text-[#FFD7D7]">S</span>
                    </div>
                    <div className="absolute inset-4 flex justify-between items-center px-2">
                      <span className="text-xl font-medium text-[#FFD7D7]">W</span>
                      <span className="text-xl font-medium text-[#FFD7D7]">E</span>
                    </div>
                  </motion.div>

                  {/* Static Needle (Fixed to device/phone "up" direction) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-1 h-[80%] flex flex-col items-center justify-center">
                      {/* Top half (Red/Dark - points to current heading on the card) */}
                      <div className="w-4 h-[45%] bg-[#E86B6B] rounded-t-full shadow-sm" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                      {/* Bottom half (Light) */}
                      <div className="w-4 h-[45%] bg-[#FFD7D7] rounded-b-full" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
                      {/* Center Pivot */}
                      <div className="absolute w-3 h-3 bg-white border-2 border-[#D4A373] rounded-full z-10" />
                    </div>
                  </div>
                </div>

                {/* Degree & Direction Display (Below Compass) */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-6xl font-light tabular-nums leading-none tracking-tighter text-[#4A4A3A]">{Math.round(heading)}°</div>
                  <div className="text-sm uppercase tracking-[0.3em] text-[#8C8970] font-sans font-bold ml-1">{getDirectionName(heading)}</div>
                </div>

                {/* Soulmate Matches */}
                <div className="w-full space-y-4">
                  {/* User Count Badge (Moved above Potential Soulmates) */}
                  <div className="flex justify-center">
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-white/60 backdrop-blur-sm border border-[#FFD7D7] rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <Users size={14} className="text-[#E86B6B]" />
                      <span className="text-xs font-bold text-[#4A4A3A] tabular-nums">{activeUsersCount} Explorers Online</span>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[#8C8970]">Potential Soulmates</h3>
                    <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-widest">{soulmateMatches.length} Active</span>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {soulmateMatches.length > 0 ? (
                        soulmateMatches.map((match) => (
                          <motion.div 
                            key={match.uid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={() => openChat(match)}
                            className="w-full bg-white/80 backdrop-blur-sm p-4 md:p-5 rounded-[2rem] border border-[#FFD7D7] flex items-center justify-between shadow-sm gap-3 overflow-hidden cursor-pointer hover:bg-white transition-all group"
                          >
                            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                {match.profilePic ? (
                                  <img src={match.profilePic} alt={match.name} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border border-[#FFD7D7] group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center text-[#E86B6B] group-hover:scale-110 transition-transform">
                                    <Heart size={20} className="md:w-6 md:h-6" fill={Math.abs(heading - match.heading) < 15 ? "currentColor" : "none"} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-[#4A4A3A] truncate group-hover:text-[#E86B6B] transition-colors">{match.name}, {match.age}</div>
                                <div className="text-[10px] text-[#8C8970] font-sans uppercase tracking-widest truncate">{match.zodiac} • {match.country}</div>
                                {(() => {
                                  const isZodiacCompatible = ZODIAC_COMPATIBILITY[userData?.zodiac || '']?.includes(match.zodiac);
                                  const ageDiff = Math.abs((userData?.age || 0) - (match.age || 0));
                                  
                                  if (isZodiacCompatible && ageDiff <= 10) {
                                    return <div className="mt-1 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded-full">Soulmate</div>;
                                  } else if (isZodiacCompatible) {
                                    return <div className="mt-1 inline-block px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-bold uppercase tracking-widest rounded-full">Potential Soulmate</div>;
                                  } else {
                                    return <div className="mt-1 inline-block px-2 py-0.5 bg-[#FFF5F5] text-[#E86B6B] text-[8px] font-bold uppercase tracking-widest rounded-full">Compass Match</div>;
                                  }
                                })()}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0">
                              <div className="flex gap-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleSaved(match.uid, 'friends'); }}
                                  className={`p-1.5 md:p-2 rounded-xl border transition-all ${userData?.friends?.includes(match.uid) ? 'bg-[#D4A373] border-[#D4A373] text-white' : 'bg-white border-[#FFD7D7] text-[#8C8970]'}`}
                                >
                                  <UserPlus size={12} className="md:w-3.5 md:h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleSaved(match.uid, 'loves'); }}
                                  className={`p-1.5 md:p-2 rounded-xl border transition-all ${userData?.loves?.includes(match.uid) ? 'bg-[#E86B6B] border-[#E86B6B] text-white' : 'bg-white border-[#FFD7D7] text-[#8C8970]'}`}
                                >
                                  <Heart size={12} className="md:w-3.5 md:h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openChat(match); }}
                                  className="p-1.5 md:p-2 rounded-xl border border-[#FFD7D7] bg-white text-[#8C8970] hover:text-[#E86B6B] transition-all"
                                >
                                  <MessageCircle size={12} className="md:w-3.5 md:h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#8C8970] leading-none mb-0.5">ID</div>
                                <div className="text-[9px] font-mono text-[#4A4A3A] opacity-50 leading-none">{match.uid.slice(0, 6)}...</div>
                              </div>
                              <div className="text-[9px] font-bold text-[#E86B6B] uppercase tracking-tighter leading-none">
                                Opposite Aligned
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 bg-white/30 rounded-[2rem] border border-dashed border-[#FFD7D7]"
                        >
                          <p className="text-sm text-[#8C8970] italic">Rotate your phone to find matches...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Interaction Area */}
                <div className="w-full text-center space-y-4">
                  <AnimatePresence mode="wait">
                    {!permissionGranted && !isDesktop ? (
                      <motion.button 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={requestPermission} 
                        className="px-8 py-4 bg-[#E86B6B] text-white rounded-full text-sm tracking-widest uppercase font-sans font-bold shadow-lg shadow-[#E86B6B]/20"
                      >
                        Wake up Compass
                      </motion.button>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-[#8C8970] text-[10px] font-sans uppercase tracking-widest font-bold">
                          <div className={`w-2 h-2 rounded-full ${sensorStatus === 'active' ? 'bg-emerald-400 animate-pulse' : sensorStatus === 'stuck' ? 'bg-amber-400' : sensorStatus === 'relative' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                          {sensorStatus === 'active' ? 'True North Aligned' : sensorStatus === 'stuck' ? 'Compass Stuck? Move Phone' : sensorStatus === 'relative' ? 'Relative Mode (No Magnetometer)' : 'Waiting for Sensors...'}
                        </div>
                        {!isDesktop && (
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] text-[#A09E88] uppercase tracking-tighter">
                              Tip: Move in a figure-8 to calibrate
                            </p>
                            {sensorStatus === 'stuck' && (
                              <button 
                                onClick={requestPermission}
                                className="text-[9px] text-[#E86B6B] font-bold uppercase tracking-widest underline"
                              >
                                Reset Sensors
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : activeTab === 'messages' ? (
              <div className="w-full space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[#E86B6B] px-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} fill="currentColor" /> Recent Chats
                    </div>
                    <button 
                      onClick={() => {
                        const allFriends = userChats.map(c => c.otherUser);
                        setGlobeMatches(allFriends);
                        setShowGlobe(true);
                      }}
                      className="p-2 bg-white rounded-xl border border-[#FFD7D7] text-[#8C8970] hover:text-[#E86B6B] hover:border-[#E86B6B] transition-all flex items-center gap-2"
                      title="See all friends on globe"
                    >
                      <Globe size={14} />
                      <span className="text-[10px]">Global View</span>
                    </button>
                  </h3>
                  <div className="space-y-3">
                    {userChats.length > 0 ? (
                      userChats.map((chat) => {
                        const isUnread = chat.lastMessage?.senderId !== user?.uid && 
                                       (chat.updatedAt?.toMillis?.() || 0) > (chat.lastRead?.[user?.uid || '']?.toMillis?.() || 0);
                        
                        return (
                          <motion.div 
                            key={chat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => openChat(chat.otherUser)}
                            className={`w-full p-5 rounded-[2rem] border flex items-center justify-between shadow-sm cursor-pointer transition-all ${
                              isUnread ? 'bg-white border-[#E86B6B] ring-1 ring-[#E86B6B]/10' : 'bg-white/80 border-[#FFD7D7] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                {chat.otherUser.profilePic ? (
                                  <img src={chat.otherUser.profilePic} alt={chat.otherUser.name} className="w-12 h-12 rounded-2xl object-cover border border-[#FFD7D7]" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-12 h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center text-[#E86B6B] font-serif italic text-xl">
                                    {chat.otherUser.name[0]}
                                  </div>
                                )}
                                {isUnread && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E86B6B] border-2 border-white rounded-full" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm truncate ${isUnread ? 'font-black text-[#4A4A3A]' : 'font-bold text-[#4A4A3A]'}`}>
                                  {chat.otherUser.name}
                                </div>
                                <div className={`text-[10px] truncate pr-4 ${isUnread ? 'text-[#4A4A3A] font-medium' : 'text-[#8C8970]'}`}>
                                  {chat.lastMessage?.senderId === user?.uid ? 'You: ' : ''}{chat.lastMessage?.text}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-[8px] font-sans font-bold uppercase tracking-widest ${isUnread ? 'text-[#E86B6B]' : 'text-[#8C8970]'}`}>
                                {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-white/30 rounded-[2rem] border border-dashed border-[#FFD7D7]">
                        <p className="text-sm text-[#8C8970] italic">No active chats yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'friends' ? (
              <div className="w-full space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[#D4A373] px-2 flex items-center gap-2">
                    <Users size={14} /> Friend List
                  </h3>
                  <div className="space-y-3">
                    {allUsers.filter(u => userData?.friends?.includes(u.uid)).length > 0 ? (
                      allUsers.filter(u => userData?.friends?.includes(u.uid)).map(saved => (
                        <motion.div 
                          key={saved.uid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => openChat(saved)}
                          className="w-full bg-white p-4 md:p-5 rounded-[2rem] border border-[#FFD7D7] flex items-center justify-between shadow-sm gap-3 overflow-hidden cursor-pointer hover:bg-[#FFF5F5] transition-all group"
                        >
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {saved.profilePic ? (
                                <img src={saved.profilePic} alt={saved.name} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border border-[#FFD7D7] group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center text-[#D4A373] font-serif italic text-lg md:text-xl group-hover:scale-110 transition-transform">
                                  {saved.name[0]}
                                </div>
                              )}
                              {saved.lastSeen?.toMillis && saved.lastSeen.toMillis() > Date.now() - 300000 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[#4A4A3A] truncate group-hover:text-[#D4A373] transition-colors">{saved.name}, {saved.age}</div>
                              <div className="text-[10px] text-[#8C8970] font-sans uppercase tracking-widest truncate">{saved.zodiac} • {saved.country}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openChat(saved); }}
                              className="p-2 md:p-3 text-[#D4A373] hover:bg-[#D4A373]/5 rounded-xl transition-all"
                            >
                              <MessageCircle size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleSaved(saved.uid, 'friends'); }}
                              className="p-2 md:p-3 text-[#D4A373] hover:bg-[#D4A373]/5 rounded-xl transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white/30 rounded-[2rem] border border-dashed border-[#FFD7D7]">
                        <p className="text-sm text-[#8C8970] italic">No friends added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[#E86B6B] px-2 flex items-center gap-2">
                    <Heart size={14} fill="currentColor" /> Love List
                  </h3>
                  <div className="space-y-3">
                    {allUsers.filter(u => userData?.loves?.includes(u.uid)).length > 0 ? (
                      allUsers.filter(u => userData?.loves?.includes(u.uid)).map(saved => (
                        <motion.div 
                          key={saved.uid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => openChat(saved)}
                          className="w-full bg-white p-4 md:p-5 rounded-[2rem] border border-[#FFD7D7] flex items-center justify-between shadow-sm gap-3 overflow-hidden cursor-pointer hover:bg-[#FFF5F5] transition-all group"
                        >
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {saved.profilePic ? (
                                <img src={saved.profilePic} alt={saved.name} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border border-[#FFD7D7] group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FFF5F5] rounded-2xl flex items-center justify-center text-[#E86B6B] group-hover:scale-110 transition-transform">
                                  <Heart size={20} className="md:w-6 md:h-6" fill="currentColor" />
                                </div>
                              )}
                              {saved.lastSeen?.toMillis && saved.lastSeen.toMillis() > Date.now() - 300000 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[#4A4A3A] truncate group-hover:text-[#E86B6B] transition-colors">{saved.name}, {saved.age}</div>
                              <div className="text-[10px] text-[#8C8970] font-sans uppercase tracking-widest truncate">{saved.zodiac} • {saved.country}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openChat(saved); }}
                              className="p-2 md:p-3 text-[#E86B6B] hover:bg-[#E86B6B]/5 rounded-xl transition-all"
                            >
                              <MessageCircle size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleSaved(saved.uid, 'loves'); }}
                              className="p-2 md:p-3 text-[#E86B6B] hover:bg-[#E86B6B]/5 rounded-xl transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white/30 rounded-[2rem] border border-dashed border-[#FFD7D7]">
                        <p className="text-sm text-[#8C8970] italic">No one in your love list yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Home Page Footer - Minimal */}
            <footer className="w-full mt-12 pb-8 border-t border-[#FFD7D7] pt-8 text-center">
              <div className="text-[8px] font-sans font-bold uppercase tracking-[0.4em] text-[#D4A373]/40">
                All rights reserved for Amour Compass by Crea8tiv
              </div>
            </footer>
          </main>

          {/* Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#E86B6B]/10 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-sm max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-[#FFD7D7] overflow-hidden">
                  <div className="flex justify-between items-center gap-2 p-6 sm:p-8 pb-4 shrink-0 bg-white z-10 border-b border-[#FFD7D7]/30">
                    <h3 className="text-xl sm:text-2xl font-serif text-[#D4A373] truncate">Settings</h3>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <button onClick={openEditProfile} className="text-[10px] font-bold uppercase tracking-widest text-[#E86B6B] bg-[#FFF5F5] px-2 sm:px-3 py-1 rounded-lg border border-[#FFD7D7]">Edit Profile</button>
                      <button onClick={closeSettings} className="text-[#8C8970] p-1">✕</button>
                    </div>
                  </div>

                  <div className="overflow-y-auto p-6 sm:p-8 pt-4 space-y-6 sm:space-y-8">
                    <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8970]">Your Username</label>
                      {userData?.username ? (
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFF5F5] rounded-2xl border border-[#FFD7D7] gap-2">
                          <span className="font-medium text-[#4A4A3A] truncate">@{userData.username}</span>
                          <span className="text-[10px] text-[#E86B6B] uppercase font-bold shrink-0">Active</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input 
                              value={usernameInput}
                              onChange={(e) => {
                                setUsernameInput(e.target.value.replace(/[^a-z0-9_]/gi, ''));
                                setUsernameError(null);
                              }}
                              placeholder="choose_a_username"
                              className="flex-1 min-w-0 p-3 sm:p-4 bg-[#FFF5F5]/30 border border-[#FFD7D7] rounded-2xl focus:outline-none focus:border-[#E86B6B] transition-all text-sm"
                            />
                            <button 
                              onClick={handleSetUsername}
                              disabled={isSettingUsername || !usernameInput}
                              className="px-4 sm:px-6 shrink-0 bg-[#E86B6B] text-white rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                            >
                              {isSettingUsername ? '...' : 'Set'}
                            </button>
                          </div>
                          {usernameError && (
                            <p className="text-[10px] text-[#E86B6B] font-bold uppercase tracking-tight">{usernameError}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8970]">Profile Details</label>
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#FFD7D7] bg-[#FFF5F5] flex-shrink-0">
                          {userData?.profilePic ? (
                            <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-serif italic text-[#E86B6B]">
                              {userData?.name?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#4A4A3A] truncate">{userData?.name || 'N/A'}</div>
                          <div className="text-[10px] text-[#8C8970] uppercase tracking-widest truncate">{userData?.zodiac || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 sm:p-3 bg-[#FFF5F5]/50 rounded-xl border border-[#FFD7D7] min-w-0">
                          <div className="text-[8px] uppercase text-[#8C8970] font-bold truncate">Age</div>
                          <div className="text-xs font-medium text-[#4A4A3A] truncate">{userData?.age || 'N/A'}</div>
                        </div>
                        <div className="p-2 sm:p-3 bg-[#FFF5F5]/50 rounded-xl border border-[#FFD7D7] min-w-0">
                          <div className="text-[8px] uppercase text-[#8C8970] font-bold truncate">Gender</div>
                          <div className="text-xs font-medium text-[#4A4A3A] truncate">{userData?.gender || 'N/A'}</div>
                        </div>
                        <div className="p-2 sm:p-3 bg-[#FFF5F5]/50 rounded-xl border border-[#FFD7D7] min-w-0">
                          <div className="text-[8px] uppercase text-[#8C8970] font-bold truncate">Country</div>
                          <div className="text-xs font-medium text-[#4A4A3A] truncate">{userData?.country || 'N/A'}</div>
                        </div>
                        <div className="p-2 sm:p-3 bg-[#FFF5F5]/50 rounded-xl border border-[#FFD7D7] min-w-0">
                          <div className="text-[8px] uppercase text-[#8C8970] font-bold truncate">Language</div>
                          <div className="text-xs font-medium text-[#4A4A3A] truncate">{userData?.language || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8970]">Love Mode</label>
                      <button 
                        onClick={() => {
                          updateDoc(doc(db, 'users', user.uid), {
                            lookingForLove: !userData.lookingForLove
                          });
                        }}
                        className={`w-full p-3 sm:p-4 rounded-2xl border flex items-center justify-between transition-all gap-2 ${userData?.lookingForLove ? 'bg-[#FFF5F5] border-[#E86B6B]' : 'bg-white border-[#FFD7D7]'}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Heart size={18} className={`shrink-0 ${userData?.lookingForLove ? 'text-[#E86B6B]' : 'text-[#8C8970]'}`} fill={userData?.lookingForLove ? 'currentColor' : 'none'} />
                          <span className={`text-xs sm:text-sm font-medium truncate ${userData?.lookingForLove ? 'text-[#E86B6B]' : 'text-[#8C8970]'}`}>
                            {userData?.lookingForLove ? 'Looking for Love' : 'Friend Mode Only'}
                          </span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${userData?.lookingForLove ? 'bg-[#E86B6B]' : 'bg-[#8C8970]/20'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userData?.lookingForLove ? 'right-1' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8970]">Your ID (Backup)</label>
                        <button onClick={copyId} className="text-[10px] text-[#E86B6B] font-bold uppercase hover:underline shrink-0 ml-2">Copy</button>
                      </div>
                      <div className="p-3 sm:p-4 bg-[#FFF5F5] rounded-2xl font-mono text-[10px] break-all select-all border border-[#FFD7D7] opacity-60">{user.uid}</div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8970]">Support & Community</label>
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href="mailto:emojibadges@zohomail.in" 
                          className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[#FFF5F5] rounded-xl border border-[#FFD7D7] hover:bg-[#E86B6B]/5 transition-all min-w-0"
                        >
                          <Mail size={14} className="text-[#E86B6B] shrink-0" />
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#4A4A3A] uppercase tracking-widest truncate">Support</span>
                        </a>
                        <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[#FDFCF8] rounded-xl border border-[#D4A373]/20 min-w-0">
                          <ShieldCheck size={14} className="text-[#D4A373] shrink-0" />
                          <span className="text-[8px] sm:text-[9px] font-bold text-[#8C8970] uppercase tracking-widest truncate">Crea8tiv Team</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={logout}
                        className="w-full py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-[#E86B6B] hover:bg-[#E86B6B]/5 rounded-2xl transition-all"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Full Screen View */}
          <AnimatePresence>
            {selectedChatUser && (
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-0 z-[110] bg-[#FDFCF8] flex flex-col overflow-hidden"
              >
                {!hasAcceptedSafetyWarning ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 bg-gradient-to-b from-[#FFF5F5] to-white">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-[#FFD7D7] relative">
                      <ShieldCheck size={48} className="text-[#D4A373]" />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-[#E86B6B] rounded-full flex items-center justify-center text-white shadow-lg"
                      >
                        <Heart size={16} fill="white" />
                      </motion.div>
                    </div>
                    
                    <div className="space-y-4 max-w-sm">
                      <h2 className="text-3xl font-serif text-[#D4A373]">Safety First, <span className="italic text-[#E86B6B]">Always</span></h2>
                      <p className="text-sm text-[#8C8970] leading-relaxed">
                        To keep our community beautiful and safe, please remember to <span className="font-bold text-[#4A4A3A]">never share</span> sensitive information like your <span className="text-[#E86B6B]">phone number, email, address, or OTPs</span>.
                      </p>
                      <p className="text-xs italic text-[#8C8970]">
                        True connections are built on trust and respect.
                      </p>
                    </div>

                    <div className="flex flex-col w-full max-w-xs gap-3">
                      <button 
                        onClick={() => setHasAcceptedSafetyWarning(true)}
                        className="w-full py-5 bg-[#E86B6B] text-white rounded-full font-sans font-bold tracking-[0.2em] uppercase text-xs shadow-xl shadow-[#E86B6B]/20 hover:scale-105 transition-all"
                      >
                        I Understand & Agree
                      </button>
                      <button 
                        onClick={closeChat}
                        className="w-full py-4 text-[#8C8970] font-sans font-bold tracking-[0.2em] uppercase text-[10px] hover:text-[#4A4A3A] transition-all"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                <div className="pt-10 pb-3 px-4 border-b border-[#FFD7D7] flex justify-between items-center bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={closeChat} 
                      className="p-1 text-[#8C8970] hover:text-[#E86B6B] transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                      {selectedChatUser.profilePic ? (
                        <img src={selectedChatUser.profilePic} alt={selectedChatUser.name} className="w-9 h-9 rounded-xl object-cover border border-[#FFD7D7] shadow-sm" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-9 h-9 bg-[#E86B6B] rounded-xl flex items-center justify-center text-white font-serif italic text-lg shadow-sm">
                          {selectedChatUser.name[0]}
                        </div>
                      )}
                      {selectedChatUser.lastSeen?.toMillis && selectedChatUser.lastSeen.toMillis() > Date.now() - 300000 && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#4A4A3A] truncate max-w-[80px]">{selectedChatUser.name}</h3>
                      <p className="text-[9px] text-[#8C8970] uppercase tracking-tighter truncate">{selectedChatUser.zodiac}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        setGlobeMatches([selectedChatUser]);
                        setShowGlobe(true);
                      }}
                      className="p-1.5 rounded-lg border border-[#FFD7D7] bg-white text-[#8C8970] hover:text-[#E86B6B] transition-all"
                    >
                      <Globe size={16} />
                    </button>
                    <button 
                      onClick={() => toggleSaved(selectedChatUser.uid, 'loves')}
                      className={`p-1.5 rounded-lg border transition-all ${userData?.loves?.includes(selectedChatUser.uid) ? 'bg-[#E86B6B] border-[#E86B6B] text-white' : 'bg-white border-[#FFD7D7] text-[#8C8970]'}`}
                    >
                      <Heart size={16} fill={userData?.loves?.includes(selectedChatUser.uid) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                

                  {/* Potential Soulmates Section */}
                  {soulmateMatches.length > 0 && (
                    <div className="px-6 py-3 bg-[#FFF5F5]/50 border-b border-[#FFD7D7]">
                      <div className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#8C8970] mb-2 flex items-center gap-1">
                        <Sparkles size={10} /> Other Potential Soulmates
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {soulmateMatches.filter(m => m.uid !== selectedChatUser.uid).map(match => (
                          <button 
                            key={match.uid}
                            onClick={() => openChat(match)}
                            className="flex-shrink-0 flex items-center gap-2 p-2 bg-white rounded-xl border border-[#FFD7D7] hover:border-[#E86B6B] transition-all max-w-[140px] overflow-hidden"
                          >
                            {match.profilePic ? (
                              <img src={match.profilePic} alt={match.name} className="w-6 h-6 rounded-lg object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-6 h-6 bg-[#E86B6B]/10 rounded-lg flex-shrink-0 flex items-center justify-center text-[#E86B6B] text-[10px] font-serif italic">
                                {match.name[0]}
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-[#4A4A3A] truncate">{match.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FDFCF8]">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="w-20 h-20 bg-[#E86B6B]/5 rounded-full flex items-center justify-center">
                          <MessageCircle size={40} className="text-[#E86B6B]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#4A4A3A] uppercase tracking-widest">Start a Conversation</p>
                          <p className="text-xs italic text-[#8C8970] mt-1">Send a heart or a hug to {selectedChatUser.name}!</p>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                            msg.senderId === user.uid 
                              ? 'bg-[#E86B6B] text-white rounded-tr-none' 
                              : 'bg-white border border-[#FFD7D7] text-[#4A4A3A] rounded-tl-none'
                          }`}>
                            {msg.type === 'card_request' ? (
                              <div className="space-y-2 min-w-[180px]">
                                <div className={`flex items-center gap-2 ${msg.senderId === user.uid ? 'text-white/80' : 'text-[#8C8970]'}`}>
                                  {msg.cardType === 'soulmate' ? <Heart size={12} fill={msg.senderId === user.uid ? 'white' : '#E86B6B'} /> : <Sparkles size={12} />}
                                  <p className="text-[9px] font-bold uppercase tracking-widest leading-none">
                                    {msg.senderId === user.uid ? `Card Requested` : `${selectedChatUser.name} requested card`}
                                  </p>
                                </div>
                                
                                {msg.status === 'pending' && msg.senderId !== user.uid && (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => respondToCardRequest(msg.id, 'accepted', msg.cardType)}
                                      className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1 shadow-sm"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => respondToCardRequest(msg.id, 'declined', msg.cardType)}
                                      className="flex-1 py-1.5 bg-black/10 text-black/40 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                                
                                {msg.status !== 'pending' && (
                                  <div className={`text-[9px] font-bold uppercase flex items-center gap-1 ${msg.status === 'accepted' ? 'text-emerald-500' : 'text-red-400'} ${msg.senderId === user.uid ? 'text-white' : ''}`}>
                                    {msg.status === 'accepted' ? <Check size={10} /> : <XCircle size={10} />}
                                    {msg.status === 'accepted' ? 'Accepted' : 'Declined'}
                                  </div>
                                )}
                              </div>
                            ) : msg.type === 'card_generated' ? (
                              <div className="space-y-4 min-w-[240px]">
                                <div className="relative group overflow-hidden rounded-2xl border border-white/20">
                                  <div className="scale-[0.5] origin-top -mb-[240px] -mx-[80px]">
                                    <ConnectionCard 
                                      type={msg.cardType} 
                                      user1={msg.senderId === user.uid ? userData : selectedChatUser} 
                                      user2={msg.senderId === user.uid ? selectedChatUser : userData}
                                      cardRef={null as any}
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button 
                                      onClick={() => downloadCard({
                                        type: msg.cardType,
                                        user1: msg.senderId === user.uid ? userData : selectedChatUser,
                                        user2: msg.senderId === user.uid ? selectedChatUser : userData
                                      })}
                                      className="p-3 bg-white text-[#4A4A3A] rounded-full shadow-xl hover:scale-110 transition-all"
                                    >
                                      <Download size={24} />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2 pt-2">
                                  <p className={`text-[10px] font-bold uppercase tracking-widest ${msg.senderId === user.uid ? 'text-white/80' : 'text-[#8C8970]'}`}>Beautiful {msg.cardType} Card Generated!</p>
                                  <button 
                                    onClick={() => downloadCard({
                                      type: msg.cardType,
                                      user1: msg.senderId === user.uid ? userData : selectedChatUser,
                                      user2: msg.senderId === user.uid ? selectedChatUser : userData
                                    })}
                                    disabled={isGeneratingCard}
                                    className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${
                                      msg.senderId === user.uid 
                                        ? 'bg-white text-[#E86B6B] hover:bg-[#FFF5F5]' 
                                        : 'bg-[#4A4A3A] text-white hover:bg-[#E86B6B]'
                                    }`}
                                  >
                                    {isGeneratingCard ? 'Generating...' : <><Download size={14} /> Download & Share</>}
                                  </button>
                                </div>
                              </div>
                            ) : msg.type === 'emoji' ? (
                              <div className="text-5xl py-2 text-center">{msg.emoji}</div>
                            ) : (
                              <p className="leading-relaxed">{msg.text}</p>
                            )}
                            <div className={`text-[8px] mt-2 uppercase font-bold opacity-60 flex items-center gap-1 ${msg.senderId === user.uid ? 'text-white justify-end' : 'text-[#8C8970]'}`}>
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input Area */}
                  <div className="pb-8 pt-4 px-4 border-t border-[#FFD7D7] bg-white relative z-50">
                    <AnimatePresence>
                      {showChatActions && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-4 mb-4 p-4 bg-white rounded-3xl border border-[#FFD7D7] shadow-2xl space-y-4 min-w-[200px]"
                        >
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-[#8C8970] uppercase tracking-widest pl-2">Send Magic Card</p>
                            <button 
                              onClick={() => { sendCardRequest('soulmate'); setShowChatActions(false); }}
                              className="w-full flex items-center gap-3 p-3 bg-[#FFF5F5] rounded-2xl border border-[#FFD7D7] hover:bg-[#E86B6B]/10 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#E86B6B] shadow-sm">
                                <Heart size={14} fill="currentColor" />
                              </div>
                              <span className="text-xs font-bold text-[#4A4A3A]">Soulmate Card</span>
                            </button>
                            <button 
                              onClick={() => { sendCardRequest('friendship'); setShowChatActions(false); }}
                              className="w-full flex items-center gap-3 p-3 bg-[#FDFCF8] rounded-2xl border border-[#D4A373]/20 hover:bg-[#D4A373]/10 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#D4A373] shadow-sm">
                                <Sparkles size={14} />
                              </div>
                              <span className="text-xs font-bold text-[#4A4A3A]">Friendship Card</span>
                            </button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-[#8C8970] uppercase tracking-widest pl-2">Quick Reaction</p>
                            <div className="flex gap-2">
                              {['❤️', '🫂', '✨', '🌹'].map(emoji => (
                                <button 
                                  key={emoji}
                                  onClick={() => { sendChatMessage('emoji', emoji); setShowChatActions(false); }}
                                  className="flex-1 py-3 bg-[#FFF5F5] border border-[#FFD7D7] rounded-xl text-xl hover:scale-110 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex gap-2 items-end">
                      <button 
                        onClick={() => setShowChatActions(!showChatActions)}
                        className={`p-3.5 rounded-2xl border transition-all shrink-0 ${showChatActions ? 'bg-[#4A4A3A] border-[#4A4A3A] text-white rotate-45' : 'bg-[#FFF5F5] border-[#FFD7D7] text-[#E86B6B] hover:shadow-md'}`}
                      >
                        <Plus size={20} />
                      </button>
                      
                      <div className="flex-1 relative pb-0.5">
                        <AnimatePresence>
                          {chatError && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute -top-10 left-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest p-2 rounded-xl text-center border border-red-200 shadow-sm z-50"
                            >
                              {chatError}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <input 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onFocus={() => setShowChatActions(false)}
                          onKeyDown={(e) => e.key === 'Enter' && chatInput && sendChatMessage('text', chatInput)}
                          placeholder="Speak from the heart..."
                          className="w-full p-3.5 bg-[#FFF5F5]/50 border border-[#FFD7D7] rounded-2xl focus:outline-none focus:border-[#E86B6B] transition-all text-sm placeholder:text-[#8C8970]/50"
                        />
                      </div>
                      <button 
                        onClick={() => chatInput && sendChatMessage('text', chatInput)}
                        disabled={!chatInput}
                        className="p-3.5 bg-[#E86B6B] text-white rounded-2xl disabled:opacity-50 hover:shadow-lg transition-all shrink-0 shadow-sm"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Card for Download */}
          <div className="fixed -left-[9999px] top-0 pointer-events-none">
            {cardToDownload && (
              <ConnectionCard 
                type={cardToDownload.type}
                user1={cardToDownload.user1}
                user2={cardToDownload.user2}
                cardRef={cardRef}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
