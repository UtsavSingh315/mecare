"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Flame, Award, TrendingUp, User, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarView } from "@/components/calendar-view";
import { NextCycleCard } from "@/components/next-cycle-card";
import { AffirmationCard } from "@/components/affirmation-card";
import { TodoList } from "@/components/todo-list";
import { useAuth } from "@/contexts/auth-context";

interface DashboardData {
  currentStreak: number;
  totalLogged: number;
  badges: string[];
  currentCycle: number;
  averageCycle: number;
  nextPeriod: string | null;
  fertilityWindow: {
    start: string | null;
    end: string | null;
  };
}

interface CalendarData {
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
}

interface UserChallenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentProgress: number;
  type: string;
  isCompleted: boolean;
}

export default function Home() {
  const [showBadge, setShowBadge] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Simulate badge unlock animation
    const timer = setTimeout(() => setShowBadge(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("auth_token");

        // Fetch dashboard data
        const dashboardResponse = await fetch(
          `/api/users/${user.id}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json();
          setDashboardData(data);
        } else {
          console.error("Failed to fetch dashboard data");
          // Fall back to default data
          setDashboardData({
            currentStreak: 0,
            totalLogged: 0,
            badges: [],
            currentCycle: 1,
            averageCycle: 28,
            nextPeriod: null,
            fertilityWindow: { start: null, end: null },
          });
        }

        // Fetch calendar data for current month
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const calendarResponse = await fetch(
          `/api/users/${user.id}/calendar?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          setCalendarData(calendarData);
        } else {
          console.error("Failed to fetch calendar data");
          setCalendarData({ logs: [], periodDays: [] });
        }

        // Fetch user challenges
        const challengesResponse = await fetch(
          `/api/users/${user.id}/challenges`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json();
          setChallenges(challengesData.slice(0, 3)); // Show only top 3 challenges
        } else {
          console.error("Failed to fetch challenges data");
          setChallenges([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fall back to default data
        setDashboardData({
          currentStreak: 0,
          totalLogged: 0,
          badges: [],
          currentCycle: 1,
          averageCycle: 28,
          nextPeriod: null,
          fertilityWindow: { start: null, end: null },
        });
        setCalendarData({ logs: [], periodDays: [] });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [user, isAuthenticated]);

  if (loading || !dashboardData || !calendarData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Hi {user?.name || "there"}! 👋
            </h1>
            <p className="text-rose-100">Welcome to MeCare</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 streak-flame" />
              <span className="text-xl font-bold">
                {dashboardData.currentStreak}
              </span>
            </div>
            <p className="text-sm text-rose-100">day streak</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full p-1 mb-4">
          <div className="bg-white rounded-full px-4 py-2 flex items-center justify-between">
            <span className="text-rose-600 font-medium">
              Day {dashboardData.currentCycle} of cycle
            </span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {dashboardData.totalLogged}
            </div>
            <div className="text-sm text-rose-100">Days logged</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {dashboardData.badges.length}
            </div>
            <div className="text-sm text-rose-100">Badges earned</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Affirmation Card */}
        <AffirmationCard />

        {/* Todo List */}
        <TodoList />

        {/* Next Cycle Prediction */}
        {dashboardData.nextPeriod &&
        dashboardData.fertilityWindow.start &&
        dashboardData.fertilityWindow.end ? (
          <NextCycleCard
            data={{
              nextPeriod: new Date(dashboardData.nextPeriod),
              fertilityWindow: {
                start: new Date(dashboardData.fertilityWindow.start),
                end: new Date(dashboardData.fertilityWindow.end),
              },
              currentCycle: dashboardData.currentCycle,
            }}
          />
        ) : (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <CardContent className="p-6 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-semibold mb-2">Start Tracking</h3>
              <p className="text-rose-100">
                Log your period to get predictions and insights!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CalendarDays className="w-5 h-5 text-rose-500" />
              Your Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarView
              logs={calendarData?.logs || []}
              periodDays={calendarData?.periodDays || []}
              currentDate={new Date()}
              onDateSelect={(date) => {
                console.log("Selected date:", date);
              }}
            />
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Award className="w-5 h-5 text-rose-500" />
              Your Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboardData.badges.map((badge: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200 ${
                    showBadge && index === dashboardData.badges.length - 1
                      ? "badge-bounce"
                      : ""
                  }`}>
                  {badge}
                </Badge>
              ))}
              {dashboardData.badges.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Start logging to earn your first badge! 🏆
                </p>
              )}
            </div>

            {/* Current Challenges */}
            {challenges.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active Challenges
                </h4>
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {challenge.title}
                      </span>
                      {challenge.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-gray-500">
                          {challenge.currentProgress}/{challenge.targetValue}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={
                        (challenge.currentProgress / challenge.targetValue) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Default challenge if no active challenges */}
            {challenges.length === 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">
                  Monthly Challenge
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Log 25 days this month
                </p>
                <Progress value={68} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">17/25 days completed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
