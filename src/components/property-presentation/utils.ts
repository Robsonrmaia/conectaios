import { ShoppingBag, Train, Hospital, GraduationCap, TreePine, Waves, Building2 } from 'lucide-react';

const iconMap: Record<string, any> = {
  ShoppingBag,
  Train,
  Hospital,
  GraduationCap,
  TreePine,
  Waves,
  MapPin: Building2, // fallback
};

export function getPlaceIcon(iconName: string) {
  return iconMap[iconName] || Building2;
}