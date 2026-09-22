// Stand-in for the chunk index the real ingestion pipeline (KB-001..KB-005) will build.
// Keyed by KnowledgeDocument.id. Passages are only ever searched when their document is
// 'indexed' in documentStore — see knowledgeService.ts. Remove once POST /api/knowledge/query exists.

export interface MockPassage {
  page: number;
  section?: string;
  requirementId?: string;
  text: string;
}

export const MOCK_DOCUMENT_PASSAGES: Record<string, MockPassage[]> = {
  'seed-adcs-srs': [
    {
      page: 12,
      section: '§3.2.1 Pointing Accuracy',
      requirementId: 'ADCS-SRS-021',
      text: 'The ADCS software shall achieve an absolute pointing accuracy better than 0.1° (3σ) about each axis while in nadir-pointing mode.',
    },
    {
      page: 14,
      section: '§3.2.3 Attitude Knowledge',
      requirementId: 'ADCS-SRS-027',
      text: 'The ADCS software shall estimate spacecraft attitude with a knowledge error below 0.02° (3σ) using star tracker and gyroscope measurements fused in an extended Kalman filter.',
    },
    {
      page: 18,
      section: '§3.3.1 Detumbling',
      requirementId: 'ADCS-SRS-034',
      text: 'After separation from the launch vehicle, the ADCS software shall reduce body angular rates below 0.5 deg/s within 3 orbits using a B-dot control law driving the magnetorquers.',
    },
    {
      page: 23,
      section: '§3.4.2 Safe Mode Transition',
      requirementId: 'ADCS-SRS-041',
      text: 'On loss of valid attitude knowledge for more than 60 s, the ADCS software shall autonomously transition to Sun-pointing safe mode using coarse Sun sensors.',
    },
    {
      page: 31,
      section: '§3.6.1 Control Loop Timing',
      requirementId: 'ADCS-SRS-058',
      text: 'The attitude determination and control loop shall execute at a fixed rate of 10 Hz with a maximum jitter of 5 ms.',
    },
    {
      page: 35,
      section: '§3.7.4 Momentum Management',
      requirementId: 'ADCS-SRS-066',
      text: 'The ADCS software shall command reaction wheel momentum dumping via the magnetorquers whenever any wheel speed exceeds 80% of its rated maximum.',
    },
  ],
  'seed-eps-icd': [
    {
      page: 8,
      section: '§4.1 Primary Power Bus',
      requirementId: 'EPS-ICD-IF-003',
      text: 'The EPS shall provide a regulated 28 V ±1 V primary power bus to all platform subsystems.',
    },
    {
      page: 11,
      section: '§4.3 Secondary Buses',
      requirementId: 'EPS-ICD-IF-007',
      text: 'The EPS shall provide switched 5 V and 3.3 V secondary buses, each protected by a latching current limiter set to 2 A.',
    },
    {
      page: 19,
      section: '§5.2 Housekeeping Telemetry',
      requirementId: 'EPS-ICD-IF-015',
      text: 'The EPS shall report battery voltage, bus currents and panel temperatures to the on-board computer over the CAN bus at 1 Hz.',
    },
  ],
  'seed-comms-test': [
    {
      page: 6,
      section: '§2.1 Downlink Test Results',
      requirementId: 'COMMS-TR-004',
      text: 'The X-band downlink achieved a data rate of 50 Mbps with a measured bit error rate below 1e-7 at the minimum specified link margin.',
    },
  ],
};
