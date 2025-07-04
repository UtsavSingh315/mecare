"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { formatDate, formatDateShort } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarData {
  year: number;
  month: number;
  logs: Array<{
    date: string;
    mood: string | null;
    painLevel: number | null;
    energyLevel: number | null;
    isOnPeriod: boolean | null;
    notes: string | null;
  }>;
  periodDays: Array<{
    date: string;
    flowIntensity: string | null;
    notes: string | null;
  }>;
  monthlyStats: {
    periodDays: number;
    loggedDays: number;
    avgPain: number;
    avgEnergy: number;
  };
  predictions: {
    nextPeriod: string | null;
    fertileWindow: string | null;
    ovulation: string | null;
    expectedPeriodLength?: number;
  };
  userSettings?: {
    configuredCycleLength: number;
    configuredPeriodLength?: number;
  };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const fetchCalendarData = async (date: Date) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const response = await fetch(
        `/api/users/${user.id}/calendar?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      } else {
        console.error("Failed to fetch calendar data");
        toast.error("Failed to load calendar data");
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Error loading calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchCalendarData(currentDate);
    }
  }, [user, isAuthenticated, currentDate]);

  const goToPreviousMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  const handleLogToday = () => {
    router.push("/log");
  };

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Calendar</h1>
          </div>
          <Button
            onClick={goToToday}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            Today
          </Button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={goToPreviousMonth}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <Button
            onClick={goToNextMonth}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <CalendarView
            logs={calendarData?.logs || []}
            periodDays={calendarData?.periodDays || []}
            predictions={calendarData?.predictions}
            currentDate={currentDate}
            onDateSelect={(date) => {
              // Optional: Handle date selection for additional actions
              console.log("Selected date:", date);
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            onClick={handleLogToday}>
            <Plus className="w-5 h-5 mr-2" />
            Log Today's Data
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-rose-200 hover:bg-rose-50">
              Mark Period Start
            </Button>
            <Button
              variant="outline"
              className="h-12 border-rose-200 hover:bg-rose-50">
              Mark Period End
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Trends */}
      {calendarData && calendarData.logs.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly History & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {calendarData.monthlyStats.avgPain?.toFixed(1) || "0"}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Avg Pain
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {calendarData.monthlyStats.avgEnergy?.toFixed(1) || "0"}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Avg Energy
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {calendarData.monthlyStats.loggedDays || 0}
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  Days Logged
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {calendarData.monthlyStats.periodDays || 0}
                </div>
                <div className="text-sm text-red-600 font-medium">
                  Period Days
                </div>
              </div>
            </div>

            {/* Predictions Section */}
            {calendarData.predictions &&
              (calendarData.predictions.nextPeriod ||
                calendarData.predictions.ovulation) && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    🔮 Predictions
                    {calendarData.userSettings?.configuredCycleLength && (
                      <span className="text-xs bg-white/70 px-2 py-1 rounded-full text-gray-600">
                        {calendarData.userSettings.configuredCycleLength}-day
                        cycle
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {calendarData.predictions.nextPeriod && (
                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Next Period</div>
                        <div className="font-semibold text-gray-800">
                          {formatDateShort(calendarData.predictions.nextPeriod)}
                        </div>
                        {calendarData.predictions.expectedPeriodLength && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expected:{" "}
                            {calendarData.predictions.expectedPeriodLength} days
                          </div>
                        )}
                      </div>
                    )}
                    {calendarData.predictions.ovulation && (
                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                          Expected Ovulation
                        </div>
                        <div className="font-semibold text-gray-800">
                          {formatDateShort(calendarData.predictions.ovulation)}
                        </div>
                      </div>
                    )}
                    {calendarData.predictions.fertileWindow && (
                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">
                          Fertile Window
                        </div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {(() => {
                            const [start, end] =
                              calendarData.predictions.fertileWindow!.split(
                                " to "
                              );
                            return `${formatDateShort(
                              start
                            )} - ${formatDateShort(end)}`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Recent Activity - Improved Design */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📝 Recent Activity
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {calendarData.logs
                  .slice(-10) // Show last 10 entries in chronological order
                  .reverse()
                  .map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                            {formatDateShort(log.date)}
                          </div>
                          {log.isOnPeriod && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              🔴 Period
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {log.mood && (
                          <div className="bg-white/80 px-2 py-1 rounded-lg text-center">
                            <div className="text-gray-500">Mood</div>
                            <div className="font-medium text-gray-700 capitalize">
                              {log.mood}
                            </div>
                          </div>
                        )}
                        {log.painLevel !== null && (
                          <div className="bg-white/80 px-2 py-1 rounded-lg text-center">
                            <div className="text-gray-500">Pain</div>
                            <div className="font-medium text-gray-700">
                              {log.painLevel}/10
                            </div>
                          </div>
                        )}
                        {log.energyLevel !== null && (
                          <div className="bg-white/80 px-2 py-1 rounded-lg text-center">
                            <div className="text-gray-500">Energy</div>
                            <div className="font-medium text-gray-700">
                              {log.energyLevel}/10
                            </div>
                          </div>
                        )}
                        {log.notes && (
                          <div className="bg-white/80 px-2 py-1 rounded-lg text-center md:col-span-1 col-span-2">
                            <div className="text-gray-500">Notes</div>
                            <div
                              className="font-medium text-gray-700 truncate"
                              title={log.notes}>
                              {log.notes.length > 15
                                ? log.notes.substring(0, 15) + "..."
                                : log.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Mood Patterns - Improved */}
            {(() => {
              const moodCounts: { [key: string]: number } = {};
              calendarData.logs.forEach((log) => {
                if (log.mood) {
                  moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
                }
              });

              const topMoods = Object.entries(moodCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

              if (topMoods.length > 0) {
                return (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      😊 Mood Patterns
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {topMoods.map(([mood, count]) => (
                        <Badge
                          key={mood}
                          className="bg-white/70 text-purple-700 border-purple-200 hover:bg-white/90 transition-colors">
                          {mood} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Cycle Summary */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800">This Month's Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {calendarData?.monthlyStats.periodDays || 0}
              </div>
              <div className="text-sm text-gray-600">Period days</div>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {calendarData?.monthlyStats.loggedDays || 0}
              </div>
              <div className="text-sm text-gray-600">Days logged</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {calendarData?.monthlyStats.avgPain || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Pain Level</div>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {calendarData?.monthlyStats.avgEnergy || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Energy</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {calendarData?.predictions?.nextPeriod && (
              <Badge variant="outline" className="text-red-600 border-red-200">
                Next Period: {formatDate(calendarData.predictions.nextPeriod)}
              </Badge>
            )}
            {calendarData?.monthlyStats?.periodDays &&
              calendarData.monthlyStats.periodDays > 0 && (
                <Badge
                  variant="outline"
                  className="text-purple-600 border-purple-200">
                  Period: {calendarData.monthlyStats.periodDays} days
                </Badge>
              )}
            {calendarData?.monthlyStats?.loggedDays &&
              calendarData.monthlyStats.loggedDays > 15 && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200">
                  Great tracking! 🎉
                </Badge>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
