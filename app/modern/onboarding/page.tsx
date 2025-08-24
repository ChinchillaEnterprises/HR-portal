"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Calendar, FileText, Upload, User, Save, Mail } from "lucide-react";
import { emailTemplates } from "@/lib/emailTemplates";
import DatePickerModal from "@/components/DatePickerModal";
import OnboardingFormModal from "@/components/OnboardingFormModal";

const client = generateClient<Schema>();

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedDate?: string;
  category: 'documentation' | 'setup' | 'training' | 'meeting';
}

export default function OnboardingTracker() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);

  // Default onboarding checklist
  const defaultChecklist: OnboardingStep[] = [
    {
      id: '1',
      title: 'Sign Offer Letter',
      description: 'Review and sign the employment offer letter',
      status: 'pending',
      category: 'documentation',
    },
    {
      id: '2',
      title: 'Complete NDA',
      description: 'Sign non-disclosure agreement',
      status: 'pending',
      category: 'documentation',
    },
    {
      id: '3',
      title: 'Submit Tax Forms',
      description: 'W-4 and state tax withholding forms',
      status: 'pending',
      category: 'documentation',
    },
    {
      id: '4',
      title: 'Set Up Workstation',
      description: 'Laptop, accounts, and development environment',
      status: 'pending',
      category: 'setup',
    },
    {
      id: '5',
      title: 'Complete HR Training',
      description: 'Company policies and procedures',
      status: 'pending',
      category: 'training',
    },
    {
      id: '6',
      title: 'Meet Your Team',
      description: 'Introduction meeting with immediate team',
      status: 'pending',
      category: 'meeting',
    },
    {
      id: '7',
      title: 'Meet Your Mentor',
      description: '1:1 with assigned mentor',
      status: 'pending',
      category: 'meeting',
    },
    {
      id: '8',
      title: 'Review Employee Handbook',
      description: 'Read through company policies and values',
      status: 'pending',
      category: 'documentation',
    },
  ];

  const [checklist, setChecklist] = useState<OnboardingStep[]>(defaultChecklist);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await client.models.User.list();
      const onboardingUsers = response.data.filter(u => 
        u.role === 'intern' || u.status === 'pending'
      );
      setUsers(onboardingUsers);
      if (onboardingUsers.length > 0) {
        setSelectedUser(onboardingUsers[0].id);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = (stepId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    setChecklist(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    ));
  };

  const assignDates = () => {
    const selectedUserData = users.find(u => u.id === selectedUser);
    if (!selectedUserData || !selectedUserData.startDate) {
      alert("Please ensure the user has a start date set");
      return;
    }

    const startDate = new Date(selectedUserData.startDate);
    const updatedChecklist = checklist.map((step, index) => {
      const daysBeforeStart = Math.max(7 - index * 2, 1); // Stagger tasks
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() - daysBeforeStart);
      
      return {
        ...step,
        assignedDate: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
      };
    });

    setChecklist(updatedChecklist);
    
    // Send onboarding checklist email
    sendOnboardingEmail(selectedUserData);
  };

  const sendOnboardingEmail = async (userData: any) => {
    const template = emailTemplates.onboardingChecklist({
      firstName: userData.firstName,
      lastName: userData.lastName,
      startDate: new Date(userData.startDate).toLocaleDateString(),
    });

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userData.email,
          subject: template.subject,
          body: template.body,
        }),
      });

      if (response.ok) {
        alert("Onboarding checklist email sent successfully!");
      } else {
        alert("Failed to send email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please check your Gmail integration.");
    }
  };

  const updateStepDate = (stepId: string, dueDate: string) => {
    setChecklist(prev => prev.map(step =>
      step.id === stepId ? { ...step, dueDate, assignedDate: new Date().toISOString() } : step
    ));
  };

  const handleFormSubmit = (data: any) => {
    if (selectedStep) {
      // Update step status to completed
      updateStepStatus(selectedStep.id, 'completed');
      
      // Log the submission
      console.log('Form submitted for step:', selectedStep.title, data);
      
      // Here you would typically save the form data to your backend
      // For now, we'll just update the UI
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'documentation':
        return 'bg-blue-100 text-blue-700';
      case 'setup':
        return 'bg-purple-100 text-purple-700';
      case 'training':
        return 'bg-green-100 text-green-700';
      case 'meeting':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedUserData = users.find(u => u.id === selectedUser);
  const completedSteps = checklist.filter(s => s.status === 'completed').length;
  const progressPercentage = Math.round((completedSteps / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Tracker</h1>
        <p className="text-gray-600 mt-1">Checklists with status, assigned dates, and file uploads</p>
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Employee</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={assignDates}
              disabled={!selectedUser}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Assign Dates
            </button>
            <button 
              onClick={() => sendOnboardingEmail(users.find(u => u.id === selectedUser))}
              disabled={!selectedUser}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
        
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select an employee...</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} - {user.email}
            </option>
          ))}
        </select>

        {selectedUserData && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{selectedUserData.position || selectedUserData.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                Start Date: {selectedUserData.startDate ? new Date(selectedUserData.startDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Progress Overview</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900 h-2 rounded-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedSteps}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {checklist.filter(s => s.status === 'in_progress').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {checklist.filter(s => s.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Onboarding Checklist</h2>
        <div className="space-y-3">
          {checklist.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <button
                onClick={() => {
                  if (step.status === 'pending' || step.status === 'in_progress') {
                    setSelectedStep(step);
                    setShowFormModal(true);
                  } else {
                    // Allow toggling back to pending if completed
                    updateStepStatus(step.id, 'pending');
                  }
                }}
                data-testid={`task-status-${step.id}`}
                className="flex-shrink-0"
              >
                {getStatusIcon(step.status)}
              </button>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span data-testid={`category-${step.id}`} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(step.category)}`}>
                    {step.category}
                  </span>
                  {step.dueDate && (
                    <span className="text-xs text-gray-500">
                      Due: {new Date(step.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step.category === 'documentation' && (
                  <button data-testid={`upload-${step.id}`} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedStep(step);
                    setShowDateModal(true);
                  }}
                  data-testid={`calendar-${step.id}`}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* File Uploads Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">File Uploads</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Drag and drop files here or click to browse</p>
          <p className="text-sm text-gray-500">Supported formats: PDF, DOC, DOCX</p>
          <button className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            Select Files
          </button>
        </div>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setSelectedStep(null);
        }}
        onSave={(date) => {
          if (selectedStep) {
            updateStepDate(selectedStep.id, date);
          }
        }}
        title={`Set Due Date for: ${selectedStep?.title || ''}`}
        currentDate={selectedStep?.dueDate}
      />

      {/* Onboarding Form Modal */}
      <OnboardingFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedStep(null);
        }}
        onSubmit={handleFormSubmit}
        step={selectedStep}
      />
    </div>
  );
}