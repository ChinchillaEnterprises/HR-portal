"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Phone,
  User,
  Download
} from "lucide-react";
import { CalendarService } from "@/lib/calendarService";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  type: 'interview' | 'onboarding' | 'meeting' | 'training' | 'deadline';
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface CalendarWidgetProps {
  className?: string;
  userId?: string;
  compact?: boolean;
}

export default function CalendarWidget({ 
  className = "", 
  userId,
  compact = false 
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    loadEvents();
  }, [currentDate, userId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get events for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const calendarEvents = await CalendarService.getEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString(),
        userId ? { attendee: userId } : undefined
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        events: [],
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      });
    }
    
    // Next month's leading days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        events: [],
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventColor = (type: string, priority: string) => {
    const baseColors = {
      interview: 'bg-blue-500',
      onboarding: 'bg-green-500',
      meeting: 'bg-purple-500',
      training: 'bg-orange-500',
      deadline: 'bg-red-500',
    };

    const opacity = priority === 'high' ? '' : priority === 'medium' ? 'bg-opacity-75' : 'bg-opacity-50';
    
    return `${baseColors[type as keyof typeof baseColors] || 'bg-gray-500'} ${opacity}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return <User className="w-3 h-3" />;
      case 'onboarding':
        return <Users className="w-3 h-3" />;
      case 'meeting':
        return <Video className="w-3 h-3" />;
      case 'training':
        return <Clock className="w-3 h-3" />;
      case 'deadline':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDownloadEvent = (event: CalendarEvent) => {
    CalendarService.downloadICalFile(event);
  };

  const days = getDaysInMonth(currentDate);
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Today's Events</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading events...</div>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No events today</div>
        ) : (
          <div className="space-y-2">
            {todayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <div className={`p-1 rounded ${getEventColor(event.type, event.priority)} text-white`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
              </div>
            ))}
            {todayEvents.length > 3 && (
              <p className="text-xs text-gray-500 text-center py-2">
                +{todayEvents.length - 3} more events
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
            <p className="text-sm text-gray-600">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative min-h-[80px] p-1 border border-gray-100 rounded-lg cursor-pointer
                  ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50' : ''}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <div className={`
                  text-sm font-medium
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  ${isToday ? 'text-blue-600' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                {/* Events */}
                <div className="space-y-1 mt-1">
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`
                        text-xs text-white px-1 py-0.5 rounded truncate
                        ${getEventColor(event.type, event.priority)}
                        hover:opacity-80 transition-opacity
                      `}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type, selectedEvent.priority)} text-white`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">{selectedEvent.type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Time */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(selectedEvent.startTime).toLocaleDateString()} • {' '}
                  {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                </span>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {/* Attendees */}
              {selectedEvent.attendees.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Attendees ({selectedEvent.attendees.length})</p>
                    <div className="text-xs text-gray-500">
                      {selectedEvent.attendees.slice(0, 3).join(', ')}
                      {selectedEvent.attendees.length > 3 && ` +${selectedEvent.attendees.length - 3} more`}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Description</p>
                  <p className="text-gray-500">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => handleDownloadEvent(selectedEvent)}
                className="px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}