import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Trash2,
  Zap,
  Bot,
  BarChart3,
  Target,
  Clock,
  Settings,
  Plus,
  ChevronRight,
  TrendingUp,
  X,
  Flame,
  Sparkles,
  Edit2,
  Calendar,
  Recycle,
  Scale,
  PieChart as PieChartIcon,
  Send,
  Loader2,
  ExternalLink,
  Lightbulb,
  Activity,
  Download,
  CalendarRange,
  Award,
  Check,
  ShieldCheck,
  Search,
  CheckCircle,
  CheckCircle2,
  User,
  MapPin,
  Sliders,
  Database,
  AlertTriangle,
  RotateCcw,
  Key,
  BarChart2,
  Users,
  Heart,
  MessageSquare,
  Globe,
  Lock,
  HandHeart,
  DollarSign,
  Leaf
} from 'lucide-react';

import {
  WasteCategory,
  DisposalMethod,
  WasteEntry,
  EnergyApplianceCategory,
  EnergyEntry,
  CoachMessage,
  WasteAuditResult,
  Mission,
  ConfirmedSmartAction,
  TimelineFeedItem,
  UserPreferences,
  CommunityComment,
  CommunityPost,
  Community,
  ActiveTab
} from './src/types';

import {
  MATERIAL_CARBON_FACTORS,
  REGIONAL_GRID_INTENSITY_KG_PER_KWH,
  KG_TO_LBS,
  INITIAL_PREFERENCES,
  INITIAL_MISSIONS,
  INITIAL_WASTE_ENTRIES,
  INITIAL_ENERGY_ENTRIES,
  INITIAL_SAVED_ACTIONS,
  INITIAL_COMMUNITIES,
  INITIAL_COMMUNITY_POSTS
} from './src/constants';

import { fetchGeminiWithBackoff, getGeminiEndpoint } from './src/services/geminiService';
import { auditWasteLocally, estimateActionLocally, replyWithLocalGuidance } from './src/services/localEcoTools';
import { Sidebar } from './src/components/Sidebar';
import { Header } from './src/components/Header';
import { MethodologyModal } from './src/components/MethodologyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('terramind_user_preferences');
      return saved ? JSON.parse(saved) : INITIAL_PREFERENCES;
    } catch {
      return INITIAL_PREFERENCES;
    }
  });

  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSampleDatasetPresent, setIsSampleDatasetPresent] = useState(() => {
    try { return localStorage.getItem('terramind_sample_data_cleared') !== 'true'; } catch { return true; }
  });

  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_waste_entries');
      return saved ? JSON.parse(saved) : INITIAL_WASTE_ENTRIES;
    } catch {
      return INITIAL_WASTE_ENTRIES;
    }
  });

  const [energyEntries, setEnergyEntries] = useState<EnergyEntry[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_energy_entries');
      return saved ? JSON.parse(saved) : INITIAL_ENERGY_ENTRIES;
    } catch {
      return INITIAL_ENERGY_ENTRIES;
    }
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_missions_list');
      return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
    } catch {
      return INITIAL_MISSIONS;
    }
  });

  const [confirmedActions, setConfirmedActions] = useState<ConfirmedSmartAction[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_saved_actions');
      return saved ? JSON.parse(saved) : INITIAL_SAVED_ACTIONS;
    } catch {
      return INITIAL_SAVED_ACTIONS;
    }
  });

  const [communities, setCommunities] = useState<Community[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_communities_list');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITIES;
    } catch {
      return INITIAL_COMMUNITIES;
    }
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('terramind_community_posts');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
    } catch {
      return INITIAL_COMMUNITY_POSTS;
    }
  });

  const [communityViewMode, setCommunityViewMode] = useState<'discover' | 'my_communities' | 'feed'>('discover');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState<'All' | 'Cleanups' | 'Composting' | 'Solar & Energy' | 'Biodiversity'>('All');
  
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingCommunityTarget, setFundingCommunityTarget] = useState<Community | null>(null);
  const [fundingPledgeAmount, setFundingPledgeAmount] = useState<number>(500);
  const [fundingSuccessToast, setFundingSuccessToast] = useState(false);
  const [activeCommentInput, setActiveCommentInput] = useState<Record<string, string>>({});

  const [newCommunityForm, setNewCommunityForm] = useState({
    name: '',
    location: '',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
    isPublic: true,
    category: 'Cleanups' as Community['category'],
    hasFundingGoal: false,
    goalTitle: '',
    targetAmount: '10000',
    fundingPurpose: ''
  });

  const [newPostForm, setNewPostForm] = useState({
    communityId: '',
    title: '',
    content: '',
    imageUrl: '',
    wasteCollectedKg: '',
    volunteersAttended: ''
  });

  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<'all' | 'waste' | 'energy' | 'mission' | 'smart_action'>('all');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('');
  const [missionsCategoryFilter, setMissionsCategoryFilter] = useState<'all' | 'Waste' | 'Energy' | 'Transport'>('all');
  const [missionsStatusFilter, setMissionsStatusFilter] = useState<'all' | 'joined' | 'completed'>('all');
  const [analyticsDateRange, setAnalyticsDateRange] = useState<'all' | 'last30' | 'last90' | 'currentMonth'>('all');

  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [editingEnergyId, setEditingEnergyId] = useState<string | null>(null);
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);
  
  const [energyForm, setEnergyForm] = useState<{
    applianceName: string;
    category: EnergyApplianceCategory;
    kwhConsumed: string;
    date: string;
    notes: string;
  }>({
    applianceName: '',
    category: 'Kitchen',
    kwhConsumed: '',
    date: todayStr,
    notes: ''
  });

  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [editingWasteId, setEditingWasteId] = useState<string | null>(null);
  const [wasteForm, setWasteForm] = useState<{
    category: WasteCategory;
    quantityKg: string;
    date: string;
    method: DisposalMethod;
    notes: string;
  }>({
    category: 'Plastic',
    quantityKg: '',
    date: todayStr,
    method: 'Recycled',
    notes: ''
  });

  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([
    {
      id: 'm-0',
      sender: 'assistant',
      text: "Hi, I’m your TerraMind Eco-Coach. Ask about your logged waste or energy, and I’ll suggest a practical next step. Basic guidance works on this device; optional Gemini answers use the household summary shown in Settings.",
      timestamp: 'Just now'
    }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachErrorBanner, setCoachErrorBanner] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isAuditingWaste, setIsAuditingWaste] = useState(false);
  const [wasteAuditResult, setWasteAuditResult] = useState<WasteAuditResult | null>(null);
  const [wasteAuditError, setWasteAuditError] = useState<string | null>(null);

  const [smartActionInput, setSmartActionInput] = useState('');
  const [isAnalyzingAction, setIsAnalyzingAction] = useState(false);
  const [smartActionError, setSmartActionError] = useState<string | null>(null);
  const [smartActionFeedback, setSmartActionFeedback] = useState<{
    detectedCategory: string;
    co2SavedKg: number;
    points: number;
    insight: string;
    confidenceRating: 'High' | 'Medium' | 'Approximate';
    assumptionsUsed: string;
  } | null>(null);

  const weightUnit = userPreferences.unitSystem === 'imperial' ? 'lbs' : 'kg';

  const formatWeight = useCallback((kg: number) => {
    if (userPreferences.unitSystem === 'imperial') {
      return (kg * KG_TO_LBS).toFixed(1);
    }
    return kg.toFixed(1);
  }, [userPreferences.unitSystem]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_user_preferences', JSON.stringify(userPreferences));
    } catch (e) {
      console.error(e);
    }
  }, [userPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_waste_entries', JSON.stringify(wasteEntries));
    } catch (e) {
      console.error(e);
    }
  }, [wasteEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_energy_entries', JSON.stringify(energyEntries));
    } catch (e) {
      console.error(e);
    }
  }, [energyEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_missions_list', JSON.stringify(missions));
    } catch (e) {
      console.error(e);
    }
  }, [missions]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_saved_actions', JSON.stringify(confirmedActions));
    } catch (e) {
      console.error(e);
    }
  }, [confirmedActions]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_communities_list', JSON.stringify(communities));
    } catch (e) {
      console.error(e);
    }
  }, [communities]);

  useEffect(() => {
    try {
      localStorage.setItem('terramind_community_posts', JSON.stringify(communityPosts));
    } catch (e) {
      console.error(e);
    }
  }, [communityPosts]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'terramind_waste_entries') {
          setWasteEntries(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_energy_entries') {
          setEnergyEntries(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_missions_list') {
          setMissions(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_saved_actions') {
          setConfirmedActions(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_user_preferences') {
          setUserPreferences(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_communities_list') {
          setCommunities(JSON.parse(e.newValue));
        } else if (e.key === 'terramind_community_posts') {
          setCommunityPosts(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLogModalOpen(false);
        setIsWasteModalOpen(false);
        setIsEnergyModalOpen(false);
        setIsClearModalOpen(false);
        setIsMethodologyModalOpen(false);
        setIsCreateCommunityModalOpen(false);
        setIsCreatePostModalOpen(false);
        setIsFundingModalOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [coachMessages, isCoachLoading]);

  const wasteStats = useMemo(() => {
    const total = wasteEntries.reduce((sum, item) => sum + item.quantityKg, 0);
    const recycled = wasteEntries
      .filter(item => item.method === 'Recycled' || item.method === 'Composted' || item.method === 'Donated/Reused')
      .reduce((sum, item) => sum + item.quantityKg, 0);
    const diversionRate = total > 0 ? Math.round((recycled / total) * 100) : 0;

    const byCategory: Record<WasteCategory, number> = {
      Plastic: 0,
      Paper: 0,
      Organic: 0,
      Glass: 0,
      Metal: 0
    };

    const byCategoryDiverted: Record<WasteCategory, number> = {
      Plastic: 0,
      Paper: 0,
      Organic: 0,
      Glass: 0,
      Metal: 0
    };

    wasteEntries.forEach(item => {
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category] += item.quantityKg;
        if (item.method === 'Recycled' || item.method === 'Composted' || item.method === 'Donated/Reused') {
          byCategoryDiverted[item.category] += item.quantityKg;
        }
      }
    });

    let materialAvoidedCarbonKg = 0;
    (Object.keys(byCategoryDiverted) as WasteCategory[]).forEach(cat => {
      materialAvoidedCarbonKg += byCategoryDiverted[cat] * MATERIAL_CARBON_FACTORS[cat];
    });

    return { 
      total, 
      recycled, 
      diversionRate, 
      byCategory, 
      byCategoryDiverted, 
      materialAvoidedCarbonKg,
      count: wasteEntries.length 
    };
  }, [wasteEntries]);

  const energyStats = useMemo(() => {
    const totalKwh = energyEntries.reduce((sum, item) => sum + item.kwhConsumed, 0);
    const count = energyEntries.length;
    const averagePerEntry = count > 0 ? totalKwh / count : 0;

    const byCategory: Record<EnergyApplianceCategory, number> = {
      'HVAC / Heating': 0,
      Kitchen: 0,
      Entertainment: 0,
      Computing: 0,
      Laundry: 0,
      Lighting: 0,
      Other: 0
    };

    energyEntries.forEach(item => {
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category] += item.kwhConsumed;
      } else {
        byCategory['Other'] += item.kwhConsumed;
      }
    });

    const byAppliance: Record<string, number> = {};
    energyEntries.forEach(item => {
      byAppliance[item.applianceName] = (byAppliance[item.applianceName] || 0) + item.kwhConsumed;
    });
    const topApplianceEntry = Object.entries(byAppliance).sort((a, b) => b[1] - a[1])[0];

    return {
      totalKwh,
      count,
      averagePerEntry,
      byCategory,
      topAppliance: topApplianceEntry ? { name: topApplianceEntry[0], kwh: topApplianceEntry[1] } : null
    };
  }, [energyEntries]);

  const activeStreakDays = useMemo(() => {
    const loggedDates = new Set<string>();
    wasteEntries.forEach(w => loggedDates.add(w.date));
    energyEntries.forEach(e => loggedDates.add(e.date));
    confirmedActions.forEach(a => loggedDates.add(a.date));

    if (loggedDates.size === 0) return 0;

    let streak = 0;
    const cur = new Date();
    while (true) {
      const iso = cur.toISOString().split('T')[0];
      if (loggedDates.has(iso)) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else if (streak === 0) {
        cur.setDate(cur.getDate() - 1);
        const yestIso = cur.toISOString().split('T')[0];
        if (loggedDates.has(yestIso)) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return Math.max(streak, loggedDates.size > 0 ? 1 : 0);
  }, [wasteEntries, energyEntries, confirmedActions]);

  const sharedCarbonImpact = useMemo(() => {
    const wasteCarbonSaved = wasteStats.materialAvoidedCarbonKg;
    const smartActionCarbonSaved = confirmedActions.reduce((sum, a) => sum + a.co2SavedKg, 0);

    // Partial appliance logs are not a complete household baseline. Count only
    // avoided impact with an explicit action or diversion record.
    const energyEmissionsKg = energyStats.totalKwh * REGIONAL_GRID_INTENSITY_KG_PER_KWH;
    const totalCo2Saved = wasteCarbonSaved + smartActionCarbonSaved;
    const hasSufficientData = wasteEntries.length > 0 || energyEntries.length > 0 || confirmedActions.length > 0;

    const completedMissionsCount = missions.filter(m => m.isCompleted).length;
    const diversionComponent = (wasteStats.diversionRate / 100) * 40;
    const consistencyComponent = Math.min(30, (wasteEntries.length + energyEntries.length + confirmedActions.length) * 2);
    const missionComponent = Math.min(30, completedMissionsCount * 10);
    const rawScore = Math.round(diversionComponent + consistencyComponent + missionComponent);
    const computedEcoScore = hasSufficientData ? Math.min(100, Math.max(15, rawScore)) : null;

    return {
      wasteCarbonSaved,
      smartActionCarbonSaved,
      energyEmissionsKg,
      totalCo2Saved,
      hasSufficientData,
      computedEcoScore
    };
  }, [wasteStats, energyStats, confirmedActions, energyEntries, wasteEntries, missions]);

  const missionProgressList = useMemo(() => {
    return missions.map(mission => {
      let currentValue = 0;
      if (mission.metricType === 'waste_recycled_kg') {
        currentValue = wasteStats.recycled;
      } else if (mission.metricType === 'energy_logs_count') {
        currentValue = energyEntries.length;
      } else if (mission.metricType === 'transport_checkins') {
        currentValue = mission.manualCheckinCount || 0;
      }

      const percent = Math.min(100, Math.round((currentValue / mission.targetValue) * 100));
      const canComplete = mission.isJoined && !mission.isCompleted && currentValue >= mission.targetValue;

      return {
        ...mission,
        currentValue,
        percent,
        canComplete
      };
    });
  }, [missions, wasteStats.recycled, energyEntries.length]);

  const missionsSummary = useMemo(() => {
    const totalCount = missions.length;
    const completedCount = missions.filter(m => m.isCompleted).length;
    const activeJoinedCount = missions.filter(m => m.isJoined && !m.isCompleted).length;
    const earnedXp = missions.filter(m => m.isCompleted).reduce((sum, m) => sum + m.rewardXp, 0);

    return {
      totalCount,
      completedCount,
      activeJoinedCount,
      earnedXp
    };
  }, [missions]);

  const filteredMissions = useMemo(() => {
    return missionProgressList.filter(mission => {
      if (missionsCategoryFilter !== 'all' && mission.category !== missionsCategoryFilter) {
        return false;
      }
      if (missionsStatusFilter === 'joined' && !mission.isJoined) {
        return false;
      }
      if (missionsStatusFilter === 'completed' && !mission.isCompleted) {
        return false;
      }
      return true;
    });
  }, [missionProgressList, missionsCategoryFilter, missionsStatusFilter]);

  const dashboardActivityTrends = useMemo(() => {
    const today = new Date();
    if (timeframe === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const iso = d.toISOString().split('T')[0];
        const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];

        const wEntries = wasteEntries.filter(w => w.date === iso);
        const eEntries = energyEntries.filter(e => e.date === iso);
        const aEntries = confirmedActions.filter(a => a.date === iso);
        const totalEvents = wEntries.length + eEntries.length + aEntries.length;

        return {
          label: dayLabel,
          subLabel: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          iso,
          events: totalEvents,
          weightKg: wEntries.reduce((s, w) => s + w.quantityKg, 0),
          energyKwh: eEntries.reduce((s, e) => s + e.kwhConsumed, 0)
        };
      });
    } else {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((wLabel, idx) => {
        const isInBucket = (dateStr: string) => {
          const itemTime = new Date(dateStr).getTime();
          const diffDays = Math.floor((today.getTime() - itemTime) / (1000 * 60 * 60 * 24));
          return diffDays >= (3 - idx) * 7 && diffDays < (4 - idx) * 7;
        };

        const wEntries = wasteEntries.filter(w => isInBucket(w.date));
        const eEntries = energyEntries.filter(e => isInBucket(e.date));
        const aEntries = confirmedActions.filter(a => isInBucket(a.date));
        const totalEvents = wEntries.length + eEntries.length + aEntries.length;

        return {
          label: wLabel,
          subLabel: `${totalEvents} events`,
          iso: wLabel,
          events: totalEvents,
          weightKg: wEntries.reduce((s, w) => s + w.quantityKg, 0),
          energyKwh: eEntries.reduce((s, e) => s + e.kwhConsumed, 0)
        };
      });
    }
  }, [timeframe, wasteEntries, energyEntries, confirmedActions]);

  const unifiedTimelineFeed = useMemo(() => {
    const feed: TimelineFeedItem[] = [];

    wasteEntries.forEach(w => {
      feed.push({
        id: `tl-waste-${w.id}`,
        type: 'waste',
        categoryTag: w.category,
        title: `Logged ${formatWeight(w.quantityKg)} ${weightUnit} of ${w.category}`,
        subtitle: `Disposal via ${w.method}`,
        date: w.date,
        badgeText: w.method,
        details: w.notes,
        numericHighlight: `${formatWeight(w.quantityKg)} ${weightUnit}`,
        verificationType: 'Household Log'
      });
    });

    energyEntries.forEach(e => {
      feed.push({
        id: `tl-energy-${e.id}`,
        type: 'energy',
        categoryTag: e.category,
        title: `Logged ${e.applianceName}`,
        subtitle: `Category: ${e.category}`,
        date: e.date,
        badgeText: `${e.kwhConsumed.toFixed(2)} kWh`,
        details: e.notes,
        numericHighlight: `${e.kwhConsumed.toFixed(2)} kWh`,
        verificationType: 'Household Log'
      });
    });

    missions
      .filter(m => m.isCompleted && m.completedAt)
      .forEach(m => {
        feed.push({
          id: `tl-mission-${m.id}`,
          type: 'mission',
          categoryTag: m.category,
          title: `Mission Completed: ${m.title}`,
          subtitle: m.description,
          date: m.completedAt || todayStr,
          badgeText: `+${m.rewardXp} XP Earned`,
          details: m.calculationExplanation,
          numericHighlight: `+${m.rewardXp} XP`,
          verificationType: 'Gamified Achievement'
        });
      });

    confirmedActions.forEach(sa => {
      feed.push({
        id: `tl-action-${sa.id}`,
        type: 'smart_action',
        categoryTag: sa.detectedCategory,
        title: sa.title,
        subtitle: sa.insight,
        date: sa.date,
        badgeText: `+${sa.points} Pts`,
        details: `Avoided ${sa.co2SavedKg.toFixed(2)} kg CO₂e (${sa.confidenceRating || 'Approximate'} confidence). ${sa.assumptionsUsed || ''}`,
        numericHighlight: `${sa.co2SavedKg.toFixed(2)} kg CO₂e`,
        verificationType: 'Model Estimate'
      });
    });

    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wasteEntries, energyEntries, missions, confirmedActions, formatWeight, weightUnit, todayStr]);

  const filteredTimelineFeed = useMemo(() => {
    return unifiedTimelineFeed.filter(item => {
      if (timelineCategoryFilter !== 'all' && item.type !== timelineCategoryFilter) {
        return false;
      }
      if (timelineSearchQuery.trim()) {
        const query = timelineSearchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(query);
        const matchesTag = item.categoryTag.toLowerCase().includes(query);
        const matchesDetails = item.details ? item.details.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesSubtitle && !matchesTag && !matchesDetails) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedTimelineFeed, timelineCategoryFilter, timelineSearchQuery]);

  const filteredCommunities = useMemo(() => {
    return communities.filter(c => {
      if (communityViewMode === 'my_communities' && !c.isJoinedByMe) {
        return false;
      }
      if (communityCategoryFilter !== 'All' && c.category !== communityCategoryFilter) {
        return false;
      }
      if (communitySearchQuery.trim()) {
        const q = communitySearchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [communities, communityViewMode, communityCategoryFilter, communitySearchQuery]);

  const activeCommunityPosts = useMemo(() => {
    if (selectedCommunityId) {
      return communityPosts.filter(p => p.communityId === selectedCommunityId);
    }
    return communityPosts;
  }, [communityPosts, selectedCommunityId]);

  const handleToggleJoinCommunity = (communityId: string) => {
    setCommunities(prev =>
      prev.map(c => {
        if (c.id === communityId) {
          const nextState = !c.isJoinedByMe;
          return {
            ...c,
            isJoinedByMe: nextState,
            memberCount: nextState ? c.memberCount + 1 : Math.max(1, c.memberCount - 1)
          };
        }
        return c;
      })
    );
  };

  const handleToggleVolunteerDrive = (communityId: string, driveId: string) => {
    setCommunities(prev =>
      prev.map(c => {
        if (c.id === communityId) {
          return {
            ...c,
            volunteerDrives: c.volunteerDrives.map(vd => {
              if (vd.id === driveId) {
                const isReg = !vd.isUserRegistered;
                return {
                  ...vd,
                  isUserRegistered: isReg,
                  volunteersRegistered: isReg ? vd.volunteersRegistered + 1 : Math.max(0, vd.volunteersRegistered - 1)
                };
              }
              return vd;
            })
          };
        }
        return c;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLikedByMe;
          return {
            ...p,
            isLikedByMe: isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = activeCommentInput[postId]?.trim();
    if (!text) return;

    const newComment: CommunityComment = {
      id: 'c_' + Date.now(),
      authorName: userPreferences.displayName || 'You',
      authorRole: 'Member',
      text,
      date: todayStr
    };

    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      })
    );

    setActiveCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityForm.name.trim() || !newCommunityForm.location.trim()) return;

    const newCommunity: Community = {
      id: 'comm_' + Date.now(),
      name: newCommunityForm.name.trim(),
      location: newCommunityForm.location.trim(),
      description: newCommunityForm.description.trim() || 'A community focused on neighborhood sustainability and green practices.',
      coverImage: newCommunityForm.coverImage || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      isPublic: newCommunityForm.isPublic,
      category: newCommunityForm.category,
      creatorName: userPreferences.displayName || 'Alex Lawson',
      createdDate: todayStr,
      memberCount: 1,
      isJoinedByMe: true,
      fundingCampaign: newCommunityForm.hasFundingGoal ? {
        id: 'fc_' + Date.now(),
        goalTitle: newCommunityForm.goalTitle.trim() || 'Community Equipment Fund',
        targetAmount: parseFloat(newCommunityForm.targetAmount) || 10000,
        currentPledged: 0,
        purpose: newCommunityForm.fundingPurpose.trim() || 'Support neighborhood cleanup kits, gloves, and reusable bins.'
      } : undefined,
      volunteerDrives: []
    };

    setCommunities(prev => [newCommunity, ...prev]);
    setIsCreateCommunityModalOpen(false);
    setNewCommunityForm({
      name: '',
      location: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      isPublic: true,
      category: 'Cleanups',
      hasFundingGoal: false,
      goalTitle: '',
      targetAmount: '10000',
      fundingPurpose: ''
    });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostForm.title.trim() || !newPostForm.content.trim() || !newPostForm.communityId) return;

    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      communityId: newPostForm.communityId,
      authorName: userPreferences.displayName || 'Alex Lawson',
      date: todayStr,
      title: newPostForm.title.trim(),
      content: newPostForm.content.trim(),
      imageUrl: newPostForm.imageUrl.trim() || undefined,
      wasteCollectedKg: newPostForm.wasteCollectedKg ? parseFloat(newPostForm.wasteCollectedKg) : undefined,
      volunteersAttended: newPostForm.volunteersAttended ? parseInt(newPostForm.volunteersAttended) : undefined,
      likesCount: 0,
      isLikedByMe: false,
      comments: []
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    setIsCreatePostModalOpen(false);
    setNewPostForm({
      communityId: '',
      title: '',
      content: '',
      imageUrl: '',
      wasteCollectedKg: '',
      volunteersAttended: ''
    });
  };

  const handlePledgeFunding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingCommunityTarget || fundingPledgeAmount <= 0) return;

    setCommunities(prev =>
      prev.map(c => {
        if (c.id === fundingCommunityTarget.id && c.fundingCampaign) {
          return {
            ...c,
            fundingCampaign: {
              ...c.fundingCampaign,
              currentPledged: c.fundingCampaign.currentPledged + fundingPledgeAmount
            }
          };
        }
        return c;
      })
    );

    setIsFundingModalOpen(false);
    setFundingSuccessToast(true);
    setTimeout(() => setFundingSuccessToast(false), 3500);
  };

  const handleToggleJoinMission = (missionId: string) => {
    setMissions(prev =>
      prev.map(m => m.id === missionId ? { ...m, isJoined: !m.isJoined } : m)
    );
  };

  const handleIncrementTransportCheckin = (missionId: string) => {
    setMissions(prev =>
      prev.map(m => m.id === missionId ? { ...m, manualCheckinCount: (m.manualCheckinCount || 0) + 1 } : m)
    );
  };

  const handleCompleteMission = (missionId: string) => {
    setMissions(prev =>
      prev.map(m => m.id === missionId ? { ...m, isCompleted: true, completedAt: todayStr } : m)
    );
  };

  const analyticsData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    const isWithinRange = (dateStr: string) => {
      if (analyticsDateRange === 'all') return true;
      const d = new Date(dateStr);
      if (analyticsDateRange === 'currentMonth') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum;
      }
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (analyticsDateRange === 'last30') return diffDays >= 0 && diffDays <= 30;
      if (analyticsDateRange === 'last90') return diffDays >= 0 && diffDays <= 90;
      return true;
    };

    const filteredWaste = wasteEntries.filter(w => isWithinRange(w.date));
    const filteredEnergy = energyEntries.filter(e => isWithinRange(e.date));

    const totalWasteKg = filteredWaste.reduce((sum, w) => sum + w.quantityKg, 0);
    const recycledWasteKg = filteredWaste
      .filter(w => w.method === 'Recycled' || w.method === 'Composted' || w.method === 'Donated/Reused')
      .reduce((sum, w) => sum + w.quantityKg, 0);
    const totalEnergyKwh = filteredEnergy.reduce((sum, e) => sum + e.kwhConsumed, 0);

    const thisMonthWasteKg = wasteEntries
      .filter(w => {
        const d = new Date(w.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum &&
          (w.method === 'Recycled' || w.method === 'Composted' || w.method === 'Donated/Reused');
      })
      .reduce((sum, w) => sum + w.quantityKg, 0);

    const lastMonthWasteKg = wasteEntries
      .filter(w => {
        const d = new Date(w.date);
        const lastMonth = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
        const lastMonthYear = currentMonthNum === 0 ? currentYear - 1 : currentYear;
        return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth &&
          (w.method === 'Recycled' || w.method === 'Composted' || w.method === 'Donated/Reused');
      })
      .reduce((sum, w) => sum + w.quantityKg, 0);

    const wasteMoMChangePercent = lastMonthWasteKg > 0 
      ? Math.round(((thisMonthWasteKg - lastMonthWasteKg) / lastMonthWasteKg) * 100)
      : (thisMonthWasteKg > 0 ? 100 : 0);

    const monthlySeries = Array.from({ length: 6 }).map((_, i) => {
      const targetDate = new Date(currentYear, currentMonthNum - (5 - i), 1);
      const mNum = targetDate.getMonth();
      const yNum = targetDate.getFullYear();
      const label = targetDate.toLocaleString('default', { month: 'short' });

      const mWRecycled = wasteEntries
        .filter(w => {
          const d = new Date(w.date);
          return d.getFullYear() === yNum && d.getMonth() === mNum &&
            (w.method === 'Recycled' || w.method === 'Composted' || w.method === 'Donated/Reused');
        })
        .reduce((sum, w) => sum + w.quantityKg, 0);

      const mEnergy = energyEntries
        .filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === yNum && d.getMonth() === mNum;
        })
        .reduce((sum, e) => sum + e.kwhConsumed, 0);

      return {
        label,
        year: yNum,
        wasteKg: mWRecycled,
        energyKwh: mEnergy
      };
    });

    const hasData = filteredWaste.length > 0 || filteredEnergy.length > 0;

    return {
      filteredWasteCount: filteredWaste.length,
      filteredEnergyCount: filteredEnergy.length,
      totalWasteKg,
      recycledWasteKg,
      totalEnergyKwh,
      thisMonthWasteKg,
      lastMonthWasteKg,
      wasteMoMChangePercent,
      monthlySeries,
      hasData
    };
  }, [wasteEntries, energyStats.totalKwh, confirmedActions, missions]);

  const handleExportReport = () => {
    const header = `TerraMind Household Sustainability Summary\nExport Date: ${todayStr}\nDate Range Filter: ${analyticsDateRange}\nUnit System: ${userPreferences.unitSystem}\n\n`;
    const summary = `--- METHODOLOGY & HOUSEHOLD IMPACT SUMMARY ---\nTotal Waste Logged (${weightUnit}),${formatWeight(analyticsData.totalWasteKg)}\nWaste Diverted/Recycled (${weightUnit}),${formatWeight(analyticsData.recycledWasteKg)}\nTotal Electricity Consumed (kWh),${analyticsData.totalEnergyKwh.toFixed(2)}\nEstimated Avoided Carbon (kg CO2e),${sharedCarbonImpact.totalCo2Saved.toFixed(2)}\nEstimated Electricity Emissions (kg CO2e),${sharedCarbonImpact.energyEmissionsKg.toFixed(2)}\nActive Logging Streak (Days),${activeStreakDays}\nComposite Eco-Score (0-100),${sharedCarbonImpact.computedEcoScore || 'N/A'}\n\n`;
    const wasteHead = `--- SELF-REPORTED WASTE ENTRIES ---\nDate,Category,Quantity (${weightUnit}),Method,Material Carbon Factor (kg CO2e/kg),Notes\n`;
    const wasteRows = wasteEntries.map(w => `"${w.date}","${w.category}",${formatWeight(w.quantityKg)},"${w.method}",${MATERIAL_CARBON_FACTORS[w.category]},"${(w.notes || '').replace(/"/g, '""')}"`).join('\n');
    const energyHead = `\n\n--- SELF-REPORTED APPLIANCE ENERGY ENTRIES ---\nDate,Appliance,Category,kWh,Grid Intensity Factor (kg CO2e/kWh),Notes\n`;
    const energyRows = energyEntries.map(e => `"${e.date}","${(e.applianceName || '').replace(/"/g, '""')}","${e.category}",${e.kwhConsumed},${REGIONAL_GRID_INTENSITY_KG_PER_KWH},"${(e.notes || '').replace(/"/g, '""')}"`).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(header + summary + wasteHead + wasteRows + energyHead + energyRows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `terramind_household_summary_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUserContextTelemetry = useCallback(() => {
    return `
Self-reported household records:
- Location / Region: ${userPreferences.location || 'Unspecified'}
- Waste Logged: ${wasteStats.total.toFixed(1)} kg total (${wasteStats.recycled.toFixed(1)} kg diverted, Diversion Rate: ${wasteStats.diversionRate}%)
- Waste Breakdown: Plastic: ${wasteStats.byCategory.Plastic.toFixed(1)}kg, Paper: ${wasteStats.byCategory.Paper.toFixed(1)}kg, Organic: ${wasteStats.byCategory.Organic.toFixed(1)}kg, Glass: ${wasteStats.byCategory.Glass.toFixed(1)}kg, Metal: ${wasteStats.byCategory.Metal.toFixed(1)}kg
- Electricity Monitored: ${energyStats.totalKwh.toFixed(1)} kWh across ${energyEntries.length} appliance entries.
- Peak Draw Appliance: ${energyStats.topAppliance ? `${energyStats.topAppliance.name} (${energyStats.topAppliance.kwh.toFixed(1)} kWh)` : 'None recorded yet'}
- Active Logging Streak: ${activeStreakDays} days
- Estimated Avoided Carbon: ${sharedCarbonImpact.totalCo2Saved.toFixed(1)} kg CO2e
- Estimated Electricity Emissions: ${sharedCarbonImpact.energyEmissionsKg.toFixed(1)} kg CO2e
- Composite Eco-Score: ${sharedCarbonImpact.computedEcoScore ?? 'N/A'}/100
- Unit System Preference: ${userPreferences.unitSystem}
`.trim();
  }, [userPreferences, wasteStats, energyStats, energyEntries.length, activeStreakDays, sharedCarbonImpact]);

  const handleSendCoachMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || coachInput).trim();
    if (!promptToSend || isCoachLoading) return;

    setCoachErrorBanner(null);

    const userMsg: CoachMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCoachMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setCoachInput('');
    setIsCoachLoading(true);

    const apiUrl = getGeminiEndpoint(userPreferences.customApiKey);
    if (!apiUrl) {
      setIsCoachLoading(false);
      const localReply: CoachMessage = {
        id: 'bot_local_' + Date.now(),
        sender: 'assistant',
        text: replyWithLocalGuidance(promptToSend, {
          wasteKg: wasteStats.total,
          divertedKg: wasteStats.recycled,
          diversionRate: wasteStats.diversionRate,
          energyKwh: energyStats.totalKwh,
          topAppliance: energyStats.topAppliance,
        }),
        timestamp: 'Just now'
      };
      setCoachMessages(prev => [...prev, localReply]);
      return;
    }

    try {
      const userTelemetry = getUserContextTelemetry();
      const systemPrompt = `You are TerraMind's AI Sustainability Coach. You provide evidence-grounded, practical, and location-relevant advice on household carbon footprint reduction, appliance energy management, composting, and recycling.
Ground your recommendations in the user's self-reported logs below whenever relevant.
Clearly distinguish logged quantities from estimates. When discussing emissions, state that the starter factors are approximate and local conditions vary.
Keep your tone encouraging, direct, and constructive.
Use web search grounding whenever discussing local regulations, utility rates, or specific certifications.

CURRENT USER TELEMETRY:
${userTelemetry}`;

      const payload = {
        contents: [
          ...coachMessages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: promptToSend }] }
        ],
        tools: [{ "google_search": {} }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      };

      const result = await fetchGeminiWithBackoff(apiUrl, payload);
      const candidate = result.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (!replyText) {
        throw new Error("No textual response was returned by the model.");
      }

      let sources: { uri?: string; title?: string }[] = [];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
        sources = groundingMetadata.groundingAttributions
          .map((attr: any) => ({
            uri: attr.web?.uri,
            title: attr.web?.title
          }))
          .filter((src: any) => src.uri && src.title);
      }

      const botMsg: CoachMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: sources.slice(0, 3)
      };

      setCoachMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.warn('Gemini Coach error:', error);
      const errorDetail = error?.message || "Failed to reach AI service";
      setCoachErrorBanner(`AI Coach connection error: ${errorDetail}`);
      const fallbackMsg: CoachMessage = {
        id: 'bot_err_' + Date.now(),
        sender: 'assistant',
        text: `Unable to complete live consultation due to a network or authentication error: ${errorDetail}. Please check your API key and network connection.`,
        timestamp: 'Just now',
        isError: true
      };
      setCoachMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handleRunWasteAudit = async () => {
    setIsAuditingWaste(true);
    setWasteAuditError(null);

    const apiUrl = getGeminiEndpoint(userPreferences.customApiKey);
    if (!apiUrl) {
      setWasteAuditResult(auditWasteLocally(
        wasteStats.total,
        wasteStats.recycled,
        wasteStats.diversionRate,
        wasteStats.byCategory,
        wasteStats.materialAvoidedCarbonKg,
      ));
      setIsAuditingWaste(false);
      return;
    }

    try {
      const wasteSummaryString = `User has logged ${wasteStats.total.toFixed(1)}kg total waste with a ${wasteStats.diversionRate}% diversion rate in ${userPreferences.location || 'an unspecified location'}.
Breakdown: Plastic: ${wasteStats.byCategory.Plastic.toFixed(1)}kg, Paper: ${wasteStats.byCategory.Paper.toFixed(1)}kg, Organic: ${wasteStats.byCategory.Organic.toFixed(1)}kg, Glass: ${wasteStats.byCategory.Glass.toFixed(1)}kg, Metal: ${wasteStats.byCategory.Metal.toFixed(1)}kg. Total log records: ${wasteEntries.length}.`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze this self-reported household waste dataset and generate a structured estimate.
Be honest about modeling assumptions and regional variability.
Data:\n${wasteSummaryString}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              estimatedCarbonImpactKg: { type: "NUMBER" },
              topRecommendation: { type: "STRING" },
              divertedImprovementTips: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              uncertaintyDisclaimer: { type: "STRING" }
            },
            required: ["summary", "estimatedCarbonImpactKg", "topRecommendation", "divertedImprovementTips", "uncertaintyDisclaimer"]
          }
        }
      };

      const result = await fetchGeminiWithBackoff(apiUrl, payload);
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) {
        throw new Error("Empty structured response from waste audit model.");
      }
      const parsed = JSON.parse(jsonText);
      setWasteAuditResult(parsed);
    } catch (err: any) {
      console.warn('AI Waste Audit error:', err);
      setWasteAuditError(err?.message || "Failed to complete AI Waste Audit. Please verify your connection and API key.");
    } finally {
      setIsAuditingWaste(false);
    }
  };

  const handleAnalyzeSmartAction = async () => {
    if (!smartActionInput.trim() || isAnalyzingAction) return;
    setIsAnalyzingAction(true);
    setSmartActionError(null);
    setSmartActionFeedback(null);

    const apiUrl = getGeminiEndpoint(userPreferences.customApiKey);
    if (!apiUrl) {
      setIsAnalyzingAction(false);
      setSmartActionFeedback(estimateActionLocally(smartActionInput));
      return;
    }

    try {
      const userTelemetry = `Context: User is located in ${userPreferences.location || 'urban India'}. Baseline energy monitored: ${energyStats.totalKwh.toFixed(1)} kWh. Diversion rate: ${wasteStats.diversionRate}%.`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze this user eco-activity: "${smartActionInput}".
${userTelemetry}
Estimate avoided CO2e in kg, pick one category ("Energy", "Waste", "Commute", "Water", or "Food"), calculate realistic gamified eco-points (between 10 and 150), provide a concise motivating 1-sentence insight, assign a confidence rating ("High", "Medium", or "Approximate"), and state the specific modeling assumption used (e.g. baseline vehicle emissions vs electric metro, grid carbon factor).` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              detectedCategory: { type: "STRING" },
              co2SavedKg: { type: "NUMBER" },
              points: { type: "NUMBER" },
              insight: { type: "STRING" },
              confidenceRating: { type: "STRING", enum: ["High", "Medium", "Approximate"] },
              assumptionsUsed: { type: "STRING" }
            },
            required: ["detectedCategory", "co2SavedKg", "points", "insight", "confidenceRating", "assumptionsUsed"]
          }
        }
      };

      const result = await fetchGeminiWithBackoff(apiUrl, payload);
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) {
        throw new Error("No structured output received from Smart Action Auditor.");
      }
      const parsed = JSON.parse(jsonText);
      setSmartActionFeedback({
        detectedCategory: parsed.detectedCategory || 'Eco-Action',
        co2SavedKg: Number(parsed.co2SavedKg) || 0,
        points: Number(parsed.points) || 20,
        insight: parsed.insight || 'Illustrative estimate; based on your self-reported action.',
        confidenceRating: parsed.confidenceRating || 'Approximate',
        assumptionsUsed: parsed.assumptionsUsed || 'Derived from regional lifecycle transport and grid emission equivalencies.'
      });
    } catch (err: any) {
      console.warn('Smart Action analysis error:', err);
      setSmartActionError(err?.message || "Could not analyze smart action due to an API or format error.");
    } finally {
      setIsAnalyzingAction(false);
    }
  };

  const handleConfirmSmartAction = () => {
    if (!smartActionFeedback) return;
    const newAction: ConfirmedSmartAction = {
      id: 'sa-' + Date.now(),
      title: smartActionInput.trim().slice(0, 48) + (smartActionInput.trim().length > 48 ? '...' : ''),
      detectedCategory: smartActionFeedback.detectedCategory,
      co2SavedKg: smartActionFeedback.co2SavedKg,
      points: smartActionFeedback.points,
      insight: smartActionFeedback.insight,
      confidenceRating: smartActionFeedback.confidenceRating,
      assumptionsUsed: smartActionFeedback.assumptionsUsed,
      date: todayStr
    };

    setConfirmedActions(prev => [newAction, ...prev]);
    setIsLogModalOpen(false);
    setSmartActionFeedback(null);
    setSmartActionInput('');
    setSmartActionError(null);
  };

  const handleOpenAddWaste = () => {
    setEditingWasteId(null);
    setWasteForm({
      category: 'Plastic',
      quantityKg: '',
      date: todayStr,
      method: 'Recycled',
      notes: ''
    });
    setIsWasteModalOpen(true);
  };

  const handleOpenEditWaste = (entry: WasteEntry) => {
    setEditingWasteId(entry.id);
    const displayedQty = userPreferences.unitSystem === 'imperial' 
      ? (entry.quantityKg * KG_TO_LBS).toFixed(2)
      : entry.quantityKg.toString();
      
    setWasteForm({
      category: entry.category,
      quantityKg: displayedQty,
      date: entry.date,
      method: entry.method,
      notes: entry.notes || ''
    });
    setIsWasteModalOpen(true);
  };

  const handleDeleteWaste = (id: string) => {
    setWasteEntries(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveWasteEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const inputVal = parseFloat(wasteForm.quantityKg);
    if (isNaN(inputVal) || inputVal <= 0) return;

    const qtyKg = userPreferences.unitSystem === 'imperial'
      ? inputVal / KG_TO_LBS
      : inputVal;

    if (editingWasteId) {
      setWasteEntries(prev =>
        prev.map(item =>
          item.id === editingWasteId
            ? {
                ...item,
                category: wasteForm.category,
                quantityKg: Math.round(qtyKg * 100) / 100,
                date: wasteForm.date,
                method: wasteForm.method,
                notes: wasteForm.notes.trim()
              }
            : item
        )
      );
    } else {
      const newEntry: WasteEntry = {
        id: 'waste_' + Date.now(),
        category: wasteForm.category,
        quantityKg: Math.round(qtyKg * 100) / 100,
        date: wasteForm.date,
        method: wasteForm.method,
        notes: wasteForm.notes.trim()
      };
      setWasteEntries(prev => [newEntry, ...prev]);
    }

    setIsWasteModalOpen(false);
  };

  const handleOpenAddEnergy = () => {
    setEditingEnergyId(null);
    setEnergyForm({
      applianceName: '',
      category: 'Kitchen',
      kwhConsumed: '',
      date: todayStr,
      notes: ''
    });
    setIsEnergyModalOpen(true);
  };

  const handleOpenEditEnergy = (entry: EnergyEntry) => {
    setEditingEnergyId(entry.id);
    setEnergyForm({
      applianceName: entry.applianceName,
      category: entry.category,
      kwhConsumed: entry.kwhConsumed.toString(),
      date: entry.date,
      notes: entry.notes || ''
    });
    setIsEnergyModalOpen(true);
  };

  const handleDeleteEnergy = (id: string) => {
    setEnergyEntries(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveEnergyEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const kwh = parseFloat(energyForm.kwhConsumed);
    if (!energyForm.applianceName.trim() || isNaN(kwh) || kwh <= 0) return;

    if (editingEnergyId) {
      setEnergyEntries(prev =>
        prev.map(item =>
          item.id === editingEnergyId
            ? {
                ...item,
                applianceName: energyForm.applianceName.trim(),
                category: energyForm.category,
                kwhConsumed: Math.round(kwh * 100) / 100,
                date: energyForm.date,
                notes: energyForm.notes.trim()
              }
            : item
        )
      );
    } else {
      const newEntry: EnergyEntry = {
        id: 'energy_' + Date.now(),
        applianceName: energyForm.applianceName.trim(),
        category: energyForm.category,
        kwhConsumed: Math.round(kwh * 100) / 100,
        date: energyForm.date,
        notes: energyForm.notes.trim()
      };
      setEnergyEntries(prev => [newEntry, ...prev]);
    }

    setIsEnergyModalOpen(false);
  };

  const handleClearAllData = () => {
    try {
      localStorage.removeItem('terramind_waste_entries');
      localStorage.removeItem('terramind_energy_entries');
      localStorage.removeItem('terramind_missions_list');
      localStorage.removeItem('terramind_saved_actions');
      localStorage.removeItem('terramind_communities_list');
      localStorage.removeItem('terramind_community_posts');
      localStorage.setItem('terramind_sample_data_cleared', 'true');
    } catch (e) {
      console.error(e);
    }

    setWasteEntries([]);
    setEnergyEntries([]);
    setConfirmedActions([]);
    setCommunities([]);
    setCommunityPosts([]);
    setIsSampleDatasetPresent(false);
    setMissions(prev =>
      prev.map(m => ({
        ...m,
        isJoined: false,
        isCompleted: false,
        completedAt: undefined,
        manualCheckinCount: 0
      }))
    );
    setIsClearModalOpen(false);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleResetToDemoData = () => {
    setWasteEntries(INITIAL_WASTE_ENTRIES);
    setEnergyEntries(INITIAL_ENERGY_ENTRIES);
    setMissions(INITIAL_MISSIONS);
    setConfirmedActions(INITIAL_SAVED_ACTIONS);
    setCommunities(INITIAL_COMMUNITIES);
    setCommunityPosts(INITIAL_COMMUNITY_POSTS);
    setIsSampleDatasetPresent(true);
    try { localStorage.setItem('terramind_sample_data_cleared', 'false'); } catch (e) { console.error(e); }
    try {
      localStorage.setItem('terramind_waste_entries', JSON.stringify(INITIAL_WASTE_ENTRIES));
      localStorage.setItem('terramind_energy_entries', JSON.stringify(INITIAL_ENERGY_ENTRIES));
      localStorage.setItem('terramind_missions_list', JSON.stringify(INITIAL_MISSIONS));
      localStorage.setItem('terramind_saved_actions', JSON.stringify(INITIAL_SAVED_ACTIONS));
      localStorage.setItem('terramind_communities_list', JSON.stringify(INITIAL_COMMUNITIES));
      localStorage.setItem('terramind_community_posts', JSON.stringify(INITIAL_COMMUNITY_POSTS));
    } catch (e) {
      console.error(e);
    }
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  return (
    <div className={`min-h-screen text-slate-800 flex font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 ${
      userPreferences.theme === 'minimal' ? 'bg-slate-100/95' : 'bg-[#f7faf8]'
    }`}>
      {/* Modular Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeStreakDays={activeStreakDays}
        earnedXp={missionsSummary.earnedXp}
        activeJoinedCount={missionsSummary.activeJoinedCount}
        userPreferences={userPreferences}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Modular Header */}
        <Header
          activeTab={activeTab}
          setMobileMenuOpen={setMobileMenuOpen}
          setIsMethodologyModalOpen={setIsMethodologyModalOpen}
          handleOpenAddWaste={handleOpenAddWaste}
          handleOpenAddEnergy={handleOpenAddEnergy}
          setIsLogModalOpen={setIsLogModalOpen}
        />

        {/* Content View */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 w-full">
          {isSampleDatasetPresent && activeTab !== 'community' && activeTab !== 'settings' && (
            <div role="note" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-950">
              <p><strong>Example records are loaded.</strong> They make the dashboard easy to explore; clear them in Settings before mixing in your household data. Your edits stay in this browser.</p>
              <button type="button" onClick={() => setActiveTab('settings')} className="shrink-0 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-800 hover:bg-emerald-100">Set up my data</button>
            </div>
          )}
          {activeTab === 'community' ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Community Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    Eco Communities &amp; Action Hub
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Connect with neighborhood sustainability guilds, organize cleanup drives, and support grassroot environmental initiatives.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsCreatePostModalOpen(true)}
                    disabled={communities.filter(c => c.isJoinedByMe).length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/80 rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
                    title={communities.filter(c => c.isJoinedByMe).length === 0 ? 'Join a community first to share updates' : 'Post cleanup update'}
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Post Cleanup Update</span>
                  </button>

                  <button
                    onClick={() => setIsCreateCommunityModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer text-xs"
                  >
                    <Users className="w-4 h-4" />
                    <span>Create Community</span>
                  </button>
                </div>
              </div>

              {/* Prototype Notice */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-start gap-3 text-xs text-emerald-950 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-900">Example community data</p>
                  <p className="text-emerald-800/90 leading-relaxed">
                    Community names, member counts, posts, volunteer drives, and pledges are sample content saved in this browser. This feed is not connected to real people or a neighborhood network; pledges are simulated and no money moves.
                  </p>
                </div>
              </div>

              {fundingSuccessToast && (
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>Demo funding pledge recorded! Thank you for supporting community sustainability. (Simulated pledge — no actual money debited).</span>
                  </div>
                </div>
              )}

              {/* View Mode & Filter Bar */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={communitySearchQuery}
                    onChange={e => setCommunitySearchQuery(e.target.value)}
                    placeholder="Search communities by name, sector, or city..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'discover', label: 'Discover Communities' },
                    { id: 'my_communities', label: `My Communities (${communities.filter(c => c.isJoinedByMe).length})` },
                    { id: 'feed', label: 'Community Feed' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCommunityViewMode(tab.id as any);
                        setSelectedCommunityId(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        communityViewMode === tab.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Focus Bar */}
              {communityViewMode !== 'feed' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Focus:</span>
                  {(['All', 'Cleanups', 'Composting', 'Solar & Energy', 'Biodiversity'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCommunityCategoryFilter(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer whitespace-nowrap ${
                        communityCategoryFilter === cat
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Community Feed / Directory Layout */}
              {communityViewMode === 'feed' ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {communityPosts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
                      No community updates published yet. Be the first to share a cleanup record!
                    </div>
                  ) : (
                    activeCommunityPosts.map(post => {
                      const comm = communities.find(c => c.id === post.communityId);
                      return (
                        <div key={post.id} className="bg-white rounded-3xl border border-emerald-100/90 shadow-xs overflow-hidden">
                          <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                                {post.authorName.slice(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  <span>{post.authorName}</span>
                                  {comm && (
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      {comm.name}
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {post.date}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <h3 className="font-extrabold text-base text-slate-900">{post.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.content}</p>

                            {(post.wasteCollectedKg || post.volunteersAttended) && (
                              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs">
                                {post.wasteCollectedKg && (
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-800">Waste diverted</span>
                                    <p className="text-base font-black text-emerald-950 mt-0.5">
                                      {formatWeight(post.wasteCollectedKg)} {weightUnit}
                                    </p>
                                  </div>
                                )}
                                {post.volunteersAttended && (
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-800">Volunteers Joined</span>
                                    <p className="text-base font-black text-emerald-950 mt-0.5">
                                      {post.volunteersAttended} local citizens
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {post.imageUrl && (
                              <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-80">
                                <img
                                  src={post.imageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                                post.isLikedByMe
                                  ? 'text-rose-600 bg-rose-50 border border-rose-200'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${post.isLikedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />
                              <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
                            </button>

                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              <span>{post.comments.length} Comments</span>
                            </span>
                          </div>

                          <div className="p-5 pt-3 bg-slate-50/70 border-t border-slate-100 space-y-3">
                            {post.comments.length > 0 && (
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {post.comments.map(c => (
                                  <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-800">{c.authorName}</span>
                                      <span className="text-[10px] text-slate-400">{c.date}</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{c.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={activeCommentInput[post.id] || ''}
                                onChange={e => setActiveCommentInput({ ...activeCommentInput, [post.id]: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                placeholder="Write an encouraging comment or question..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!activeCommentInput[post.id]?.trim()}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunities.length === 0 ? (
                    <div className="col-span-full bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
                      No communities match your current filters. Try adjusting your search query or create a new community hub.
                    </div>
                  ) : (
                    filteredCommunities.map(comm => (
                      <div
                        key={comm.id}
                        className="bg-white rounded-3xl border border-emerald-100/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={comm.coverImage}
                              alt={comm.name}
                              className="w-full h-full object-cover transition duration-300 hover:scale-105"
                              onError={(e: any) => {
                                e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1">
                                {comm.isPublic ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                                <span>{comm.isPublic ? 'Public Hub' : 'Private Guild'}</span>
                              </span>
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-800/80 text-emerald-100 backdrop-blur-md">
                                {comm.category}
                              </span>
                            </div>

                            <span className="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/90 text-slate-800 shadow-2xs backdrop-blur-xs">
                              {comm.memberCount} Members
                            </span>
                          </div>

                          <div className="p-5 space-y-3">
                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{comm.name}</h3>
                              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {comm.location}
                              </p>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                              {comm.description}
                            </p>

                            {comm.volunteerDrives.length > 0 && (
                              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-amber-950 flex items-center gap-1">
                                    <HandHeart className="w-3.5 h-3.5 text-amber-600" /> Upcoming Volunteer Drive:
                                  </span>
                                  <span className="text-[10px] text-amber-800 font-medium">
                                    {comm.volunteerDrives[0].date}
                                  </span>
                                </div>
                                <p className="font-medium text-amber-900 text-[11px] line-clamp-1">
                                  {comm.volunteerDrives[0].title}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] text-amber-700">
                                    {comm.volunteerDrives[0].volunteersRegistered} / {comm.volunteerDrives[0].volunteersNeeded} spots filled
                                  </span>
                                  <button
                                    onClick={() => handleToggleVolunteerDrive(comm.id, comm.volunteerDrives[0].id)}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                      comm.volunteerDrives[0].isUserRegistered
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-amber-200 hover:bg-amber-300 text-amber-950'
                                    }`}
                                  >
                                    {comm.volunteerDrives[0].isUserRegistered ? 'Registered ✓' : 'Volunteer Now'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {comm.fundingCampaign && (
                              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    Community Goal (Demo Pledge)
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-bold">
                                    ₹{comm.fundingCampaign.currentPledged.toLocaleString()} / ₹{comm.fundingCampaign.targetAmount.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-emerald-900 line-clamp-1">{comm.fundingCampaign.goalTitle}</p>
                                
                                <div className="w-full bg-emerald-200/50 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    style={{ width: `${Math.min(100, Math.round((comm.fundingCampaign.currentPledged / comm.fundingCampaign.targetAmount) * 100))}%` }}
                                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                  />
                                </div>

                                <div className="flex justify-end pt-0.5">
                                  <button
                                    onClick={() => {
                                      setFundingCommunityTarget(comm);
                                      setIsFundingModalOpen(true);
                                    }}
                                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                                  >
                                    Support Equipment Drive →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-slate-50 flex items-center justify-between gap-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedCommunityId(comm.id);
                              setCommunityViewMode('feed');
                            }}
                            className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-center cursor-pointer"
                          >
                            View Feed
                          </button>

                          <button
                            onClick={() => handleToggleJoinCommunity(comm.id)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                              comm.isJoinedByMe
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            {comm.isJoinedByMe ? 'Joined ✓' : 'Join Community'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'coach' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5 tracking-tight">
                    <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
                      <Bot className="w-6 h-6" />
                    </div>
                    TerraMind AI Eco-Coach
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Context-aware guidance grounded in your saved household waste and energy data.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Telemetry Active: {wasteStats.count} waste, {energyStats.count} energy logs</span>
                  </div>
                </div>
              </div>

              {coachErrorBanner && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{coachErrorBanner}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="font-bold underline text-amber-950 hover:text-amber-800 shrink-0 cursor-pointer"
                  >
                    Open Settings
                  </button>
                </div>
              )}

              {/* Suggestions */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Contextual Prompts:
                </span>
                {[
                  `How can I reduce draw from my ${energyStats.topAppliance ? energyStats.topAppliance.name : 'HVAC'}?`,
                  `Analyze my ${wasteStats.diversionRate}% waste diversion rate and suggest improvements`,
                  `What are the composting guidelines for ${userPreferences.location || 'Noida / Delhi NCR'}?`,
                  "Compare emissions: Delhi Metro transit vs 16km solo car driving"
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendCoachMessage(pill)}
                    disabled={isCoachLoading}
                    className="text-xs bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Chat Container */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm flex flex-col h-[580px] overflow-hidden">
                <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
                  {coachMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.sender === 'user'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : msg.isError
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      }`}>
                        {msg.sender === 'user' ? 'You' : msg.isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className="space-y-2 max-w-[85%]">
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-emerald-700 text-white rounded-tr-xs'
                            : msg.isError
                            ? 'bg-amber-50/80 border border-amber-200 text-amber-900 rounded-tl-xs'
                            : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-line'
                        }`}>
                          {msg.text}
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5 text-xs text-emerald-950 space-y-1">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                              Web Source Citations:
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {msg.sources.map((s, idx) => (
                                <a
                                  key={idx}
                                  href={s.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md text-emerald-700 hover:text-emerald-900 border border-emerald-200/60 shadow-2xs hover:underline max-w-[220px] truncate"
                                >
                                  <span className="truncate">{s.title || s.uri}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <span className={`block text-[10px] text-slate-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isCoachLoading && (
                    <div className="flex gap-3 max-w-md">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs flex items-center gap-2 text-slate-500 text-xs font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        Evaluating household telemetry and consulting environmental models...
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendCoachMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={coachInput}
                      onChange={e => setCoachInput(e.target.value)}
                      placeholder="Ask for recommendations on your household power draw, local recycling, or transit..."
                      disabled={isCoachLoading}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isCoachLoading || !coachInput.trim()}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === 'waste' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Trash2 className="w-7 h-7 text-emerald-600" />
                    Waste Tracker
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Logged materials automatically feed the Shared Dashboard, Quests, and Timeline.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleRunWasteAudit}
                    disabled={isAuditingWaste || wasteEntries.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/80 rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isAuditingWaste ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Auditing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>AI Waste Audit</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenAddWaste}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Waste Entry</span>
                  </button>
                </div>
              </div>

              {wasteAuditError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{wasteAuditError}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="font-bold underline text-amber-950 hover:text-amber-800 shrink-0 cursor-pointer"
                  >
                    Configure Key in Settings
                  </button>
                </div>
              )}

              {wasteAuditResult && (
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border border-emerald-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-950 text-base">Ecological Waste Audit (Model Estimate)</h3>
                        <p className="text-xs text-emerald-700 font-medium">Computed dynamically from your {wasteEntries.length} logged entries</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setWasteAuditResult(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Assessment</span>
                      <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed">{wasteAuditResult.summary}</p>
                    </div>
                    <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Lifecycle Impact</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-rose-600">{wasteAuditResult.estimatedCarbonImpactKg.toFixed(1)}</span>
                        <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Lifecycle emissions of undiverted refuse</p>
                    </div>
                    <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Priority Action</span>
                      <p className="text-sm font-semibold text-emerald-800 mt-1">{wasteAuditResult.topRecommendation}</p>
                    </div>
                  </div>

                  {wasteAuditResult.divertedImprovementTips && wasteAuditResult.divertedImprovementTips.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-emerald-100 text-xs">
                      <span className="font-bold text-slate-700 block mb-1.5">Actionable Steps to Increase Diversion:</span>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {wasteAuditResult.divertedImprovementTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {wasteAuditResult.uncertaintyDisclaimer && (
                    <div className="mt-3 text-[10px] text-slate-400 italic">
                      * Modeling Note: {wasteAuditResult.uncertaintyDisclaimer}
                    </div>
                  )}
                </div>
              )}

              {/* Waste Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Waste Logged</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{formatWeight(wasteStats.total)}</span>
                    <span className="text-sm font-bold text-slate-500">{weightUnit} total</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>From your logs: sum of all recorded entries</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Diverted / Recycled</span>
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Recycle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-700">{formatWeight(wasteStats.recycled)}</span>
                    <span className="text-sm font-bold text-slate-500">{weightUnit} diverted</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>From your logs: {wasteStats.diversionRate}% diversion</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{wasteEntries.length}</span>
                    <span className="text-sm font-bold text-slate-500">records</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Shared dynamically across Analytics &amp; Quests</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-600" />
                    Waste Breakdown by Material &amp; Avoided Carbon Factor
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">Starter factors are illustrative estimates</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {(['Plastic', 'Paper', 'Organic', 'Glass', 'Metal'] as WasteCategory[]).map(cat => {
                    const amountKg = wasteStats.byCategory[cat] || 0;
                    const percentage = wasteStats.total > 0 ? Math.round((amountKg / wasteStats.total) * 100) : 0;
                    const factor = MATERIAL_CARBON_FACTORS[cat];
                    
                    return (
                      <div key={cat} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{cat}</span>
                            <span className="text-xs font-bold text-emerald-800">{percentage}%</span>
                          </div>
                          <div className="mt-2.5">
                            <span className="text-xl font-bold text-slate-900">{formatWeight(amountKg)}</span>
                            <span className="text-xs ml-1 font-semibold text-slate-600">{weightUnit}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60">
                          <span className="block text-[10px] text-slate-500 font-medium">
                            Avoids {factor.toFixed(2)} kg CO₂e / kg
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Entries Table */}
              <div className="bg-white rounded-3xl border border-emerald-100/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-emerald-100/60 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Waste Log Entries</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Household entries with a disposal method and date</p>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-50 font-bold px-2.5 py-1 rounded-full border border-emerald-200/50">
                    {wasteEntries.length} Waste records
                  </span>
                </div>

                {wasteEntries.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-xs text-slate-500 mb-4">No waste logs recorded yet.</p>
                    <button
                      onClick={handleOpenAddWaste}
                      className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Log First Entry
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3">Quantity</th>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Disposal Method</th>
                          <th className="px-5 py-3">Notes</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wasteEntries.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-slate-800">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/60">
                                {entry.category}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-900 font-bold">
                              {formatWeight(entry.quantityKg)} {weightUnit}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                              {entry.date}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {entry.method}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 text-xs max-w-xs truncate">
                              {entry.notes || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditWaste(entry)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="Edit entry"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWaste(entry.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'energy' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Zap className="w-6 h-6 text-amber-500" />
                    Energy Tracker
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Appliance electricity entries feed real-time calculations across the Dashboard, Analytics, and Quests.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddEnergy}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Appliance Usage</span>
                </button>
              </div>

              {/* Energy Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Consumption</span>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{energyStats.totalKwh.toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-500">kWh</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>From your logs: sum of recorded appliance readings</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg per Entry</span>
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-700">{energyStats.averagePerEntry.toFixed(2)}</span>
                    <span className="text-sm font-bold text-slate-500">kWh / log</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Average draw across recorded devices</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Peak Load Device</span>
                    <Flame className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-base font-bold text-slate-900 truncate block">
                      {energyStats.topAppliance?.name || 'No Logs Recorded'}
                    </span>
                    <span className="text-xs font-semibold text-rose-600">
                      {energyStats.topAppliance ? `${energyStats.topAppliance.kwh.toFixed(1)} kWh total draw` : '0 kWh'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Identified from empirical entries</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Entries</span>
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{energyEntries.length}</span>
                    <span className="text-sm font-bold text-slate-500">records</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Directly feeds Quests progress</p>
                </div>
              </div>

              {/* Energy Entries Table */}
              <div className="bg-white rounded-3xl border border-emerald-100/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-emerald-100/60 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Appliance Energy Log Entries</h2>
                  <span className="text-xs text-amber-800 bg-amber-50 font-bold px-2.5 py-1 rounded-full border border-amber-200/50">
                    {energyEntries.length} Energy Readings
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Appliance Name</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Electricity (kWh)</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Notes</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {energyEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{entry.applianceName}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {entry.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-900 font-extrabold">{entry.kwhConsumed.toFixed(2)} kWh</td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs">{entry.date}</td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs max-w-xs truncate">{entry.notes || '—'}</td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditEnergy(entry)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Edit entry"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEnergy(entry.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                    Impact Analytics
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Multi-stream ecological trends calculated from the entries you record.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                    <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0" />
                    <select
                      value={analyticsDateRange}
                      onChange={e => setAnalyticsDateRange(e.target.value as any)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All-Time Records</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="last90">Last 90 Days</option>
                      <option value="currentMonth">Current Month Only</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExportReport}
                    disabled={!analyticsData.hasData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Audit CSV</span>
                  </button>
                </div>
              </div>

              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recycled / Diverted</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Household Log
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-800">{formatWeight(analyticsData.recycledWasteKg)}</span>
                    <span className="text-sm font-bold text-slate-500">{weightUnit}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">From {analyticsData.filteredWasteCount} matched waste entries</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Electricity</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Household Log
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{analyticsData.totalEnergyKwh.toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-500">kWh</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">From {analyticsData.filteredEnergyCount} matched appliance logs</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Month-over-Month</span>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      Empirical Math
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${analyticsData.wasteMoMChangePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {analyticsData.wasteMoMChangePercent >= 0 ? `+${analyticsData.wasteMoMChangePercent}%` : `${analyticsData.wasteMoMChangePercent}%`}
                    </span>
                    <span className="text-xs font-bold text-slate-500">vs last mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatWeight(analyticsData.thisMonthWasteKg)} {weightUnit} vs {formatWeight(analyticsData.lastMonthWasteKg)} {weightUnit} prior
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      Date-Derived
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{activeStreakDays}</span>
                    <span className="text-sm font-bold text-slate-500">consecutive days</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Derived from unique log calendar dates</p>
                </div>
              </div>

              {/* Dynamic 6-Month Comparison Visualizer */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-600" />
                      Dynamic 6-Month Multi-Stream Comparison
                    </h2>
                    <p className="text-xs text-slate-400">Comparing recycled waste (kg) against appliance electricity consumed (kWh)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <span className="w-3 h-3 rounded-md bg-emerald-500" /> Recycled ({weightUnit})
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-3 h-3 rounded-md bg-amber-400" /> Energy (kWh)
                    </span>
                  </div>
                </div>

                <div className="h-60 flex items-end justify-between gap-4 pt-4 px-2">
                  {analyticsData.monthlySeries.map((m, idx) => {
                    const maxWaste = Math.max(...analyticsData.monthlySeries.map(s => s.wasteKg), 5);
                    const maxEnergy = Math.max(...analyticsData.monthlySeries.map(s => s.energyKwh), 10);

                    const wasteHeight = Math.min(100, Math.max(10, Math.round((m.wasteKg / maxWaste) * 100)));
                    const energyHeight = Math.min(100, Math.max(10, Math.round((m.energyKwh / maxEnergy) * 100)));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="flex items-end gap-1.5 w-full justify-center h-44">
                          <div
                            style={{ height: `${wasteHeight}%` }}
                            className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600 relative group/b1"
                          >
                            <span className="opacity-0 group-hover/b1:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap z-10 transition">
                              {formatWeight(m.wasteKg)} {weightUnit}
                            </span>
                          </div>
                          <div
                            style={{ height: `${energyHeight}%` }}
                            className="w-1/2 max-w-[28px] bg-amber-400 rounded-t-lg transition-all duration-500 hover:bg-amber-500 relative group/b2"
                          >
                            <span className="opacity-0 group-hover/b2:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap z-10 transition">
                              {m.energyKwh.toFixed(1)} kWh
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 mt-1">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'missions' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Target className="w-6 h-6 text-emerald-600" />
                    Eco Missions &amp; Quests
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Progress is based on your self-reported Waste and Energy Tracker entries.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/60 flex items-center gap-1.5 shadow-2xs">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>+{missionsSummary.earnedXp} XP Earned</span>
                </span>
              </div>

              {/* Missions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMissions.map(m => (
                  <div
                    key={m.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs relative hover:shadow-sm transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border bg-slate-50 text-slate-700">
                          {m.category}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          +{m.rewardXp} XP
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
                        <span>{m.title}</span>
                        {m.isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-1" />}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{m.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-700">Progress</span>
                          <span className="font-extrabold text-slate-900">
                            {m.currentValue.toFixed(m.metricType === 'waste_recycled_kg' ? 1 : 0)} / {m.targetValue} {m.unit} ({m.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${m.percent}%` }}
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 italic">
                          {m.calculationExplanation}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {m.isCompleted ? (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-100">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Quest Completed</span>
                        </div>
                      ) : !m.isJoined ? (
                        <button
                          onClick={() => handleToggleJoinMission(m.id)}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          Join Mission
                        </button>
                      ) : m.canComplete ? (
                        <button
                          onClick={() => handleCompleteMission(m.id)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                        >
                          Claim Reward (+{m.rewardXp} XP)
                        </button>
                      ) : (
                        <div className="w-full flex items-center gap-2">
                          {m.category === 'Transport' && (
                            <button
                              onClick={() => handleIncrementTransportCheckin(m.id)}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                              +1 Trip
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (m.category === 'Waste') setActiveTab('waste');
                              else if (m.category === 'Energy') setActiveTab('energy');
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center cursor-pointer"
                          >
                            Log Progress
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    Activity Timeline
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    A timeline of your logged waste, appliance entries, completed quests, and green actions.
                  </p>
                </div>
              </div>

              {/* Search & Stream Filter */}
              <div className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={timelineSearchQuery}
                    onChange={e => setTimelineSearchQuery(e.target.value)}
                    placeholder="Search logs by keyword or appliance..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Activities' },
                    { id: 'waste', label: 'Waste Logs' },
                    { id: 'energy', label: 'Energy Logs' },
                    { id: 'mission', label: 'Quests' },
                    { id: 'smart_action', label: 'Eco-Actions' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTimelineCategoryFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        timelineCategoryFilter === tab.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-100">
                {filteredTimelineFeed.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                    No matching activity records found.
                  </div>
                ) : (
                  filteredTimelineFeed.map(item => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3 h-3" />
                      </div>

                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700">
                              {item.categoryTag}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                              {item.verificationType}
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.date}
                            </span>
                          </div>
                          {item.numericHighlight && (
                            <span className="text-xs font-extrabold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                              {item.numericHighlight}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                        {item.details && (
                          <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">{item.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Settings className="w-6 h-6 text-emerald-600" />
                    Settings &amp; Preferences
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage profile details, measurement unit conversions, API access, and storage.
                  </p>
                </div>

                {settingsSavedToast && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Settings synchronized</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-emerald-100/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <User className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-bold text-slate-900 text-base">User Profile</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={userPreferences.displayName}
                        onChange={e => {
                          setUserPreferences(prev => ({ ...prev, displayName: e.target.value }));
                          setSettingsSavedToast(true);
                          setTimeout(() => setSettingsSavedToast(false), 2000);
                        }}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location / Region</label>
                      <input
                        type="text"
                        value={userPreferences.location}
                        onChange={e => {
                          setUserPreferences(prev => ({ ...prev, location: e.target.value }));
                          setSettingsSavedToast(true);
                          setTimeout(() => setSettingsSavedToast(false), 2000);
                        }}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-emerald-100/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Sliders className="w-5 h-5 text-teal-600" />
                    <h2 className="font-bold text-slate-900 text-base">Measurement Units</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Unit System</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUserPreferences(prev => ({ ...prev, unitSystem: 'metric' }));
                            setSettingsSavedToast(true);
                            setTimeout(() => setSettingsSavedToast(false), 2000);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            userPreferences.unitSystem === 'metric'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Metric (kg, km)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserPreferences(prev => ({ ...prev, unitSystem: 'imperial' }));
                            setSettingsSavedToast(true);
                            setTimeout(() => setSettingsSavedToast(false), 2000);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            userPreferences.unitSystem === 'imperial'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Imperial (lbs, mi)
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Weights are dynamically converted using 1 kg = 2.20462 lbs.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Custom Gemini API Key</label>
                      <div className="relative">
                        <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={userPreferences.customApiKey || ''}
                          onChange={e => {
                            setUserPreferences(prev => ({ ...prev, customApiKey: e.target.value }));
                            setSettingsSavedToast(true);
                            setTimeout(() => setSettingsSavedToast(false), 2000);
                          }}
                          placeholder="Paste Gemini API Key"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        The key stays in this browser. When you use Gemini, your question and a summary of your logged waste, energy and city are sent to Google. Use a restricted key and remove it here when you are done; local guidance works without a key.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-emerald-100/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Database className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-slate-900 text-base">Local Data Management</h2>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Waste Records:</span>
                        <strong className="text-slate-800">{wasteEntries.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Appliance Records:</span>
                        <strong className="text-slate-800">{energyEntries.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Communities:</span>
                        <strong className="text-slate-800">{communities.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Community Posts:</span>
                        <strong className="text-slate-800">{communityPosts.length}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetToDemoData}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reload Example Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsClearModalOpen(true)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Local Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              {/* Premium Hero Banner */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-7 sm:p-9 text-white shadow-xl shadow-emerald-950/10 border border-emerald-700/50">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="max-w-2xl space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-200 border border-white/15 backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Small habits, visible impact</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      Welcome, {userPreferences.displayName || 'Eco Explorer'}
                    </h1>

                    <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-normal">
                      Your household{userPreferences.location && userPreferences.location !== 'Add your city' ? <> in <strong className="text-white font-semibold">{userPreferences.location}</strong></> : null} has diverted <strong className="text-white font-bold">{formatWeight(wasteStats.recycled)} {weightUnit}</strong> of materials and recorded <strong className="text-white font-bold">{energyStats.totalKwh.toFixed(1)} kWh</strong> across {energyEntries.length} appliance logs.
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
                    <button
                      onClick={handleOpenAddWaste}
                      className="flex-1 sm:flex-none px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 ring-1 ring-white/50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-emerald-600" />
                      <span>Log Waste</span>
                    </button>

                    <button
                      onClick={handleOpenAddEnergy}
                      className="flex-1 sm:flex-none px-4 py-3 bg-emerald-700/70 hover:bg-emerald-700 text-white border border-emerald-400/30 text-xs font-bold rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Log Energy</span>
                    </button>

                    <button
                      onClick={() => {
                        setSmartActionError(null);
                        setSmartActionFeedback(null);
                        setIsLogModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Smart Action</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div 
                  onClick={() => setIsMethodologyModalOpen(true)}
                  className="bg-white p-6 rounded-3xl border border-emerald-100/90 shadow-xs hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Avoided Carbon</span>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    {sharedCarbonImpact.hasSufficientData ? (
                      <>
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                          {sharedCarbonImpact.totalCo2Saved.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-slate-400 italic">No avoided impact yet</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="underline decoration-dotted">Approximation from diverted materials and logged actions</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/90 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Energy Monitored</span>
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {energyStats.totalKwh.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">kWh</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>Household Log: {energyEntries.length} appliance logs</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/90 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Waste Diverted</span>
                    <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Recycle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {formatWeight(wasteStats.recycled)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{weightUnit}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>From your logs: {wasteStats.diversionRate}% diversion</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100/90 shadow-xs hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Terra Eco-Score</span>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Leaf className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    {sharedCarbonImpact.computedEcoScore !== null ? (
                      <>
                        <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                          {sharedCarbonImpact.computedEcoScore}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-slate-400 italic">Score Pending Logs</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gamified: Diversion + Quests + Streak</span>
                  </div>
                </div>
              </div>

              {/* Main Visualizer: Activity Chart & AI Coach Intelligence */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100/90 shadow-xs flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-emerald-600" />
                        Logged Activity Trends
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Aggregation of your logged waste entries, energy draws, and green actions
                      </p>
                    </div>

                    <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl text-xs font-bold text-slate-600 self-start sm:self-auto">
                      <button
                        onClick={() => setTimeframe('weekly')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          timeframe === 'weekly'
                            ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        Weekly View
                      </button>
                      <button
                        onClick={() => setTimeframe('monthly')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          timeframe === 'monthly'
                            ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                            : 'hover:text-slate-900'
                        }`}
                      >
                        4-Week Mode
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    {dashboardActivityTrends.every(d => d.events === 0) ? (
                      <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                        <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-600">No activity recorded for this period</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Start by logging a waste batch or appliance energy load</p>
                      </div>
                    ) : (
                      <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
                        {dashboardActivityTrends.map((col, idx) => {
                          const maxEvents = Math.max(...dashboardActivityTrends.map(d => d.events), 4);
                          const barHeightPercent = Math.min(100, Math.max(14, Math.round((col.events / maxEvents) * 100)));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                              <div className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition-colors">
                                {col.events} {col.events === 1 ? 'act' : 'acts'}
                              </div>

                              <div className="w-full bg-slate-100 rounded-2xl h-36 flex items-end p-1 overflow-hidden group-hover:bg-emerald-50 transition-colors">
                                <div
                                  style={{ height: `${barHeightPercent}%` }}
                                  className={`w-full rounded-xl transition-all duration-500 ${
                                    col.events > 0
                                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs group-hover:from-emerald-700 group-hover:to-teal-500'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              </div>

                              <div className="text-center">
                                <span className="block text-xs font-bold text-slate-700">{col.label}</span>
                                <span className="block text-[10px] text-slate-400">{col.subLabel}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span className="font-semibold text-slate-600">Logged Actions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                        <span className="font-medium text-slate-400">Baseline Target</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">Dynamic sync active across tabs</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between border border-emerald-800/60 relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 rounded-full text-xs font-bold shadow-2xs backdrop-blur-md">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Coach Diagnostic</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                        Contextual
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-lg text-white tracking-tight">
                        {energyStats.topAppliance
                          ? `Mitigate ${energyStats.topAppliance.name}`
                          : 'Optimize Waste Sorting'}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                        {energyStats.topAppliance
                          ? `Your highest recorded electrical draw is ${energyStats.topAppliance.name} (${energyStats.topAppliance.kwh.toFixed(1)} kWh). Shifting this load away from peak evening hours reduces grid emissions intensity by ~18%.`
                          : `Your household has achieved a ${wasteStats.diversionRate}% diversion rate. Ensuring clean sorting between plastics and food scraps preserves high compost yield.`}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-xs">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-300" /> Priority Recommendation:
                      </span>
                      <p className="text-xs text-emerald-100">
                        {wasteStats.byCategory.Organic > 3
                          ? "High organic scrap volume detected. Ensure wet scraps are turned regularly to maintain aerobic composting."
                          : "Audit phantom standby devices (entertainment and PC workstations) overnight."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-emerald-800/80 flex items-center justify-between relative z-10">
                    <button
                      onClick={() => setActiveTab('coach')}
                      className="text-xs font-bold text-emerald-200 hover:text-white flex items-center gap-1.5 group transition cursor-pointer"
                    >
                      <span>Ask AI Coach</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('missions')}
                      className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl border border-white/15 transition active:scale-95 cursor-pointer"
                    >
                      Active Quests
                    </button>
                  </div>
                </div>
              </div>

              {/* Snapshots Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-emerald-100/90 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Recent Entries
                    </h2>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      View All ({unifiedTimelineFeed.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {unifiedTimelineFeed.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No activities logged yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 mt-2">
                      {unifiedTimelineFeed.slice(0, 4).map(item => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600 shrink-0">
                              {item.type === 'waste' && <Trash2 className="w-4 h-4 text-emerald-600" />}
                              {item.type === 'energy' && <Zap className="w-4 h-4 text-amber-500" />}
                              {item.type === 'mission' && <Target className="w-4 h-4 text-teal-600" />}
                              {item.type === 'smart_action' && <Sparkles className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                              <p className="text-[11px] text-slate-400 truncate">{item.subtitle} • {item.date}</p>
                            </div>
                          </div>
                          {item.numericHighlight && (
                            <span className="text-xs font-extrabold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 shrink-0">
                              {item.numericHighlight}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-emerald-100/90 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      Active Quests Progress
                    </h2>
                    <button
                      onClick={() => setActiveTab('missions')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      All Quests ({missions.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4 mt-3">
                    {missionProgressList.slice(0, 3).map(m => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{m.title}</span>
                          <span className="font-extrabold text-emerald-700">+{m.rewardXp} XP</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Progress: {m.currentValue.toFixed(m.metricType === 'waste_recycled_kg' ? 1 : 0)} / {m.targetValue} {m.unit}</span>
                          <span className="font-bold text-slate-700">{m.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{ width: `${m.percent}%` }}
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Create Community */}
        {isCreateCommunityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Create Neighborhood Community</h3>
                </div>
                <button onClick={() => setIsCreateCommunityModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateCommunity} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Community / Guild Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noida Sector 50 Green Canopy Circle"
                    value={newCommunityForm.name}
                    onChange={e => setNewCommunityForm({ ...newCommunityForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location / Area</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sector 50, Noida"
                      value={newCommunityForm.location}
                      onChange={e => setNewCommunityForm({ ...newCommunityForm, location: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Focus</label>
                    <select
                      value={newCommunityForm.category}
                      onChange={e => setNewCommunityForm({ ...newCommunityForm, category: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="Cleanups">Cleanups &amp; Litter Removal</option>
                      <option value="Composting">Decentralized Composting</option>
                      <option value="Solar & Energy">Solar &amp; Energy Auditing</option>
                      <option value="Biodiversity">Biodiversity &amp; Planting</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Goals</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your environmental mission and regular activities..."
                    value={newCommunityForm.description}
                    onChange={e => setNewCommunityForm({ ...newCommunityForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={newCommunityForm.coverImage}
                    onChange={e => setNewCommunityForm({ ...newCommunityForm, coverImage: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Directory Visibility</span>
                    <span className="text-[11px] text-slate-500">
                      {newCommunityForm.isPublic ? 'Public: Listed in the global discover directory' : 'Private: Invitation and direct link only'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCommunityForm({ ...newCommunityForm, isPublic: !newCommunityForm.isPublic })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      newCommunityForm.isPublic ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {newCommunityForm.isPublic ? 'Public' : 'Private'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={newCommunityForm.hasFundingGoal}
                      onChange={e => setNewCommunityForm({ ...newCommunityForm, hasFundingGoal: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Attach Equipment or Material Funding Campaign</span>
                  </label>

                  {newCommunityForm.hasFundingGoal && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Campaign Goal Title</label>
                        <input
                          type="text"
                          placeholder="e.g. 50 Heavy Duty Sapling Guards &amp; Shovels"
                          value={newCommunityForm.goalTitle}
                          onChange={e => setNewCommunityForm({ ...newCommunityForm, goalTitle: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Target Amount (₹)</label>
                          <input
                            type="number"
                            value={newCommunityForm.targetAmount}
                            onChange={e => setNewCommunityForm({ ...newCommunityForm, targetAmount: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Purpose</label>
                          <input
                            type="text"
                            placeholder="e.g. Tools and composting culture"
                            value={newCommunityForm.fundingPurpose}
                            onChange={e => setNewCommunityForm({ ...newCommunityForm, fundingPurpose: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-800 italic">
                        * Pledges are simulated in prototype mode without real monetary transactions.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateCommunityModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Create &amp; Launch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Post */}
        {isCreatePostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Publish Cleanup Update</h3>
                </div>
                <button onClick={() => setIsCreatePostModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Community</label>
                  <select
                    required
                    value={newPostForm.communityId}
                    onChange={e => setNewPostForm({ ...newPostForm, communityId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="">Select one of your joined communities</option>
                    {communities.filter(c => c.isJoinedByMe).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Post Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cleared 32kg of riverbank plastic this morning!"
                    value={newPostForm.title}
                    onChange={e => setNewPostForm({ ...newPostForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Waste Diverted (kg, optional)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 24.5"
                      value={newPostForm.wasteCollectedKg}
                      onChange={e => setNewPostForm({ ...newPostForm, wasteCollectedKg: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Volunteers Joined (optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 14"
                      value={newPostForm.volunteersAttended}
                      onChange={e => setNewPostForm({ ...newPostForm, volunteersAttended: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Photo URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newPostForm.imageUrl}
                    onChange={e => setNewPostForm({ ...newPostForm, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Update</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share what your team accomplished, lessons learned, and next steps..."
                    value={newPostForm.content}
                    onChange={e => setNewPostForm({ ...newPostForm, content: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatePostModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Publish to Feed
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Funding Pledge */}
        {isFundingModalOpen && fundingCommunityTarget && fundingCommunityTarget.fundingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Support Equipment Drive</h3>
                </div>
                <button onClick={() => setIsFundingModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handlePledgeFunding} className="p-5 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{fundingCommunityTarget.fundingCampaign.goalTitle}</h4>
                  <p className="text-slate-500 mt-1">{fundingCommunityTarget.fundingCampaign.purpose}</p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Target Goal:</span>
                    <span>₹{fundingCommunityTarget.fundingCampaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>Current Pledged:</span>
                    <span>₹{fundingCommunityTarget.fundingCampaign.currentPledged.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select or Enter Pledge Amount (₹)</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[250, 500, 1000, 2500].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFundingPledgeAmount(amt)}
                        className={`py-1.5 rounded-lg border font-bold transition cursor-pointer ${
                          fundingPledgeAmount === amt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={fundingPledgeAmount}
                    onChange={e => setFundingPledgeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-0.5">
                  <p className="font-bold">Transparent Prototype Notice</p>
                  <p className="text-[11px] leading-relaxed">
                    This action records a simulated pledge toward the community goal. In compliance with contest ethics, no real payment gateway is queried or charged.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFundingModalOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Confirm Demo Pledge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modular Methodology Modal */}
        <MethodologyModal
          isOpen={isMethodologyModalOpen}
          onClose={() => setIsMethodologyModalOpen(false)}
        />

        {/* Modal: Clear Data */}
        {isClearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
              <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
                <h3 className="font-bold text-sm sm:text-base text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Clear All Local Data?
                </h3>
                <button onClick={() => setIsClearModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-slate-600 text-xs sm:text-sm">
                <p>This will permanently erase all recorded waste, energy, missions, community posts, and timeline actions from this browser storage.</p>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Yes, Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Waste Entry */}
        {isWasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">
                    {editingWasteId ? 'Edit Waste Entry' : 'Record Waste Entry'}
                  </h3>
                </div>
                <button onClick={() => setIsWasteModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveWasteEntry} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waste Category</label>
                  <select
                    value={wasteForm.category}
                    onChange={e => setWasteForm({ ...wasteForm, category: e.target.value as WasteCategory })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Plastic">Plastic</option>
                    <option value="Paper">Paper</option>
                    <option value="Organic">Organic</option>
                    <option value="Glass">Glass</option>
                    <option value="Metal">Metal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantity (in {weightUnit})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      required
                      value={wasteForm.quantityKg}
                      onChange={e => setWasteForm({ ...wasteForm, quantityKg: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      max={todayStr}
                      required
                      value={wasteForm.date}
                      onChange={e => setWasteForm({ ...wasteForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Method</label>
                  <select
                    value={wasteForm.method}
                    onChange={e => setWasteForm({ ...wasteForm, method: e.target.value as DisposalMethod })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Recycled">Recycled</option>
                    <option value="Composted">Composted</option>
                    <option value="Donated/Reused">Donated / Reused</option>
                    <option value="Landfill">Landfill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={wasteForm.notes}
                    onChange={e => setWasteForm({ ...wasteForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Clean cardboard delivery boxes"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWasteModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Energy Entry */}
        {isEnergyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900">
                    {editingEnergyId ? 'Edit Energy Entry' : 'Record Electricity Usage'}
                  </h3>
                </div>
                <button onClick={() => setIsEnergyModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveEnergyEntry} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appliance Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inverter Air Conditioner, Refrigerator"
                    value={energyForm.applianceName}
                    onChange={e => setEnergyForm({ ...energyForm, applianceName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={energyForm.category}
                    onChange={e => setEnergyForm({ ...energyForm, category: e.target.value as EnergyApplianceCategory })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="HVAC / Heating">HVAC / Heating</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Computing">Computing</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Electricity (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={energyForm.kwhConsumed}
                      onChange={e => setEnergyForm({ ...energyForm, kwhConsumed: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      max={todayStr}
                      required
                      value={energyForm.date}
                      onChange={e => setEnergyForm({ ...energyForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={energyForm.notes}
                    onChange={e => setEnergyForm({ ...energyForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Eco cycle run overnight"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEnergyModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Smart Quick Log */}
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden">
              <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-slate-900">AI Eco-Action Auditor</h3>
                    <p className="text-[11px] text-slate-500">Evaluates actions against regional environmental emission models</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setSmartActionFeedback(null);
                    setSmartActionInput('');
                    setSmartActionError(null);
                  }}
                  className="cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Describe Your Sustainable Action</label>
                  <textarea
                    rows={3}
                    value={smartActionInput}
                    onChange={e => setSmartActionInput(e.target.value)}
                    placeholder="e.g. Took the metro 16km instead of driving a petrol car, or composted 2.5kg of kitchen scraps."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Your entries are self-reported; impact figures are illustrative estimates.
                  </span>
                  <button
                    onClick={handleAnalyzeSmartAction}
                    disabled={isAnalyzingAction || !smartActionInput.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {isAnalyzingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Estimate Impact</span>
                  </button>
                </div>

                {smartActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Analysis Notice</p>
                      <p>{smartActionError}</p>
                    </div>
                  </div>
                )}

                {smartActionFeedback && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span>Category: {smartActionFeedback.detectedCategory}</span>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                        Confidence: {smartActionFeedback.confidenceRating}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-950">
                        {smartActionFeedback.co2SavedKg.toFixed(2)} kg CO₂e
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        +{smartActionFeedback.points} Points
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      {smartActionFeedback.insight}
                    </p>

                    <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-800/80 italic">
                      Modeling Assumption: {smartActionFeedback.assumptionsUsed}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogModalOpen(false);
                      setSmartActionFeedback(null);
                      setSmartActionInput('');
                      setSmartActionError(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  {smartActionFeedback && (
                    <button
                      type="button"
                      onClick={handleConfirmSmartAction}
                      className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      Confirm &amp; Add to Timeline
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
