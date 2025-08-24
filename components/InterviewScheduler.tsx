"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Video,
  Phone,
  User,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { CalendarService } from "@/lib/calendarService";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

type Applicant = Schema["Applicant"]["type"];

interface InterviewSchedulerProps {
  applicant: Applicant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function InterviewScheduler({
  applicant,
  isOpen,
  onClose,
  onSuccess,
}: InterviewSchedulerProps) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    interviewers: [] as string[],
    location: "",
    notes: "",
    type: "in_person" as 'phone' | 'video' | 'in_person',
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Time Selection, 3: Review

  useEffect(() => {
    if (applicant && isOpen) {
      setFormData(prev => ({
        ...prev,
        title: `Interview - ${applicant.fullName}`,
      }));
    }
  }, [applicant, isOpen]);

  useEffect(() => {
    if (formData.date && formData.interviewers.length > 0) {
      checkAvailability();
    }
  }, [formData.date, formData.interviewers]);

  const checkAvailability = async () => {
    try {
      const selectedDate = new Date(formData.date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(9, 0, 0, 0); // 9 AM
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(17, 0, 0, 0); // 5 PM

      // Generate hourly slots
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        const start = new Date(selectedDate);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(hour + 1, 0, 0, 0);

        // Check for conflicts
        const conflictCheck = await CalendarService.checkConflicts(
          formData.interviewers,
          start.toISOString(),
          end.toISOString()
        );

        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          available: !conflictCheck.hasConflicts,
        });
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setFormData(prev => ({
        ...prev,
        startTime: slot.start,
        endTime: slot.end,
      }));
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!applicant || !formData.date || !formData.startTime || !formData.endTime) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(formData.endTime);

      const result = await CalendarService.scheduleInterview(applicant.id, {
        title: formData.title || `Interview - ${applicant.fullName}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        interviewers: formData.interviewers,
        location: formData.location,
        notes: formData.notes,
        type: formData.type,
      });

      if (result.success) {
        onSuccess?.(
          );
        onClose();
        resetForm();
      } else {
        setError(result.error || "Failed to schedule interview");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      interviewers: [],
      location: "",
      notes: "",
      type: "in_person",
    });
    setStep(1);
    setError("");
    setConflicts([]);
    setAvailableSlots([]);
  };

  const formatTimeSlot = (start: string) => {
    return new Date(start).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'in_person':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (!isOpen || !applicant) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-10 bottom-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-lg shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Interview</h2>
            <p className="text-sm text-gray-600 mt-1">{applicant.fullName} - {applicant.position}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-12 h-1 mx-2
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Time Selection</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Interview - John Doe"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'in_person', label: 'In Person', icon: User },
                    { value: 'video', label: 'Video Call', icon: Video },
                    { value: 'phone', label: 'Phone', icon: Phone },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          formData.type === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewers *
                </label>
                <input
                  type="text"
                  placeholder="Enter interviewer emails (comma separated)"
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, interviewers: emails }));
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={formData.type === 'video' ? 'Zoom/Teams link' : formData.type === 'phone' ? 'Phone number' : 'Office location'}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or interview agenda..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">
                  Available Time Slots for {new Date(formData.date).toLocaleDateString()}
                </h3>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Loading available time slots...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={!slot.available}
                        className={`p-3 border-2 rounded-lg text-center transition-colors ${
                          slot.available
                            ? 'border-gray-200 hover:border-blue-600 hover:bg-blue-50'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">
                          {formatTimeSlot(slot.start)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.available ? 'Available' : 'Conflict'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Review Interview Details</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{formData.title}</p>
                      <p className="text-sm text-gray-600">{applicant.fullName} - {applicant.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(formData.date).toLocaleDateString()} • {' '}
                        {formatTimeSlot(formData.startTime)} - {formatTimeSlot(formData.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getTypeIcon(formData.type)}
                    <div>
                      <p className="text-sm text-gray-900 capitalize">{formData.type.replace('_', ' ')}</p>
                      {formData.location && (
                        <p className="text-xs text-gray-600">{formData.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">
                        Interviewers ({formData.interviewers.length})
                      </p>
                      <p className="text-xs text-gray-600">
                        {formData.interviewers.join(', ')}
                      </p>
                    </div>
                  </div>

                  {formData.notes && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Notes</p>
                        <p className="text-xs text-gray-600">{formData.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!formData.date || formData.interviewers.length === 0)) ||
                  (step === 2 && (!formData.startTime || !formData.endTime))
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Interview'
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}