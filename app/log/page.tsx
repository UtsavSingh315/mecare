"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Zap,
  Coffee,
  Moon,
  Thermometer,
  Activity,
  Plus,
  Save,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

const moods = [
  { emoji: "😄", label: "Happy", value: "happy" },
  { emoji: "😊", label: "Content", value: "content" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "😞", label: "Sad", value: "sad" },
  { emoji: "😡", label: "Angry", value: "angry" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
];

const symptoms = [
  { icon: Zap, label: "Cramps", value: "cramps" },
  { icon: Coffee, label: "Headache", value: "headache" },
  { icon: Moon, label: "Fatigue", value: "fatigue" },
  { icon: Activity, label: "Back Pain", value: "backpain" },
  { icon: Heart, label: "Breast Tenderness", value: "breast" },
  { icon: Thermometer, label: "Bloating", value: "bloating" },
];

export default function LogPage() {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState([0]);
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [periodFlow, setPeriodFlow] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [waterIntake, setWaterIntake] = useState([8]);
  const [sleepHours, setSleepHours] = useState([7.5]);
  const [exerciseMinutes, setExerciseMinutes] = useState([30]);
  const [weight, setWeight] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom)) {
      setSelectedSymptoms((prev) => [...prev, customSymptom]);
      setCustomSymptom("");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save a log");
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const token = localStorage.getItem("auth_token");

      const logData = {
        userId: user.id,
        date: today,
        mood: selectedMood,
        painLevel: painLevel[0],
        energyLevel: energyLevel[0],
        waterIntake: waterIntake[0],
        sleepHours: sleepHours[0].toString(),
        exerciseMinutes: exerciseMinutes[0],
        weight: weight || null,
        isOnPeriod: periodFlow,
        notes: notes,
        symptoms: selectedSymptoms,
      };

      const response = await fetch("/api/daily-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        toast.success("Your daily log has been saved! 🎉", {
          description: "Keep up the great work tracking your health!",
        });

        // Reset form
        setSelectedMood("");
        setSelectedSymptoms([]);
        setPainLevel([0]);
        setEnergyLevel([5]);
        setPeriodFlow(false);
        setCustomSymptom("");
        setNotes("");
        setWaterIntake([8]);
        setSleepHours([7.5]);
        setExerciseMinutes([30]);
        setWeight("");
      } else {
        const error = await response.json();
        toast.error("Failed to save log", {
          description: error.error || "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error saving log:", error);
      toast.error("Failed to save log", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Daily Log</h1>
        </div>
        <p className="text-rose-100">{today}</p>
        <p className="text-sm text-rose-100 mt-2">How are you feeling today?</p>
      </div>

      {/* Mood Selection */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Heart className="w-5 h-5 text-rose-500" />
            Your Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <Button
                key={mood.value}
                variant={selectedMood === mood.value ? "default" : "outline"}
                className={`h-20 flex-col gap-2 ${
                  selectedMood === mood.value
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "hover:bg-rose-50 hover:border-rose-200"
                }`}
                onClick={() => setSelectedMood(mood.value)}>
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Period Flow */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Activity className="w-5 h-5 text-rose-500" />
            Period Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="period-flow" className="text-base">
              Are you on your period today?
            </Label>
            <Switch
              id="period-flow"
              checked={periodFlow}
              onCheckedChange={setPeriodFlow}
            />
          </div>
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Zap className="w-5 h-5 text-rose-500" />
            Symptoms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {symptoms.map((symptom) => {
              const Icon = symptom.icon;
              const isSelected = selectedSymptoms.includes(symptom.value);
              return (
                <Button
                  key={symptom.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-16 flex-col gap-2 ${
                    isSelected
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "hover:bg-rose-50 hover:border-rose-200"
                  }`}
                  onClick={() => toggleSymptom(symptom.value)}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{symptom.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Custom Symptom */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom symptom..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addCustomSymptom} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <Badge
                  key={symptom}
                  variant="secondary"
                  className="bg-rose-100 text-rose-700 border-rose-200">
                  {symptom}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pain & Energy Levels */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Thermometer className="w-5 h-5 text-rose-500" />
            Health Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Pain Level</Label>
            <div className="mt-2">
              <Slider
                value={painLevel}
                onValueChange={setPainLevel}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>No pain</span>
                <span className="font-medium text-gray-700">
                  {painLevel[0]}/10
                </span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Energy Level</Label>
            <div className="mt-2">
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Very low</span>
                <span className="font-medium text-gray-700">
                  {energyLevel[0]}/10
                </span>
                <span>Very high</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">
              Water Intake (glasses)
            </Label>
            <div className="mt-2">
              <Slider
                value={waterIntake}
                onValueChange={setWaterIntake}
                max={12}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0 glasses</span>
                <span className="font-medium text-gray-700">
                  {waterIntake[0]} glasses
                </span>
                <span>12+ glasses</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Sleep Hours</Label>
            <div className="mt-2">
              <Slider
                value={sleepHours}
                onValueChange={setSleepHours}
                max={12}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0 hours</span>
                <span className="font-medium text-gray-700">
                  {sleepHours[0]} hours
                </span>
                <span>12+ hours</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Exercise Minutes</Label>
            <div className="mt-2">
              <Slider
                value={exerciseMinutes}
                onValueChange={setExerciseMinutes}
                max={180}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>0 minutes</span>
                <span className="font-medium text-gray-700">
                  {exerciseMinutes[0]} minutes
                </span>
                <span>3+ hours</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Weight (optional)</Label>
            <div className="mt-2">
              <Input
                type="number"
                placeholder="Enter your weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full"
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Coffee className="w-5 h-5 text-rose-500" />
            Additional Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How was your day? Any additional notes about your health, mood, or activities..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSubmitting}
        className="w-full h-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium text-lg shadow-lg disabled:opacity-50">
        <Save className="w-5 h-5 mr-2" />
        {isSubmitting ? "Saving..." : "Save Today's Log"}
      </Button>
    </div>
  );
}
