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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.totalLogged}
            </div>
            <div className="text-sm text-gray-600">Days Logged</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.periodsLogged}
            </div>
            <div className="text-sm text-gray-600">Period Days</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.badgesEarned}
            </div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {insights.cycleConsistency}%
            </div>
            <div className="text-sm text-gray-600">Consistency</div>
          </CardContent>
        </Card>
      </div>

      {/* Pain & Energy Levels */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Average Pain & Energy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Pain Level</span>
                <span className="text-sm text-gray-600">
                  {insights.avgPainLevel}/10
                </span>
              </div>
              <Progress value={insights.avgPainLevel * 10} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Energy Level</span>
                <span className="text-sm text-gray-600">
                  {insights.avgEnergyLevel}/10
                </span>
              </div>
              <Progress value={insights.avgEnergyLevel * 10} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Logging Goal</span>
                  <span className="text-sm text-gray-600">
                    {insights.totalLogged}/90
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (insights.totalLogged / 90) * 100)}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {insights.symptoms.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-500" />
              Most Common Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.symptoms}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="frequency" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {insights.moods.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Mood Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insights.moods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="frequency">
                  {insights.moods.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Message for New Users */}
      {insights.totalLogged === 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-100 to-pink-100">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Start Your Journey
            </h3>
            <p className="text-gray-600 mb-4">
              Begin logging your daily symptoms and moods to see personalized
              insights and patterns.
            </p>
            <Badge className="bg-purple-500 text-white">
              Log your first day to unlock insights!
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Personalized Tips for Users with Data */}
      {insights.totalLogged > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-100 to-pink-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Personalized Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="text-sm text-gray-700">
                📊 <strong>Great Progress:</strong> You've logged{" "}
                {insights.totalLogged} days of health data. Keep up the
                excellent tracking!
              </p>
            </div>
            {insights.avgPainLevel > 5 && (
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-gray-700">
                  💡 <strong>Pain Management:</strong> Your average pain level
                  is {insights.avgPainLevel}/10. Consider discussing pain
                  management strategies with your healthcare provider.
                </p>
              </div>
            )}
            {insights.avgEnergyLevel < 4 && (
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-gray-700">
                  ⚡ <strong>Energy Boost:</strong> Your energy levels seem low.
                  Make sure you're getting enough sleep and consider gentle
                  exercise.
                </p>
              </div>
            )}
            {insights.cycleConsistency > 80 && (
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-gray-700">
                  🌟 <strong>Consistency Champion:</strong> You're{" "}
                  {insights.cycleConsistency}% consistent with logging. This
                  helps create more accurate insights!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
