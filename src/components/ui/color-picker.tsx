import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#1CA9C9', '#6DDDEB', '#3B82F6', '#EF4444', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#000000'
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[200px] justify-start text-left font-normal"
        >
          <div className="w-4 h-4 rounded border mr-2" style={{ backgroundColor: value }} />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Cor personalizada</label>
            <Input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-10 mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Cores predefinidas</label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border border-gray-300 hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onChange(color)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Valor hexadecimal</label>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="mt-1"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}