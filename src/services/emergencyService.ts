import { Complaint } from '../types';
import { complaintService } from './complaintService';

export interface EmergencyDispatchPayload {
  hazardType: string;
  details: string;
  location: string;
  ward: string;
  coordinates?: { lat: number; lng: number };
  citizenPhone: string;
}

export const emergencyService = {
  getHotlines: () => [
    { label: 'National Emergency', num: '112', icon: 'emergency', description: 'All-India emergency responder' },
    { label: 'Medical / Trauma', num: '108', icon: 'ambulance', description: 'Emergency ambulance dispatch' },
    { label: 'Fire & Rescue', num: '101', icon: 'local_fire_department', description: 'Fire hazard & building rescue' },
    { label: 'City Police', num: '100', icon: 'local_police', description: 'Immediate law enforcement' },
    { label: 'Municipal Control', num: '1913', icon: 'account_balance', description: 'BBMP Disaster Command Desk' },
  ],

  dispatchEmergencyIncident: (payload: EmergencyDispatchPayload): Complaint => {
    return complaintService.create({
      category: payload.hazardType,
      subCategory: `${payload.hazardType} Critical Emergency`,
      title: `EMERGENCY ALERT: ${payload.hazardType} at ${payload.location}`,
      description: payload.details,
      location: payload.location,
      ward: payload.ward,
      zone: 'East Zone',
      coordinates: payload.coordinates,
      priority: 'P1',
      status: 'In Progress',
      department: 'Joint Emergency Disaster Command',
      assignedCrew: 'Rapid Tactical Emergency Rig #01',
      assignedOfficer: 'Zonal QRF Commander',
      citizenPhone: payload.citizenPhone,
      slaDeadline: '15 Minutes Statutory QRF Alert',
      slaRemaining: '00h 14m',
      lifecycleStage: 4,
    });
  }
};
