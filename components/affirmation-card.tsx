'use client';

import { useState, useEffect } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const affirmations = [
  "You're doing great, keep it up! 💪",
  "Your body is amazing and you're taking great care of it! 🌸",
  "Every day you track is a step towards better health! ✨",
  "You're strong, beautiful, and in control! 🌺",
  "Listen to your body - it's telling you important things! 🦋",
  "Self-care isn't selfish, it's essential! 💕",
  "You're creating healthy habits that will last a lifetime! 🌟",
  "Your health journey is unique and beautiful! 🌈",
];

export function AffirmationCard() {
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Change affirmation daily
    const today = new Date().getDate();
    setCurrentAffirmation(today % affirmations.length);
  }, []);

  const refreshAffirmation = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="font-medium text-gray-800">Daily Affirmation</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {affirmations[currentAffirmation]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAffirmation}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}