"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Search,
  X,
  Users,
  FileText,
  Mail,
  ClipboardList,
  Briefcase,
  ChevronRight,
  Clock,
  Calendar,
  Tag,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

const client = generateClient<Schema>();

interface SearchResult {
  id: string;
  type: "user" | "document" | "communication" | "task" | "applicant" | "template";
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchLower = searchTerm.toLowerCase();
        const allResults: SearchResult[] = [];

        // Search Users
        const { data: users } = await client.models.User.list();
        const userResults = users
          .filter(user => 
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.position?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
          )
          .map(user => ({
            id: user.id,
            type: "user" as const,
            title: `${user.firstName} ${user.lastName}`,
            subtitle: user.email,
            description: `${user.position || user.role} ${user.department ? `• ${user.department}` : ""}`,
            url: `/profile`,
            metadata: { role: user.role, status: user.status },
          }));
        allResults.push(...userResults.slice(0, 3));

        // Search Documents
        const { data: documents } = await client.models.Document.list();
        const docResults = documents
          .filter(doc =>
            doc.name?.toLowerCase().includes(searchLower) ||
            doc.description?.toLowerCase().includes(searchLower) ||
            doc.category?.toLowerCase().includes(searchLower) ||
            doc.tags?.some(tag => tag?.toLowerCase().includes(searchLower))
          )
          .map(doc => ({
            id: doc.id,
            type: "document" as const,
            title: doc.name || "Untitled Document",
            subtitle: doc.type?.replace("_", " "),
            description: doc.description || undefined,
            url: `/documents`,
            metadata: { 
              uploadDate: doc.uploadDate,
              signatureStatus: doc.signatureStatus,
              tags: doc.tags,
            },
          }));
        allResults.push(...docResults.slice(0, 3));

        // Search Communications
        const { data: communications } = await client.models.Communication.list();
        const commResults = communications
          .filter(comm =>
            comm.subject?.toLowerCase().includes(searchLower) ||
            comm.content?.toLowerCase().includes(searchLower) ||
            comm.recipientEmail?.toLowerCase().includes(searchLower)
          )
          .map(comm => ({
            id: comm.id,
            type: "communication" as const,
            title: comm.subject || "No Subject",
            subtitle: comm.type || undefined,
            description: comm.content?.substring(0, 100) + "...",
            url: `/communications`,
            metadata: {
              status: comm.status,
              sentDate: comm.sentDate,
              recipientEmail: comm.recipientEmail,
            },
          }));
        allResults.push(...commResults.slice(0, 3));

        // Search Tasks
        const { data: tasks } = await client.models.OnboardingTask.list();
        const taskResults = tasks
          .filter(task =>
            task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.category?.toLowerCase().includes(searchLower)
          )
          .map(task => ({
            id: task.id,
            type: "task" as const,
            title: task.title || "Untitled Task",
            subtitle: task.category || undefined,
            description: task.description || undefined,
            url: `/onboarding`,
            metadata: {
              status: task.status,
              dueDate: task.dueDate,
              category: task.category,
            },
          }));
        allResults.push(...taskResults.slice(0, 3));

        // Search Applicants
        const { data: applicants } = await client.models.Applicant.list();
        const applicantResults = applicants
          .filter(applicant =>
            applicant.firstName?.toLowerCase().includes(searchLower) ||
            applicant.lastName?.toLowerCase().includes(searchLower) ||
            applicant.email?.toLowerCase().includes(searchLower) ||
            applicant.position?.toLowerCase().includes(searchLower)
          )
          .map(applicant => ({
            id: applicant.id,
            type: "applicant" as const,
            title: `${applicant.firstName} ${applicant.lastName}`,
            subtitle: applicant.position,
            description: `${applicant.status} • Applied ${new Date(applicant.appliedDate).toLocaleDateString()}`,
            url: `/applicants`,
            metadata: {
              status: applicant.status,
              appliedDate: applicant.appliedDate,
              email: applicant.email,
            },
          }));
        allResults.push(...applicantResults.slice(0, 3));

        // Search Templates (simulate local search)
        const mockTemplates = [
          {
            id: "1",
            name: "Software Engineer Onboarding",
            description: "Complete onboarding template for new software engineers",
            category: "role-specific",
            tags: ["development", "software", "technical"],
          },
          {
            id: "2", 
            name: "General Employee Onboarding",
            description: "Standard onboarding process for all new employees",
            category: "general",
            tags: ["general", "hr", "basic"],
          },
          {
            id: "3",
            name: "Manager Onboarding",
            description: "Leadership-focused onboarding for new managers",
            category: "role-specific", 
            tags: ["management", "leadership", "team"],
          },
        ];

        const templateResults = mockTemplates
          .filter(template =>
            template.name?.toLowerCase().includes(searchLower) ||
            template.description?.toLowerCase().includes(searchLower) ||
            template.category?.toLowerCase().includes(searchLower) ||
            template.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          )
          .map(template => ({
            id: template.id,
            type: "template" as const,
            title: template.name,
            subtitle: template.category?.replace("-", " "),
            description: template.description,
            url: `/templates`,
            metadata: {
              category: template.category,
              tags: template.tags,
            },
          }));
        allResults.push(...templateResults.slice(0, 3));

        setResults(allResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setSearchTerm("");
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "user":
        return <Users className="w-5 h-5" />;
      case "document":
        return <FileText className="w-5 h-5" />;
      case "communication":
        return <Mail className="w-5 h-5" />;
      case "task":
        return <ClipboardList className="w-5 h-5" />;
      case "applicant":
        return <Briefcase className="w-5 h-5" />;
      case "template":
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-700";
      case "document":
        return "bg-green-100 text-green-700";
      case "communication":
        return "bg-purple-100 text-purple-700";
      case "task":
        return "bg-yellow-100 text-yellow-700";
      case "applicant":
        return "bg-indigo-100 text-indigo-700";
      case "template":
        return "bg-orange-100 text-orange-700";
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-w-0 touch-target"
      >
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-600 hidden sm:inline">Search...</span>
        <kbd className="hidden lg:inline-flex items-center space-x-1 px-2 py-1 text-xs bg-white rounded border border-gray-300">
          <span className="text-xs">⌘</span>
          <span>K</span>
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-20">
          <div
            ref={searchRef}
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[70vh] overflow-hidden modal-mobile"
          >
            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search users, documents, communications..."
                  className="w-full pl-10 pr-10 py-2 sm:py-3 text-base sm:text-lg focus:outline-none form-mobile"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
                {!loading && searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setResults([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="overflow-y-auto max-h-[45vh] sm:max-h-[50vh] touch-scroll">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-3 sm:px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 transition-colors touch-target ${
                      index === selectedIndex ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{result.title}</h4>
                        <span className="text-xs text-gray-500 capitalize">
                          {result.type.replace("_", " ")}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600">{result.subtitle}</p>
                      )}
                      {result.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {result.description}
                        </p>
                      )}
                      {result.metadata?.tags && (
                        <div className="flex items-center space-x-2 mt-1">
                          {result.metadata.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchTerm.length >= 2 && !loading && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No results found for "{searchTerm}"</p>
              </div>
            )}

            {/* Empty State */}
            {searchTerm.length < 2 && !loading && (
              <div className="p-8 text-center">
                <p className="text-gray-500">Type to search across all modules</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-500">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 ml-1">↓</kbd>
                  <span className="ml-2">Navigate</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">Enter</kbd>
                  <span className="ml-2">Select</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">Esc</kbd>
                  <span className="ml-2">Close</span>
                </span>
              </div>
              <div className="sm:hidden text-xs text-gray-400">
                Tap to select
              </div>
              <span className="font-medium">{results.length} results</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}