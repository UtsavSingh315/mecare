"use client";

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

const COLORS = [
  "#f43f5e",
  "#ec4899",
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
];

interface SymptomsChartProps {
  data: Array<{ name: string; frequency: number }>;
}

export function SymptomsChart({ data }: SymptomsChartProps) {
  console.log("SymptomsChart received data:", data);

  if (!data || data.length === 0) {
    console.log("No symptoms data available");
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No symptom data available yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Start logging to see your patterns
          </p>
        </div>
      </div>
    );
  }

  console.log("Rendering symptoms chart with data:", data.slice(0, 5));

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Found {data.length} symptoms</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data.slice(0, 5)}>
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
          <Bar dataKey="frequency" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MoodsChartProps {
  data: Array<{ name: string; frequency: number }>;
}

export function MoodsChart({ data }: MoodsChartProps) {
  console.log("MoodsChart received data:", data);

  if (!data || data.length === 0) {
    console.log("No moods data available");
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No mood data available yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Start logging to see your patterns
          </p>
        </div>
      </div>
    );
  }

  console.log("Rendering moods chart with data:", data.slice(0, 6));

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Found {data.length} moods</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data.slice(0, 6)}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="frequency">
            {data.slice(0, 6).map((_, index) => (
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
        {data.slice(0, 6).map((mood, index) => (
          <div key={mood.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: COLORS[index % COLORS.length],
              }}></div>
            <span className="text-sm text-gray-600 capitalize">
              {mood.name}
            </span>
            <span className="text-sm font-medium">({mood.frequency})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
