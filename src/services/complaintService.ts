import { Complaint } from '../types';
import { INITIAL_COMPLAINTS } from '../data/initialData';
import { storageService } from './storageService';

const COMPLAINTS_KEY = 'complaints';
const DRAFT_KEY = 'report_draft';

export interface ReportDraft {
  category: string;
  description: string;
  address: string;
  gpsCoords?: { lat: number; lng: number };
  locationSource?: 'gps' | 'map' | 'manual';
  photos: string[];
  lastSavedAt: string;
}

export const complaintService = {
  getStoredComplaints: (): Complaint[] | null => {
    const stored = storageService.get<Complaint[] | null>(COMPLAINTS_KEY, null);
    return Array.isArray(stored) ? stored : null;
  },

  getAll: (): Complaint[] => {
    return storageService.get<Complaint[]>(COMPLAINTS_KEY, INITIAL_COMPLAINTS);
  },

  saveAll: (complaints: Complaint[]): void => {
    storageService.set(COMPLAINTS_KEY, complaints);
  },

  getById: (id: string): Complaint | undefined => {
    const list = complaintService.getAll();
    return list.find(c => c.id.toLowerCase() === id.toLowerCase());
  },

  create: (data: Partial<Complaint>): Complaint => {
    const list = complaintService.getAll();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `CMP-2026-0${randomNum}`;

    const newComplaint: Complaint = {
      id: newId,
      category: data.category || 'Roads & Potholes',
      subCategory: data.subCategory || 'Surface Damage',
      title: data.title || (data.description ? data.description.slice(0, 50) : 'Civic Incident Report'),
      description: data.description || 'Citizen report registered via NagarSetu portal.',
      location: data.location || '80ft Road Junction, Indiranagar Ward 12',
      ward: data.ward || 'Ward 12 Indiranagar',
      zone: data.zone || 'East Zone',
      coordinates: data.coordinates || { lat: 12.9716, lng: 77.6412 },
      priority: data.priority || 'P2',
      status: data.status || 'Submitted',
      reportedDate: 'Just now',
      timeAgo: 'Just now',
      slaDeadline: data.priority === 'P1' ? '4 Hours Statutory' : data.priority === 'P2' ? '12 Hours Statutory' : '48 Hours Statutory',
      slaRemaining: data.priority === 'P1' ? '03h 59m' : '11h 59m',
      assignedCrew: data.assignedCrew || 'Rapid Response Crew #04',
      assignedOfficer: data.assignedOfficer || 'Insp. R. Verma',
      photos: data.photos ?? [],
      citizenName: data.citizenName || 'Priya S.',
      citizenPhone: data.citizenPhone || '+91 98452 88210',
      verifiedKYC: true,
      upvotes: 1,
      aiConfidence: data.aiConfidence || 94.5,
      department: data.department || 'Roads & Infrastructure (BBMP)',
      isDuplicateMerged: data.isDuplicateMerged || false,
      mergedTicketIds: data.mergedTicketIds || [],
      lifecycleStage: data.lifecycleStage || 1,
    };

    const updated = [newComplaint, ...list];
    complaintService.saveAll(updated);
    return newComplaint;
  },

  updateStatus: (id: string, status: Complaint['status'], extra?: Partial<Complaint>): Complaint | undefined => {
    const list = complaintService.getAll();
    let updatedComplaint: Complaint | undefined;

    const updated = list.map(c => {
      if (c.id === id) {
        updatedComplaint = {
          ...c,
          status,
          ...extra,
        };
        return updatedComplaint;
      }
      return c;
    });

    complaintService.saveAll(updated);
    return updatedComplaint;
  },

  upvote: (id: string): number => {
    const list = complaintService.getAll();
    let newCount = 0;

    const updated = list.map(c => {
      if (c.id === id) {
        newCount = (c.upvotes || 0) + 1;
        return { ...c, upvotes: newCount };
      }
      return c;
    });

    complaintService.saveAll(updated);
    return newCount;
  },

  appendEvidence: (id: string, photoUrl?: string, note?: string): Complaint | undefined => {
    const list = complaintService.getAll();
    let updatedComplaint: Complaint | undefined;

    const updated = list.map(c => {
      if (c.id === id) {
        const photos = photoUrl ? [...c.photos, photoUrl] : c.photos;
        const description = note ? `${c.description}\n\n[Citizen Supplemental Note]: ${note}` : c.description;
        updatedComplaint = { ...c, photos, description };
        return updatedComplaint;
      }
      return c;
    });

    complaintService.saveAll(updated);
    return updatedComplaint;
  },

  bulkReassign: (targetDepartment: string, targetOfficer: string): number => {
    const list = complaintService.getAll();
    let count = 0;
    const updated = list.map(c => {
      if (c.status === 'Submitted' || c.status === 'In Progress') {
        count++;
        return { ...c, department: targetDepartment, assignedOfficer: targetOfficer };
      }
      return c;
    });
    complaintService.saveAll(updated);
    return count;
  },

  // Draft Management
  saveDraft: (draft: ReportDraft): void => {
    storageService.set(DRAFT_KEY, draft);
  },

  getDraft: (): ReportDraft | null => {
    return storageService.get<ReportDraft | null>(DRAFT_KEY, null);
  },

  clearDraft: (): void => {
    storageService.remove(DRAFT_KEY);
  }
};
