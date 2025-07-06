"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface LogData {
  date: string;
  mood: string | null;
  painLevel: number | null;
  energyLevel: number | null;
  isOnPeriod: boolean | null;
  notes: string | null;
}

interface PeriodData {
  date: string;
  flowIntensity: string | null;
  notes: string | null;
}

interface CalendarViewProps {
  logs: LogData[];
  periodDays: PeriodData[];
  predictions?: {
    nextPeriod: string | null;
    fertileWindow: string | null;
    ovulation: string | null;
  };
  currentDate: Date;
  onDateSelect?: (date: Date | undefined) => void;
  onMonthChange?: (date: Date) => void;
}

export function CalendarView({
  logs,
  periodDays,
  predictions,
  currentDate,
  onDateSelect,
  onMonthChange,
}: CalendarViewProps) {
  // Safety check for currentDate
  const safeCurrentDate = currentDate || new Date();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleMonthChange = (date: Date) => {
    onMonthChange?.(date);
  };

  // Create lookup maps for efficient searching
  const logMap = new Map((logs || []).map((log) => [log.date, log]));
  const periodMap = new Map(
    (periodDays || []).map((period) => [period.date, period])
  );

  // Helper function to get date string in YYYY-MM-DD format (timezone-safe)
  const getDateString = (date: Date): string => {
    // Use local timezone to avoid date shifting issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to create a Date object from YYYY-MM-DD string in local timezone
  const createLocalDate = (dateString: string): Date => {
    // Parse the date in local timezone to avoid UTC conversion issues
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in Date constructor
  };

  // Helper function to check if a date has specific data
  const hasLogData = (date: Date): boolean => {
    return logMap.has(getDateString(date));
  };

  const isPeriodDay = (date: Date): boolean => {
    const dateStr = getDateString(date);
    const log = logMap.get(dateStr);
    const periodData = periodMap.get(dateStr);
    
    // A day is a period day only if BOTH conditions are true:
    // 1. The daily log explicitly says isOnPeriod: true
    // 2. There's corresponding period flow data for that day
    return log?.isOnPeriod === true && !!periodData;
  };

  const getPainLevel = (date: Date): number | null => {
    const log = logMap.get(getDateString(date));
    return log?.painLevel || null;
  };

  const getEnergyLevel = (date: Date): number | null => {
    const log = logMap.get(getDateString(date));
    return log?.energyLevel || null;
  };

  // Create modifiers for calendar styling
  const currentMonth = safeCurrentDate.getMonth();
  const currentYear = safeCurrentDate.getFullYear();

  // Get all dates in current month that have specific data
  const datesWithLogs: Date[] = [];
  const periodDates: Date[] = [];
  const highPainDates: Date[] = [];
  const lowEnergyDates: Date[] = [];
  const predictedPeriodDates: Date[] = [];
  const ovulationDates: Date[] = [];
  const fertileDates: Date[] = [];

  logs.forEach((log) => {
    const logDate = createLocalDate(log.date);
    if (
      logDate.getMonth() === currentMonth &&
      logDate.getFullYear() === currentYear
    ) {
      datesWithLogs.push(logDate);

      // Only add to periodDates if it meets the strict isPeriodDay criteria
      if (isPeriodDay(logDate)) {
        periodDates.push(logDate);
      }

      if (log.painLevel && log.painLevel >= 6) {
        highPainDates.push(logDate);
      }

      if (log.energyLevel && log.energyLevel <= 3) {
        lowEnergyDates.push(logDate);
      }
    }
  });

  // Add period days that meet the strict criteria (both log.isOnPeriod and period data)
  periodDays.forEach((period) => {
    const periodDate = createLocalDate(period.date);
    if (
      periodDate.getMonth() === currentMonth &&
      periodDate.getFullYear() === currentYear
    ) {
      // Only add if it passes the isPeriodDay validation and isn't already included
      if (isPeriodDay(periodDate) && !periodDates.some((d) => getDateString(d) === period.date)) {
        periodDates.push(periodDate);
      }
    }
  });

  // Add prediction dates
  if (predictions) {
    if (predictions.nextPeriod) {
      const nextPeriodDate = createLocalDate(predictions.nextPeriod);
      // Only add predicted period if it doesn't conflict with actual period days
      if (
        nextPeriodDate.getMonth() === currentMonth &&
        nextPeriodDate.getFullYear() === currentYear &&
        !periodDates.some(pd => getDateString(pd) === getDateString(nextPeriodDate))
      ) {
        predictedPeriodDates.push(nextPeriodDate);
        // Add predicted period duration (assume 5 days)
        for (let i = 1; i < 5; i++) {
          const periodDay = new Date(nextPeriodDate);
          periodDay.setDate(nextPeriodDate.getDate() + i);
          if (
            periodDay.getMonth() === currentMonth &&
            periodDay.getFullYear() === currentYear &&
            !periodDates.some(pd => getDateString(pd) === getDateString(periodDay))
          ) {
            predictedPeriodDates.push(periodDay);
          }
        }
      }
    }

    if (predictions.ovulation) {
      const ovulationDate = createLocalDate(predictions.ovulation);
      if (
        ovulationDate.getMonth() === currentMonth &&
        ovulationDate.getFullYear() === currentYear
      ) {
        ovulationDates.push(ovulationDate);
      }
    }

    if (predictions.fertileWindow) {
      const [startDate, endDate] = predictions.fertileWindow.split(" to ");
      if (startDate && endDate) {
        const fertileStart = createLocalDate(startDate);
        const fertileEnd = createLocalDate(endDate);

        for (
          let d = new Date(fertileStart);
          d <= fertileEnd;
          d.setDate(d.getDate() + 1)
        ) {
          if (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          ) {
            fertileDates.push(new Date(d));
          }
        }
      }
    }
  }

  const modifiers = {
    logged: datesWithLogs,
    period: periodDates,
    highPain: highPainDates,
    lowEnergy: lowEnergyDates,
    predictedPeriod: predictedPeriodDates,
    ovulation: ovulationDates,
    fertile: fertileDates,
  };

  const modifiersStyles = {
    logged: {
      backgroundColor: "#e0f2fe",
      color: "#0277bd",
      fontWeight: "bold",
    },
    period: {
      backgroundColor: "#ef4444",
      color: "white",
      borderRadius: "50%",
    },
    highPain: {
      backgroundColor: "#dc2626",
      color: "white",
      borderRadius: "50%",
    },
    lowEnergy: {
      backgroundColor: "#f59e0b",
      color: "white",
      borderRadius: "50%",
    },
    predictedPeriod: {
      backgroundColor: "#fca5a5",
      color: "#991b1b",
      borderRadius: "50%",
      border: "2px dashed #dc2626",
      fontWeight: "bold",
    },
    ovulation: {
      backgroundColor: "#a3e635",
      color: "#365314",
      borderRadius: "50%",
      fontWeight: "bold",
    },
    fertile: {
      backgroundColor: "#bbf7d0",
      color: "#166534",
      borderRadius: "4px",
    },
  };
  // Helper function to get mood emoji
  const getMoodEmoji = (mood: string | null): string => {
    const moodEmojis: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      anxious: "😰",
      calm: "😌",
      energetic: "⚡",
      tired: "😴",
      confident: "😎",
      stressed: "😤",
    };
    return moodEmojis[mood || ""] || "😐";
  };

  // Helper function to get pain level description
  const getPainDescription = (level: number | null): string => {
    if (!level) return "No pain";
    if (level <= 2) return "Mild";
    if (level <= 5) return "Moderate";
    if (level <= 7) return "Severe";
    return "Extreme";
  };

  // Helper function to get energy level description
  const getEnergyDescription = (level: number | null): string => {
    if (!level) return "Not recorded";
    if (level <= 3) return "Low";
    if (level <= 6) return "Moderate";
    return "High";
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        onMonthChange={handleMonthChange}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-lg border-0"
        month={safeCurrentDate}
      />

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Logged data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-300 border-2 border-dashed border-red-600 rounded-full"></div>
          <span>Predicted period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-lime-400 rounded-full"></div>
          <span>Ovulation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span>Fertile window</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span>High pain</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
          <span>Low energy</span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>

            {(() => {
              const dateStr = getDateString(selectedDate);
              const logData = logMap.get(dateStr);
              const periodData = periodMap.get(dateStr);
              const isActualPeriodDay = isPeriodDay(selectedDate);
              const isPredictedPeriodDay = predictedPeriodDates.some(pd => getDateString(pd) === dateStr);

              if (logData || periodData) {
                return (
                  <div className="space-y-3">
                    {/* Basic Status */}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="text-purple-600 border-purple-200">
                        ✓ Data logged
                      </Badge>
                      {isActualPeriodDay && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-200">
                          🔴 Period day
                        </Badge>
                      )}
                      {periodData && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-200">
                          Flow: {periodData.flowIntensity || "Unknown"}
                        </Badge>
                      )}
                    </div>

                    {/* Detailed Information */}
                    {logData && (
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {/* Mood */}
                        {logData.mood && (
                          <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                            <span className="text-gray-600">Mood:</span>
                            <span className="font-medium">
                              {getMoodEmoji(logData.mood)} {logData.mood}
                            </span>
                          </div>
                        )}

                        {/* Pain Level */}
                        {logData.painLevel !== null && (
                          <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                            <span className="text-gray-600">Pain Level:</span>
                            <span className="font-medium">
                              {logData.painLevel}/10 (
                              {getPainDescription(logData.painLevel)})
                            </span>
                          </div>
                        )}

                        {/* Energy Level */}
                        {logData.energyLevel !== null && (
                          <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                            <span className="text-gray-600">Energy Level:</span>
                            <span className="font-medium">
                              {logData.energyLevel}/10 (
                              {getEnergyDescription(logData.energyLevel)})
                            </span>
                          </div>
                        )}

                        {/* Notes */}
                        {(logData.notes || periodData?.notes) && (
                          <div className="p-2 bg-white/60 rounded-lg">
                            <span className="text-gray-600 text-sm">
                              Notes:
                            </span>
                            <p className="text-gray-800 mt-1">
                              {logData.notes || periodData?.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              } else if (isPredictedPeriodDay) {
                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="text-red-300 border-red-300">
                        🔴 Predicted period day
                      </Badge>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-gray-500 text-sm">
                        This is a predicted period day based on your cycle pattern
                      </p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">
                      No data logged for this day
                    </p>
                    <Badge
                      variant="outline"
                      className="text-gray-400 border-gray-300">
                      💭 Tap "Log Today's Data" to add information
                    </Badge>
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
