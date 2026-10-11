import { HotspotCorridor, Complaint } from '../types';
import { INITIAL_HOTSPOTS } from '../data/initialData';
import { storageService } from './storageService';

const HOTSPOTS_KEY = 'hotspots_corridors';

export const analyticsService = {
  getHotspots: (): HotspotCorridor[] => {
    return storageService.get<HotspotCorridor[]>(HOTSPOTS_KEY, INITIAL_HOTSPOTS);
  },

  calculateKPIs: (complaints: Complaint[]) => {
    const total = complaints.length;
    const active = complaints.filter(c => ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)).length;
    const p1Count = complaints.filter(c => c.priority === 'P1' && ['Submitted', 'Assigned', 'In Progress', 'Escalated'].includes(c.status)).length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const breached = complaints.filter(c => c.slaBreached === true).length;
    const resolutionDurations = complaints.flatMap(complaint => {
      if (!complaint.createdAt || !complaint.statusHistory || (complaint.status !== 'Resolved' && complaint.status !== 'Closed')) return [];
      const createdAt = Date.parse(complaint.createdAt);
      const resolvedAt = complaint.statusHistory
        .filter(entry => entry.status === 'Resolved' || entry.status === 'Closed')
        .map(entry => Date.parse(entry.changedAt))
        .filter(timestamp => Number.isFinite(timestamp) && timestamp >= createdAt)
        .sort((a, b) => a - b)[0];
      return Number.isFinite(createdAt) && resolvedAt !== undefined
        ? [(resolvedAt - createdAt) / 3600000]
        : [];
    });

    return {
      total,
      active,
      p1Count,
      resolved,
      breached,
      resolutionRatePct: total > 0 ? Math.round((resolved / total) * 100) : null,
      avgResolutionHours: resolutionDurations.length
        ? resolutionDurations.reduce((sum, duration) => sum + duration, 0) / resolutionDurations.length
        : null
    };
  }
};
