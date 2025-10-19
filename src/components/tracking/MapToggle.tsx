import { Button } from '@/components/ui/button';
import { Map, Box } from 'lucide-react';

interface MapToggleProps {
  mode: '2D' | '3D';
  onModeChange: (mode: '2D' | '3D') => void;
}

export const MapToggle = ({ mode, onModeChange }: MapToggleProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex gap-1 bg-background/95 backdrop-blur rounded-lg p-1 shadow-lg border">
      <Button
        size="sm"
        variant={mode === '2D' ? 'default' : 'ghost'}
        onClick={() => onModeChange('2D')}
        className="gap-2"
      >
        <Map className="w-4 h-4" />
        2D Map
      </Button>
      <Button
        size="sm"
        variant={mode === '3D' ? 'default' : 'ghost'}
        onClick={() => onModeChange('3D')}
        className="gap-2"
      >
        <Box className="w-4 h-4" />
        3D View
      </Button>
    </div>
  );
};
