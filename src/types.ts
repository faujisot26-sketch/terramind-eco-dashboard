export type WasteCategory = 'Plastic' | 'Paper' | 'Organic' | 'Glass' | 'Metal';
export type DisposalMethod = 'Recycled' | 'Composted' | 'Landfill' | 'Donated/Reused';

export interface WasteEntry {
  id: string;
  category: WasteCategory;
  quantityKg: number;
  date: string;
  method: DisposalMethod;
  notes?: string;
}

export type EnergyApplianceCategory = 
  | 'Kitchen' 
  | 'HVAC / Heating' 
  | 'Entertainment' 
  | 'Computing' 
  | 'Laundry' 
  | 'Lighting' 
  | 'Other';

export interface EnergyEntry {
  id: string;
  applianceName: string;
  category: EnergyApplianceCategory;
  kwhConsumed: number;
  date: string;
  notes?: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: { uri?: string; title?: string }[];
  isError?: boolean;
}

export interface WasteAuditResult {
  summary: string;
  estimatedCarbonImpactKg: number;
  topRecommendation: string;
  divertedImprovementTips: string[];
  uncertaintyDisclaimer?: string;
}

export type MissionCategory = 'Waste' | 'Energy' | 'Transport';
export type MissionMetricType = 'waste_recycled_kg' | 'energy_logs_count' | 'transport_checkins';

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  description: string;
  metricType: MissionMetricType;
  targetValue: number;
  unit: string;
  deadline: string;
  rewardXp: number;
  isJoined: boolean;
  manualCheckinCount?: number;
  isCompleted: boolean;
  completedAt?: string;
  calculationExplanation: string;
}

export interface ConfirmedSmartAction {
  id: string;
  title: string;
  detectedCategory: string;
  co2SavedKg: number;
  points: number;
  insight: string;
  date: string;
  confidenceRating?: 'High' | 'Medium' | 'Approximate';
  assumptionsUsed?: string;
}

export type TimelineItemType = 'waste' | 'energy' | 'mission' | 'smart_action';

export interface TimelineFeedItem {
  id: string;
  type: TimelineItemType;
  categoryTag: string;
  title: string;
  subtitle: string;
  date: string;
  badgeText: string;
  details?: string;
  numericHighlight?: string;
  verificationType: 'Household Log' | 'Model Estimate' | 'Gamified Achievement';
}

export interface UserPreferences {
  displayName: string;
  location: string;
  unitSystem: 'metric' | 'imperial';
  theme: 'emerald' | 'minimal';
  emailWeeklyDigest: boolean;
  streakReminders: boolean;
  customApiKey?: string;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  authorRole?: string;
  text: string;
  date: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  title: string;
  content: string;
  imageUrl?: string;
  wasteCollectedKg?: number;
  volunteersAttended?: number;
  likesCount: number;
  isLikedByMe?: boolean;
  comments: CommunityComment[];
}

export interface VolunteerDrive {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  volunteersNeeded: number;
  volunteersRegistered: number;
  isUserRegistered?: boolean;
}

export interface CommunityFundingCampaign {
  id: string;
  goalTitle: string;
  targetAmount: number;
  currentPledged: number;
  purpose: string;
}

export interface Community {
  id: string;
  name: string;
  location: string;
  description: string;
  coverImage: string;
  isPublic: boolean;
  category: 'Cleanups' | 'Composting' | 'Solar & Energy' | 'Biodiversity';
  creatorName: string;
  createdDate: string;
  memberCount: number;
  isJoinedByMe: boolean;
  fundingCampaign?: CommunityFundingCampaign;
  volunteerDrives: VolunteerDrive[];
}

export type ActiveTab = 
  | 'dashboard' 
  | 'community' 
  | 'waste' 
  | 'energy' 
  | 'coach' 
  | 'analytics' 
  | 'missions' 
  | 'timeline' 
  | 'settings';