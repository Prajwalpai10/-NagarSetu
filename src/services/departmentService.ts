export interface DepartmentMetric {
  id: string;
  name: string;
  slaCompliance: number;
  mttr: string;
  totalCases: number;
  resolved: number;
  breached: number;
  csat: number;
  status: 'Target Met' | 'Exceeding SLA' | 'Warning' | 'At Risk';
  leadEngineer: string;
  budgetUtilized: string;
  primaryBottleneck: string;
  weeklyTrend: number[];
}

const DEFAULT_DEPARTMENTS: DepartmentMetric[] = [
  {
    id: 'Roads',
    name: 'Roads & Infrastructure (BBMP)',
    slaCompliance: 94.2,
    mttr: '3.4 Hours',
    totalCases: 642,
    resolved: 605,
    breached: 37,
    csat: 4.4,
    status: 'Target Met',
    leadEngineer: 'Chief Eng. K. R. Raghavan',
    budgetUtilized: '78.4%',
    primaryBottleneck: 'Monsoon asphalt curing delays & raw aggregate delivery',
    weeklyTrend: [45, 52, 58, 64, 70, 75, 82],
  },
  {
    id: 'Power',
    name: 'Power & Grid (BESCOM)',
    slaCompliance: 96.5,
    mttr: '2.1 Hours',
    totalCases: 418,
    resolved: 403,
    breached: 15,
    csat: 4.7,
    status: 'Exceeding SLA',
    leadEngineer: 'Superintending Eng. V. Rao',
    budgetUtilized: '84.1%',
    primaryBottleneck: 'Transformer fuse shortages in suburban feeder sub-stations',
    weeklyTrend: [30, 32, 28, 35, 40, 38, 42],
  },
  {
    id: 'Sanitation',
    name: 'Solid Waste Management (BBMP SWM)',
    slaCompliance: 88.6,
    mttr: '5.1 Hours',
    totalCases: 890,
    resolved: 789,
    breached: 101,
    csat: 4.1,
    status: 'Warning',
    leadEngineer: 'Joint Commissioner (Health & SWM)',
    budgetUtilized: '91.2%',
    primaryBottleneck: 'Compactor vehicle breakdown during secondary transfers',
    weeklyTrend: [90, 85, 95, 110, 105, 115, 120],
  },
  {
    id: 'Water',
    name: 'Water Supply & Sewerage (BWSSB)',
    slaCompliance: 81.4,
    mttr: '7.8 Hours',
    totalCases: 512,
    resolved: 417,
    breached: 95,
    csat: 3.8,
    status: 'At Risk',
    leadEngineer: 'Chief Eng. Maintenance (BWSSB)',
    budgetUtilized: '69.0%',
    primaryBottleneck: 'Trench digging road restoration clearance conflicts with BBMP',
    weeklyTrend: [50, 48, 62, 58, 70, 65, 74],
  },
  {
    id: 'Traffic',
    name: 'Traffic Police Civic Liaison',
    slaCompliance: 92.0,
    mttr: '4.0 Hours',
    totalCases: 230,
    resolved: 212,
    breached: 18,
    csat: 4.3,
    status: 'Target Met',
    leadEngineer: 'DCP Traffic Operations Desk',
    budgetUtilized: '62.5%',
    primaryBottleneck: 'Signals firmware synch & tow truck availability',
    weeklyTrend: [20, 22, 25, 24, 28, 29, 31],
  },
  {
    id: 'Forest',
    name: 'Forest & Tree Authority',
    slaCompliance: 87.2,
    mttr: '8.5 Hours',
    totalCases: 145,
    resolved: 126,
    breached: 19,
    csat: 4.2,
    status: 'Warning',
    leadEngineer: 'Deputy Conservator of Forests (BBMP)',
    budgetUtilized: '54.0%',
    primaryBottleneck: 'Hydraulic boom crane availability during high winds',
    weeklyTrend: [12, 14, 16, 18, 22, 20, 25],
  },
];

export const departmentService = {
  getDepartments: (): DepartmentMetric[] => {
    return DEFAULT_DEPARTMENTS;
  },

  syncRoster: (): { syncedCount: number; activeShift: string } => {
    return {
      syncedCount: 14,
      activeShift: 'Day Shift (08:00 - 18:00) • 4 Divisions Synced'
    };
  }
};
