import {
  Car,
  Flame,
  Heater,
  Laptop,
  PawPrint,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Shirt,
  Eye,
  Palmtree,
} from "lucide-react";
import { amenityLabel, isAmenity, type AlojamientoAmenity } from "@/lib/details";

const ICONS: Record<AlojamientoAmenity, typeof Waves> = {
  pool: Waves,
  parking: Car,
  wifi: Wifi,
  ac: Wind,
  grill: Flame,
  kitchen: UtensilsCrossed,
  washer: Shirt,
  sea_view: Eye,
  pet_friendly: PawPrint,
  tv: Tv,
  heating: Heater,
  workspace: Laptop,
  beach_access: Palmtree,
};

export function AmenityChip({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const Icon = isAmenity(value) ? ICONS[value] : Sparkles;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-chip text-foreground/80 ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      <Icon size={compact ? 11 : 13} strokeWidth={1.75} />
      {amenityLabel(value)}
    </span>
  );
}
