"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  Heart,
  Activity,
  Target,
  Award,
  BarChart3,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface InsightsData {
  totalLogged: number;
  periodsLogged: number;
  avgPainLevel: number;
  avgEnergyLevel: number;
  cycleConsistency: number;
  badgesEarned: number;
  symptoms: Array<{ name: string; frequency: number }>;
  moods: Array<{ name: string; frequency: number }>;
  monthlyTrends: {
    totalLogs: number;
    periodDays: number;
    avgPain: number;
    avgEnergy: number;
  };
}

const COLORS = [
  "#f43f5e",
  "#ec4899",
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/users/${user.id}/insights`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        } else {
          console.error("Failed to fetch insights data");
          // Fallback to default data
          setInsights({
            totalLogged: 0,
            periodsLogged: 0,
            avgPainLevel: 0,
            avgEnergyLevel: 5,
            cycleConsistency: 0,
            badgesEarned: 0,
            symptoms: [],
            moods: [],
            monthlyTrends: {
              totalLogs: 0,
              periodDays: 0,
              avgPain: 0,
              avgEnergy: 5,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching insights data:", error);
        // Set default data
        setInsights({
          totalLogged: 0,
          periodsLogged: 0,
          avgPainLevel: 0,
          avgEnergyLevel: 5,
          cycleConsistency: 0,
          badgesEarned: 0,
          symptoms: [],
          moods: [],
          monthlyTrends: {
            totalLogs: 0,
            periodDays: 0,
            avgPain: 0,
            avgEnergy: 5,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchInsights();
    }
  }, [user, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load insights data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Your Health Insights</h1>
        </div>
        <p className="text-rose-100">
          Understanding your patterns helps you take better care of yourself
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.totalLogged}
            </div>
            <div className="text-sm text-gray-600">Days Logged</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.periodsLogged}
            </div>
            <div className="text-sm text-gray-600">Periods Tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.avgPainLevel.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Pain Level</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.avgEnergyLevel.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Energy Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Target className="w-5 h-5 text-rose-500" />
              Cycle Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Tracking Consistency
                </span>
                <span className="text-sm font-medium">
                  {insights.cycleConsistency}%
                </span>
              </div>
              <Progress value={insights.cycleConsistency} className="h-2" />
              <p className="text-xs text-gray-500">
                Based on regular logging patterns
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Award className="w-5 h-5 text-rose-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Badges Earned</span>
                <span className="text-lg font-bold text-gray-800">
                  {insights.badgesEarned}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {Array.from({
                    length: Math.min(insights.badgesEarned, 5),
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {insights.badgesEarned > 5 && (
                  <span className="text-sm text-gray-500">
                    +{insights.badgesEarned - 5} more
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Symptoms Chart */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="w-5 h-5 text-rose-500" />
              Most Common Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.symptoms && insights.symptoms.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={insights.symptoms.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="frequency"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No symptom data available yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start logging to see your patterns
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Heart className="w-5 h-5 text-rose-500" />
              Mood Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.moods && insights.moods.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={insights.moods.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="frequency">
                      {insights.moods.slice(0, 6).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {insights.moods.slice(0, 6).map((mood, index) => (
                    <div key={mood.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}></div>
                      <span className="text-sm text-gray-600 capitalize">
                        {mood.name}
                      </span>
                      <span className="text-sm font-medium">
                        ({mood.frequency})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No mood data available yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start logging to see your patterns
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            This Month's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {insights.monthlyTrends.totalLogs}
              </div>
              <div className="text-sm text-gray-600">Days Logged</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {insights.monthlyTrends.periodDays}
              </div>
              <div className="text-sm text-gray-600">Period Days</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {insights.monthlyTrends.avgPain.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Pain</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {insights.monthlyTrends.avgEnergy.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Energy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
