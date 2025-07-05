"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const testData = [
  { name: "Test 1", frequency: 10 },
  { name: "Test 2", frequency: 8 },
  { name: "Test 3", frequency: 6 },
];

export function TestChart() {
  console.log("TestChart rendering with data:", testData);

  return (
    <div>
      <p className="text-sm mb-2">Test Chart</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={testData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="frequency" fill="#f43f5e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
