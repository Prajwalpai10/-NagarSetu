import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { complaintService } from '../../services/complaintService';
import { apiClient } from '../../services/apiClient';
import { isConfirmedLocation } from '../../services/locationService';
import { ComplaintLocationPicker } from './ComplaintLocationPicker';
import 'leaflet/dist/leaflet.css';

const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export const ReportIssueView: React.FC = () => {
  const {
    addComplaint,
    setCurrentView,
    showToast,
    selectedCategoryDraft,
    setSelectedTicketId,
  } = useApp();

  const [category, setCategory] = useState<string>(selectedCategoryDraft || 'Roads & Potholes');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>(() => complaintService.getDraft()?.address ?? '');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>();
  const [locationSource, setLocationSource] = useState<'gps' | 'map' | 'manual'>('manual');
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Sync category if passed from landing page or load draft if exists
  useEffect(() => {
    if (selectedCategoryDraft) {
      setCategory(selectedCategoryDraft);
    } else {
      const savedDraft = complaintService.getDraft();
      if (savedDraft) {
        if (savedDraft.category) setCategory(savedDraft.category);
        if (savedDraft.description) setDescription(savedDraft.description);
        if (savedDraft.photos && savedDraft.photos.length > 0) setPhotos(savedDraft.photos);
      }
    }
  }, [selectedCategoryDraft]);

  const categories = [
    { name: 'Roads & Potholes', icon: 'traffic' },
    { name: 'Garbage & Waste', icon: 'delete_sweep' },
    { name: 'Streetlights', icon: 'lightbulb' },
    { name: 'Water Supply & Leakage', icon: 'water_drop' },
    { name: 'Drainage & Flooding', icon: 'waves' },
    { name: 'Traffic & Signals', icon: 'traffic_jam' },
    { name: 'Public Infrastructure', icon: 'apartment' },
    { name: 'Other Issue', icon: 'more_horiz' },
  ];

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (selectedFiles.length === 0) return;
    if (photos.length + selectedFiles.length > MAX_PHOTO_COUNT) {
      setPhotoError(`You can attach up to ${MAX_PHOTO_COUNT} photos per complaint.`);
      return;
    }

    setPhotoError('');
    setIsUploading(true);
    const failures: string[] = [];
    let uploadedCount = 0;

    try {
      for (const file of selectedFiles) {
        if (file.size > MAX_PHOTO_SIZE) {
          failures.push(`${file.name}: photo must be 5 MB or smaller.`);
          continue;
        }
        const result = await apiClient.uploadComplaintPhoto(file);
        if (result.error || !result.data?.url) {
          failures.push(`${file.name}: ${result.error ?? 'The server returned an invalid upload response.'}`);
          continue;
        }
        const photoUrl = result.data.url;
        setPhotos(current => [...current, photoUrl]);
        uploadedCount++;
      }
    } catch {
      failures.push('A photo could not be uploaded because of a network error.');
    } finally {
      setIsUploading(false);
    }

    setPhotoError(failures.join(' '));
    if (uploadedCount > 0) {
      showToast('Photo Attached', `${uploadedCount} photo${uploadedCount === 1 ? '' : 's'} uploaded.`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoError('');
    showToast('Photo Removed', 'Attachment was removed.');
  };

  const handleSaveDraft = () => {
    complaintService.saveDraft({
      category,
      description,
      address,
      gpsCoords,
      locationSource,
      photos,
      lastSavedAt: new Date().toLocaleTimeString(),
    });
    showToast('Draft Saved', 'You can resume this report anytime.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Description Needed', 'Please briefly describe the issue.');
      return;
    }
    if (!isConfirmedLocation(address, gpsCoords, locationConfirmed)) {
      showToast('Location Needs Confirmation', 'Select a suggested address or map point, then confirm that it marks where the issue occurred.', 'error', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newComplaint = await addComplaint({
        category,
        title: description.slice(0, 50) + (description.length > 50 ? '...' : ''),
        description,
        location: address.trim(),
        coordinates: gpsCoords,
        locationSource,
        photos,
        priority: 'P2',
        department: category.includes('Road')
          ? 'Roads & Infrastructure (BBMP)'
          : category.includes('Water')
          ? 'BWSSB Water & Sewerage'
          : category.includes('Light')
          ? 'Energy & Streetlighting'
          : 'Solid Waste Management',
      });
      complaintService.clearDraft();
      setSelectedTicketId(newComplaint.id);
      showToast('Complaint Submitted', `Your complaint #${newComplaint.id} has been registered.`);
      setCurrentView('track_complaint', { id: newComplaint.id });
    } catch {
      // The shared submit handler already reports the API failure.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setCurrentView('citizen_home')}
            className="text-xs font-semibold text-on-surface-variant hover:text-secondary flex items-center gap-1 mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Report a Civic Issue</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Fill in the details below. Our field operations team will inspect and resolve it.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveDraft}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all cursor-pointer"
        >
          Save Draft
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
        {/* 1. Category Field */}
        <div>
          <label className="block text-sm font-bold text-on-surface mb-2">
            1. Issue Category <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-secondary bg-secondary-container/30 text-secondary font-bold shadow-xs'
                      : 'border-surface-container hover:border-outline-variant bg-surface text-on-surface'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {cat.icon}
                  </span>
                  <span className="text-xs leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Description Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="complaint-desc" className="text-sm font-bold text-on-surface">
              2. Describe the Problem <span className="text-error">*</span>
            </label>
            <span className="text-xs text-on-surface-variant">Be as specific as possible</span>
          </div>
          <textarea
            id="complaint-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Large pothole on the left lane near the bus stop causing traffic slowdown and safety risk for two-wheelers"
            className="w-full p-4 rounded-xl border border-surface-container bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none text-sm transition-all"
            required
          />
        </div>

        {/* 3. Photo Upload (Clearly Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-on-surface">
              3. Add Photo <span className="text-xs font-normal text-on-surface-variant">(Optional)</span>
            </label>
            <span className="text-xs text-on-surface-variant">Photos help field crews locate and verify the repair</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {photos.map((url, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-surface-container group">
                <img src={url} alt="Attached issue" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs hover:bg-error transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}

            <input
              id="complaint-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploading || photos.length >= MAX_PHOTO_COUNT}
              onChange={handlePhotoSelection}
              className="sr-only"
              aria-label="Choose complaint photos"
            />
            <label
              htmlFor="complaint-photo-input"
              aria-disabled={isUploading || photos.length >= MAX_PHOTO_COUNT}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-container hover:border-secondary bg-surface flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-secondary transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
              <span className="text-[11px] font-semibold">{isUploading ? 'Uploading…' : '+ Add Photo'}</span>
            </label>
          </div>
          {photoError && <p role="alert" className="mt-2 text-sm text-error">{photoError}</p>}
          <p className="mt-2 text-xs text-on-surface-variant">
            JPEG, PNG, or WebP · 5 MB max per photo · up to {MAX_PHOTO_COUNT} photos
          </p>
        </div>

        <ComplaintLocationPicker
          initialQuery={address}
          onChange={location => {
            setAddress(location.address);
            setGpsCoords(location.gpsCoords);
            setLocationSource(location.locationSource);
            setLocationConfirmed(location.confirmed);
          }}
        />

        {/* Submit Actions */}
        <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('citizen_home')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-surface-container text-on-surface-variant hover:bg-surface-container text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-container text-on-surface font-bold text-sm hover:brightness-95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            <span>Submit Complaint</span>
          </button>
        </div>
      </form>
    </div>
  );
};
