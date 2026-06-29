export type HiringSignal = 'Strong Signal' | 'Moderate Signal' | 'Possible Signal' | 'No Signal Found';

export type AiScanResult = {
  signal: HiringSignal;
  confidence: number;
  reasoning: string;
  likelyRoles: string[];
  whyNow: string;
  searchQuery: string;
  nextAction: string;
  caveat: string;
};

export const SCAN_CONTRACT = {
  signal: 'Strong Signal | Moderate Signal | Possible Signal | No Signal Found',
  confidence: 'number from 0 to 100',
  reasoning: 'short plain-English explanation',
  likelyRoles: 'array of likely learning, training, CE, LMS, or instructional titles',
  whyNow: 'one sentence timing angle',
  searchQuery: 'Google search query to verify the signal',
  nextAction: 'one low-pressure seller action',
  caveat: 'one sentence caveat that avoids overclaiming'
};
