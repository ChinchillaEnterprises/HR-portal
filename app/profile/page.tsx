"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import AuthWrapper from "@/components/AuthWrapper";
import NeoLayout from "@/components/NeoLayout";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  Camera,
  Edit,
  Save,
  X,
  Shield,
  Check,
  Clock,
  Award,
  FileText,
  ChevronRight,
  Linkedin,
  Github,
  Twitter,
  Plus,
  Trash2,
  BookOpen,
  Target,
  Star,
  GraduationCap,
  Settings,
  Users,
  TrendingUp,
  ExternalLink,
  Zap,
} from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { useActivityLogger, ACTIVITY_TYPES } from "@/hooks/useActivityLogger";

const client = generateClient<Schema>();

function ProfilePage({ user }: { user: any }) {
  const { logActivity } = useActivityLogger();
  const [userProfile, setUserProfile] = useState<Schema["User"]["type"] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Array<Schema["OnboardingTask"]["type"]>>([]);
  const [documents, setDocuments] = useState<Array<Schema["Document"]["type"]>>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    department: "",
    position: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    twitterUrl: "",
    bio: "",
  });
  
  // Extended profile data
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [certifications, setCertifications] = useState<Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    expiryDate?: string;
  }>>([]);
  const [workExperience, setWorkExperience] = useState<Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>>([]);
  const [education, setEducation] = useState<Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    gpa?: string;
  }>>([]);
  const [careerGoals, setCareerGoals] = useState<Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: "pending" | "in_progress" | "completed";
  }>>([]);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    slackNotifications: true,
    mobileNotifications: false,
    weeklyReports: true,
    publicProfile: false,
    showEmail: true,
    showPhone: false,
  });

  useEffect(() => {
    fetchUserProfile();
    logActivity({
      action: ACTIVITY_TYPES.PAGE_VIEW,
      resource: "profile",
      details: { tab: activeTab }
    });
  }, []);

  useEffect(() => {
    if (activeTab !== "overview") {
      logActivity({
        action: ACTIVITY_TYPES.PAGE_VIEW,
        resource: "profile",
        details: { tab: activeTab }
      });
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const authUser = await getAuthenticatedUser();
      
      if (!authUser) return;
      
      // Get user profile
      const { data: users } = await client.models.User.list({
        filter: { email: { eq: authUser.email } }
      });
      
      if (users[0]) {
        setUserProfile(users[0]);
        setFormData({
          firstName: users[0].firstName || "",
          lastName: users[0].lastName || "",
          phoneNumber: users[0].phoneNumber || "",
          department: users[0].department || "",
          position: users[0].position || "",
          location: "",
          linkedinUrl: "",
          githubUrl: "",
          twitterUrl: "",
          bio: "",
        });
        
        // Load extended profile data from localStorage (in production, this would come from the database)
        const storedSkills = localStorage.getItem(`skills-${users[0].id}`);
        if (storedSkills) setSkills(JSON.parse(storedSkills));
        
        const storedCertifications = localStorage.getItem(`certifications-${users[0].id}`);
        if (storedCertifications) setCertifications(JSON.parse(storedCertifications));
        
        const storedWorkExperience = localStorage.getItem(`workExperience-${users[0].id}`);
        if (storedWorkExperience) setWorkExperience(JSON.parse(storedWorkExperience));
        
        const storedEducation = localStorage.getItem(`education-${users[0].id}`);
        if (storedEducation) setEducation(JSON.parse(storedEducation));
        
        const storedCareerGoals = localStorage.getItem(`careerGoals-${users[0].id}`);
        if (storedCareerGoals) setCareerGoals(JSON.parse(storedCareerGoals));
        
        const storedPreferences = localStorage.getItem(`preferences-${users[0].id}`);
        if (storedPreferences) setPreferences({ ...preferences, ...JSON.parse(storedPreferences) });
        
        // Fetch related data
        const [tasksResponse, docsResponse] = await Promise.all([
          client.models.OnboardingTask.list({
            filter: { userId: { eq: users[0].id } }
          }),
          client.models.Document.list({
            filter: { userId: { eq: users[0].id } }
          }),
        ]);
        
        setTasks(tasksResponse.data);
        setDocuments(docsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    try {
      setSaving(true);
      await client.models.User.update({
        id: userProfile.id,
        ...formData,
      });
      
      setUserProfile({ ...userProfile, ...formData });
      setIsEditing(false);
      
      logActivity({
        action: ACTIVITY_TYPES.USER_UPDATE,
        resource: "profile",
        resourceId: userProfile.id,
        details: { fields: Object.keys(formData) }
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      phoneNumber: userProfile?.phoneNumber || "",
      department: userProfile?.department || "",
      position: userProfile?.position || "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      twitterUrl: "",
      bio: "",
    });
    setIsEditing(false);
  };

  // Helper functions for extended profile features
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      localStorage.setItem(`skills-${userProfile?.id}`, JSON.stringify(updatedSkills));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    localStorage.setItem(`skills-${userProfile?.id}`, JSON.stringify(updatedSkills));
  };

  const addCertification = () => {
    const newCert = {
      id: Date.now().toString(),
      name: "",
      issuer: "",
      date: "",
    };
    setCertifications([...certifications, newCert]);
  };

  const updateCertification = (id: string, field: string, value: string) => {
    const updated = certifications.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    );
    setCertifications(updated);
    localStorage.setItem(`certifications-${userProfile?.id}`, JSON.stringify(updated));
  };

  const removeCertification = (id: string) => {
    const updated = certifications.filter(cert => cert.id !== id);
    setCertifications(updated);
    localStorage.setItem(`certifications-${userProfile?.id}`, JSON.stringify(updated));
  };

  const addWorkExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      current: false,
      description: "",
    };
    setWorkExperience([...workExperience, newExp]);
  };

  const updateWorkExperience = (id: string, field: string, value: any) => {
    const updated = workExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    setWorkExperience(updated);
    localStorage.setItem(`workExperience-${userProfile?.id}`, JSON.stringify(updated));
  };

  const removeWorkExperience = (id: string) => {
    const updated = workExperience.filter(exp => exp.id !== id);
    setWorkExperience(updated);
    localStorage.setItem(`workExperience-${userProfile?.id}`, JSON.stringify(updated));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      current: false,
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: string, value: any) => {
    const updated = education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    setEducation(updated);
    localStorage.setItem(`education-${userProfile?.id}`, JSON.stringify(updated));
  };

  const removeEducation = (id: string) => {
    const updated = education.filter(edu => edu.id !== id);
    setEducation(updated);
    localStorage.setItem(`education-${userProfile?.id}`, JSON.stringify(updated));
  };

  const addCareerGoal = () => {
    const newGoal = {
      id: Date.now().toString(),
      title: "",
      description: "",
      targetDate: "",
      status: "pending" as const,
    };
    setCareerGoals([...careerGoals, newGoal]);
  };

  const updateCareerGoal = (id: string, field: string, value: any) => {
    const updated = careerGoals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    );
    setCareerGoals(updated);
    localStorage.setItem(`careerGoals-${userProfile?.id}`, JSON.stringify(updated));
  };

  const removeCareerGoal = (id: string) => {
    const updated = careerGoals.filter(goal => goal.id !== id);
    setCareerGoals(updated);
    localStorage.setItem(`careerGoals-${userProfile?.id}`, JSON.stringify(updated));
  };

  const updatePreferences = (field: string, value: boolean) => {
    const updated = { ...preferences, [field]: value };
    setPreferences(updated);
    localStorage.setItem(`preferences-${userProfile?.id}`, JSON.stringify(updated));
  };

  const getProfileCompleteness = () => {
    let completed = 0;
    let total = 14;
    
    if (userProfile?.firstName) completed++;
    if (userProfile?.lastName) completed++;
    if (userProfile?.phoneNumber) completed++;
    if (userProfile?.department) completed++;
    if (userProfile?.position) completed++;
    // Skip location, bio, and social media links as they don't exist in the User model
    if (skills.length > 0) completed++;
    if (certifications.length > 0) completed++;
    if (workExperience.length > 0) completed++;
    if (education.length > 0) completed++;
    if (careerGoals.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "mentor":
        return <Award className="w-4 h-4" />;
      case "team_lead":
        return <Award className="w-4 h-4" />;
      case "intern":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "mentor":
        return "bg-blue-100 text-blue-700";
      case "team_lead":
        return "bg-purple-100 text-purple-700";
      case "intern":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
  };

  const onboardingProgress = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  const profileCompleteness = getProfileCompleteness();

  return (
    <NeoLayout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="relative h-32 sm:h-48 bg-gradient-to-r from-gray-900 to-gray-700 rounded-t-lg">
            <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold border-4 border-white">
                  {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                  ) : (
                    `${userProfile.firstName} ${userProfile.lastName}`
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Position"
                      className="px-2 py-1 border border-gray-300 rounded w-full max-w-md"
                    />
                  ) : (
                    userProfile.position || userProfile.role
                  )}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(userProfile.role || undefined)}`}>
                    {getRoleIcon(userProfile.role || undefined)}
                    <span className="ml-1 capitalize">{userProfile.role?.replace("_", " ")}</span>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(userProfile.status || undefined)}`}>
                    {userProfile.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end space-y-3 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">Profile Completeness</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-full sm:w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${profileCompleteness}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{profileCompleteness}%</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6" aria-label="Tabs">
              {[
                { id: "overview", name: "Overview", icon: User },
                { id: "skills", name: "Skills & Certs", icon: Zap },
                { id: "experience", name: "Experience", icon: Briefcase },
                { id: "education", name: "Education", icon: GraduationCap },
                { id: "goals", name: "Goals", icon: Target },
                { id: "preferences", name: "Preferences", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm flex items-center whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{userProfile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder="Add phone number"
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{userProfile.phoneNumber || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="Add department"
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-900">{userProfile.department || "Not assigned"}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value=""
                          onChange={() => {}}
                          placeholder="Location not available in current schema"
                          disabled
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <p className="text-gray-400">Location not available in current schema</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="text-gray-900">
                        {userProfile.startDate ? new Date(userProfile.startDate).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">LinkedIn</p>
                      {isEditing ? (
                        <input
                          type="url"
                          value=""
                          onChange={() => {}}
                          placeholder="LinkedIn not available in current schema"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          disabled
                        />
                      ) : (
                        <p className="text-gray-400">LinkedIn not available in current schema</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Github className="w-5 h-5 text-gray-900" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">GitHub</p>
                      {isEditing ? (
                        <input
                          type="url"
                          value=""
                          onChange={() => {}}
                          placeholder="GitHub not available in current schema"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          disabled
                        />
                      ) : (
                        <p className="text-gray-400">GitHub not available in current schema</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Twitter</p>
                      {isEditing ? (
                        <input
                          type="url"
                          value=""
                          onChange={() => {}}
                          placeholder="Twitter not available in current schema"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          disabled
                        />
                      ) : (
                        <p className="text-gray-400">Twitter not available in current schema</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                {isEditing ? (
                  <textarea
                    value=""
                    onChange={() => {}}
                    placeholder="Bio not available in current schema"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    disabled
                  />
                ) : (
                  <p className="text-gray-400 italic">Bio not available in current schema</p>
                )}
              </div>

              {/* Onboarding Progress */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">{onboardingProgress}%</span>
                  <a href="/onboarding" className="text-black hover:text-gray-700 text-sm font-medium flex items-center">
                    View Tasks <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-black h-3 rounded-full transition-all duration-300"
                      style={{ width: `${onboardingProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{taskStats.pending}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>
              </div>

              {/* Recent Documents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Documents</h3>
                  <a href="/documents" className="text-black hover:text-gray-700 text-sm font-medium flex items-center">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                        </div>
                        {doc.signatureStatus && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.signatureStatus === "signed" ? "bg-green-100 text-green-700" :
                            doc.signatureStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {doc.signatureStatus}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-8">
              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                  <button
                    onClick={addCertification}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Certification
                  </button>
                </div>
                
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                          placeholder="Certification name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                          placeholder="Issuing organization"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                          type="date"
                          value={cert.date}
                          onChange={(e) => updateCertification(cert.id, "date", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={cert.credentialId || ""}
                          onChange={(e) => updateCertification(cert.id, "credentialId", e.target.value)}
                          placeholder="Credential ID (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => removeCertification(cert.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {certifications.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No certifications added yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                <button
                  onClick={addWorkExperience}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Experience
                </button>
              </div>
              
              <div className="space-y-6">
                {workExperience.map((exp) => (
                  <div key={exp.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                        placeholder="Company name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                        placeholder="Position title"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      {!exp.current && (
                        <input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateWorkExperience(exp.id, "current", e.target.checked)}
                          className="mr-2"
                        />
                        Currently working here
                      </label>
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(exp.id, "description", e.target.value)}
                      placeholder="Describe your role and achievements..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => removeWorkExperience(exp.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {workExperience.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No work experience added yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                <button
                  onClick={addEducation}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Education
                </button>
              </div>
              
              <div className="space-y-6">
                {education.map((edu) => (
                  <div key={edu.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                        placeholder="Institution name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        placeholder="Degree (e.g., Bachelor's, Master's)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                        placeholder="Field of study"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={edu.gpa || ""}
                        onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                        placeholder="GPA (optional)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      {!edu.current && (
                        <input
                          type="date"
                          value={edu.endDate || ""}
                          onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={edu.current}
                          onChange={(e) => updateEducation(edu.id, "current", e.target.checked)}
                          className="mr-2"
                        />
                        Currently studying here
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {education.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No education added yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Career Goals</h3>
                <button
                  onClick={addCareerGoal}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Goal
                </button>
              </div>
              
              <div className="space-y-6">
                {careerGoals.map((goal) => (
                  <div key={goal.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={goal.title}
                        onChange={(e) => updateCareerGoal(goal.id, "title", e.target.value)}
                        placeholder="Goal title"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={goal.targetDate}
                        onChange={(e) => updateCareerGoal(goal.id, "targetDate", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div className="mb-4">
                      <select
                        value={goal.status}
                        onChange={(e) => updateCareerGoal(goal.id, "status", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <textarea
                      value={goal.description}
                      onChange={(e) => updateCareerGoal(goal.id, "description", e.target.value)}
                      placeholder="Describe your goal and how you plan to achieve it..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => removeCareerGoal(goal.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {careerGoals.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No career goals added yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-8">
              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => updatePreferences("emailNotifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Slack Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via Slack</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.slackNotifications}
                        onChange={(e) => updatePreferences("slackNotifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-500">Receive weekly progress reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.weeklyReports}
                        onChange={(e) => updatePreferences("weeklyReports", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Public Profile</p>
                      <p className="text-sm text-gray-500">Make your profile visible to other team members</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.publicProfile}
                        onChange={(e) => updatePreferences("publicProfile", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Email</p>
                      <p className="text-sm text-gray-500">Display email address on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showEmail}
                        onChange={(e) => updatePreferences("showEmail", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Phone</p>
                      <p className="text-sm text-gray-500">Display phone number on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showPhone}
                        onChange={(e) => updatePreferences("showPhone", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NeoLayout>
  );
}

export default function ProfilePageWrapper() {
  return (
    <AuthWrapper>
      {({ user }) => <ProfilePage user={user} />}
    </AuthWrapper>
  );
}
