/**
 * The Rawgrowth team faces shown in the Welcome flow. Hardcoded for v1 — pulls
 * from this list so the client sees real people, not anonymous boxes.
 * Initials are used as avatars (no photos needed); accent colours rotate.
 */
export type TeamMember = {
  initials: string;
  name: string;
  role: string;
};

export const RAWGROWTH_TEAM: TeamMember[] = [
  { initials: "CW", name: "Chris West", role: "CEO" },
  { initials: "DP", name: "Dilan Patel", role: "COO — your strategic lead" },
  { initials: "PV", name: "Pedro V.", role: "CTO — installs your department" },
  { initials: "RK", name: "Rami K.", role: "Senior engineer" },
];
