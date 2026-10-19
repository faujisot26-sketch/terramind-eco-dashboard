import { 
  WasteCategory, 
  UserPreferences, 
  Mission, 
  WasteEntry, 
  EnergyEntry, 
  ConfirmedSmartAction, 
  Community, 
  CommunityPost 
} from './types';

export const MATERIAL_CARBON_FACTORS: Record<WasteCategory, number> = {
  Plastic: 1.40,
  Paper: 0.95,
  Organic: 0.50,
  Glass: 0.30,
  Metal: 4.50
};

export const REGIONAL_GRID_INTENSITY_KG_PER_KWH = 0.82;
export const BENCHMARK_DAILY_HOUSEHOLD_KWH = 10.5;
export const KG_TO_LBS = 2.20462;

export const INITIAL_PREFERENCES: UserPreferences = {
  displayName: 'Eco Explorer',
  location: 'Add your city',
  unitSystem: 'metric',
  theme: 'emerald',
  emailWeeklyDigest: true,
  streakReminders: true,
  customApiKey: ''
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-waste-1',
    title: 'Zero Landfill Diverter',
    category: 'Waste',
    description: 'Log at least 5.0 kg of household materials sent for recycling or composting.',
    metricType: 'waste_recycled_kg',
    targetValue: 5.0,
    unit: 'kg diverted',
    deadline: '2026-10-31',
    rewardXp: 150,
    isJoined: true,
    isCompleted: false,
    calculationExplanation: 'Directly calculated from the sum of kg in your Waste Tracker where disposal method is "Recycled", "Composted", or "Donated/Reused".'
  },
  {
    id: 'm-energy-1',
    title: 'Appliance Power Auditor',
    category: 'Energy',
    description: 'Log and monitor at least 6 unique appliance electricity entries in the Energy Tracker.',
    metricType: 'energy_logs_count',
    targetValue: 6,
    unit: 'appliance logs',
    deadline: '2026-11-05',
    rewardXp: 120,
    isJoined: true,
    isCompleted: false,
    calculationExplanation: 'Counted from appliance entries in your Energy Tracker.'
  },
  {
    id: 'm-transport-1',
    title: 'Green Commuter Sprint',
    category: 'Transport',
    description: 'Complete 4 car-free transit check-ins (e.g. metro, bicycle, walking, or shared EV transit).',
    metricType: 'transport_checkins',
    targetValue: 4,
    unit: 'clean trips',
    deadline: '2026-10-28',
    rewardXp: 200,
    isJoined: true,
    manualCheckinCount: 2,
    isCompleted: false,
    calculationExplanation: 'Tracked via your individual car-free commute check-ins.'
  },
  {
    id: 'm-waste-2',
    title: 'Organic Composting Master',
    category: 'Waste',
    description: 'Divert 8.0 kg of organic kitchen scraps and compostable materials to prevent landfill methane.',
    metricType: 'waste_recycled_kg',
    targetValue: 8.0,
    unit: 'kg diverted',
    deadline: '2026-11-15',
    rewardXp: 250,
    isJoined: false,
    isCompleted: false,
    calculationExplanation: 'Derived from cumulative weight of diverted organic waste entries logged.'
  },
  {
    id: 'm-energy-2',
    title: 'Phantom Load Hunter',
    category: 'Energy',
    description: 'Record 10 individual appliance readings to audit baseline phantom loads and high-draw cycles.',
    metricType: 'energy_logs_count',
    targetValue: 10,
    unit: 'appliance logs',
    deadline: '2026-11-20',
    rewardXp: 180,
    isJoined: false,
    isCompleted: false,
    calculationExplanation: 'Calculated directly from appliance usage logs.'
  }
];

export const INITIAL_WASTE_ENTRIES: WasteEntry[] = [
  {
    id: 'w-1',
    category: 'Plastic',
    quantityKg: 1.4,
    date: '2026-10-18',
    method: 'Recycled',
    notes: 'Clean HDPE milk bottles & containers'
  },
  {
    id: 'w-2',
    category: 'Organic',
    quantityKg: 3.2,
    date: '2026-10-17',
    method: 'Composted',
    notes: 'Vegetable peelings and coffee grounds'
  },
  {
    id: 'w-3',
    category: 'Paper',
    quantityKg: 2.1,
    date: '2026-10-16',
    method: 'Recycled',
    notes: 'Corrugated cardboard delivery packaging'
  },
  {
    id: 'w-4',
    category: 'Glass',
    quantityKg: 1.8,
    date: '2026-10-15',
    method: 'Recycled',
    notes: 'Clean culinary preserve jars'
  },
  {
    id: 'w-5',
    category: 'Metal',
    quantityKg: 0.6,
    date: '2026-10-13',
    method: 'Recycled',
    notes: 'Aluminum beverage cans'
  },
  {
    id: 'w-6',
    category: 'Organic',
    quantityKg: 2.5,
    date: '2026-09-28',
    method: 'Composted',
    notes: 'Garden leaves and botanical clippings'
  },
  {
    id: 'w-7',
    category: 'Paper',
    quantityKg: 1.5,
    date: '2026-09-20',
    method: 'Recycled',
    notes: 'Office documents and newspapers'
  }
];

export const INITIAL_ENERGY_ENTRIES: EnergyEntry[] = [
  {
    id: 'e-1',
    applianceName: 'Inverter Air Conditioner',
    category: 'HVAC / Heating',
    kwhConsumed: 6.8,
    date: '2026-10-18',
    notes: 'Evening climate cycle at 25°C'
  },
  {
    id: 'e-2',
    applianceName: 'BEE 5-Star Refrigerator',
    category: 'Kitchen',
    kwhConsumed: 2.1,
    date: '2026-10-18',
    notes: '24-hour continuous baseline'
  },
  {
    id: 'e-3',
    applianceName: 'Induction Cooktop',
    category: 'Kitchen',
    kwhConsumed: 1.4,
    date: '2026-10-17',
    notes: 'Dinner preparation batch'
  },
  {
    id: 'e-4',
    applianceName: 'Home Workstation Rig',
    category: 'Computing',
    kwhConsumed: 2.6,
    date: '2026-10-17',
    notes: 'Dual monitor and laptop workstation'
  },
  {
    id: 'e-5',
    applianceName: 'Smart LED TV & Audio',
    category: 'Entertainment',
    kwhConsumed: 1.5,
    date: '2026-10-16',
    notes: 'Evening streaming session'
  },
  {
    id: 'e-6',
    applianceName: 'Washing Machine (Eco Mode)',
    category: 'Laundry',
    kwhConsumed: 1.1,
    date: '2026-10-15',
    notes: 'Cold cycle full drum load'
  },
  {
    id: 'e-7',
    applianceName: 'Microwave & Oven',
    category: 'Kitchen',
    kwhConsumed: 1.8,
    date: '2026-10-14',
    notes: 'Reheating and baking'
  },
  {
    id: 'e-8',
    applianceName: 'Inverter Air Conditioner',
    category: 'HVAC / Heating',
    kwhConsumed: 8.4,
    date: '2026-09-24',
    notes: 'Afternoon peak cooling'
  }
];

export const INITIAL_SAVED_ACTIONS: ConfirmedSmartAction[] = [
  {
    id: 'sa-1',
    title: 'Metro Transit Commute (16 km)',
    detectedCategory: 'Commute',
    co2SavedKg: 2.9,
    points: 40,
    insight: 'Replaced a solo gasoline car trip with rapid electric municipal metro transit.',
    date: '2026-10-18',
    confidenceRating: 'High',
    assumptionsUsed: 'Avoided passenger car footprint (180g CO₂e/km) minus electric transit grid allocation.'
  },
  {
    id: 'sa-2',
    title: 'Cold Wash Laundry Run',
    detectedCategory: 'Energy',
    co2SavedKg: 1.2,
    points: 25,
    insight: 'Eliminated water heating element draw during the wash cycle.',
    date: '2026-10-16',
    confidenceRating: 'High',
    assumptionsUsed: 'Saved ~1.5 kWh water heating element draw using regional grid intensity factor (0.82 kg/kWh).'
  }
];

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'comm-1',
    name: 'Yamuna Riverbank Restoration Guild',
    location: 'Noida Sector 128 / River Corridor',
    description: 'Community-led wetland conservation, plastic cleanup patrols, and indigenous riparian tree planting along the floodplain.',
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
    isPublic: true,
    category: 'Cleanups',
    creatorName: 'Priya Sharma',
    createdDate: '2026-08-14',
    memberCount: 84,
    isJoinedByMe: true,
    fundingCampaign: {
      id: 'fc-1',
      goalTitle: 'Heavy-Duty Trash Grabbers & Bio-Sacks Fund',
      targetAmount: 15000,
      currentPledged: 9400,
      purpose: 'Purchasing 40 stainless steel litter pickers and puncture-resistant woven canvas bags for weekend floodplain cleanups.'
    },
    volunteerDrives: [
      {
        id: 'vd-1',
        title: 'Saturday Floodplain Plastic Removal Drive',
        date: '2026-10-24',
        time: '07:30 AM - 10:00 AM',
        location: 'Yamuna Ghat 4, Sector 128',
        volunteersNeeded: 25,
        volunteersRegistered: 18,
        isUserRegistered: true
      }
    ]
  },
  {
    id: 'comm-2',
    name: 'Greater Noida Composting Cooperative',
    location: 'Alpha 1 & Beta 2 Sectors',
    description: 'Decentralized aerated composting pits for kitchen organic waste, leaves, and botanical clippings across apartment high-rises.',
    coverImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80',
    isPublic: true,
    category: 'Composting',
    creatorName: 'Rohan Mehra',
    createdDate: '2026-09-02',
    memberCount: 52,
    isJoinedByMe: false,
    fundingCampaign: {
      id: 'fc-2',
      goalTitle: 'Bokashi Microbial Culture & Tumbler Drums',
      targetAmount: 22000,
      currentPledged: 14500,
      purpose: 'Sponsoring 3 high-volume rotating compost drums and aerobic microbial bran for society waste diversion.'
    },
    volunteerDrives: [
      {
        id: 'vd-2',
        title: 'Microbial Inoculant Workshop & Drum Turning',
        date: '2026-10-25',
        time: '04:00 PM - 06:00 PM',
        location: 'Community Park 3, Beta 2',
        volunteersNeeded: 12,
        volunteersRegistered: 7,
        isUserRegistered: false
      }
    ]
  },
  {
    id: 'comm-3',
    name: 'Sector 62 Rooftop Solar & Clean Grid Circle',
    location: 'Sector 62 Institutional Area',
    description: 'Knowledge sharing for solar net-metering installations, home inverter audits, and community bulk purchasing of heat-pump appliances.',
    coverImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    isPublic: true,
    category: 'Solar & Energy',
    creatorName: 'Arjun Das',
    createdDate: '2026-09-19',
    memberCount: 39,
    isJoinedByMe: false,
    volunteerDrives: []
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    communityId: 'comm-1',
    authorName: 'Priya Sharma',
    date: '2026-10-18',
    title: 'Weekend Drive Results: 48.5 kg of Single-Use Plastic Intercepted!',
    content: 'Massive thank you to the 18 neighborhood volunteers who showed up at 7:30 AM today along Yamuna Ghat 4. We systematically cleared plastic bottles, multi-layer food sachets, and stranded thermocol. All collected HDPE and PET bottles were weighed and dropped off at the municipal material recovery facility.',
    imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
    wasteCollectedKg: 48.5,
    volunteersAttended: 18,
    likesCount: 24,
    isLikedByMe: true,
    comments: [
      {
        id: 'c-1',
        authorName: 'Alex Lawson',
        authorRole: 'Member',
        text: 'Great effort team! The northern stretch is looking noticeably cleaner. Will join this coming Saturday again.',
        date: '2026-10-18'
      },
      {
        id: 'c-2',
        authorName: 'Karan Patel',
        text: 'Did the recycling facility provide a diversion slip? We can log the avoided carbon directly.',
        date: '2026-10-18'
      }
    ]
  },
  {
    id: 'post-2',
    communityId: 'comm-2',
    authorName: 'Rohan Mehra',
    date: '2026-10-16',
    title: 'First Batch of Rich Society Compost Ready for Herb Gardens',
    content: 'After 6 weeks of careful turning and temperature monitoring in our community aerated tumblers, the first batch of odor-free compost is ready! Free organic soil amendment bags are available for society members starting tomorrow morning.',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a63?w=800&auto=format&fit=crop&q=80',
    wasteCollectedKg: 92.0,
    volunteersAttended: 8,
    likesCount: 31,
    isLikedByMe: false,
    comments: [
      {
        id: 'c-3',
        authorName: 'Neha Verma',
        text: 'Amazing turnaround time! Will bring empty buckets from Tower B.',
        date: '2026-10-17'
      }
    ]
  }
];
