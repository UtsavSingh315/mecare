import { Calendar, Heart, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NextCycleCardProps {
  data: {
    nextPeriod: Date;
    fertilityWindow: {
      start: Date;
      end: Date;
    };
    currentCycle: number;
  };
}

export function NextCycleCard({ data }: NextCycleCardProps) {
  const daysUntilPeriod = Math.ceil((data.nextPeriod.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysUntilFertile = Math.ceil((data.fertilityWindow.start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          What's Coming Up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5" />
            <span className="font-medium">Next Period</span>
          </div>
          <p className="text-2xl font-bold mb-1">{daysUntilPeriod} days</p>
          <p className="text-sm text-rose-100">
            {data.nextPeriod.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Fertile Window</span>
          </div>
          <p className="text-2xl font-bold mb-1">{daysUntilFertile} days</p>
          <p className="text-sm text-rose-100">
            {data.fertilityWindow.start.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {data.fertilityWindow.end.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}