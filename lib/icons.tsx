import {
  Award,
  BookOpen,
  Briefcase,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Laptop,
  Leaf,
  Library,
  Lightbulb,
  Mountain,
  Presentation,
  Scale,
  School,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trees,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  award: Award,
  "book-open": BookOpen,
  briefcase: Briefcase,
  "flask-conical": FlaskConical,
  "graduation-cap": GraduationCap,
  "heart-handshake": HeartHandshake,
  landmark: Landmark,
  laptop: Laptop,
  leaf: Leaf,
  library: Library,
  lightbulb: Lightbulb,
  mountain: Mountain,
  presentation: Presentation,
  scale: Scale,
  school: School,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  sprout: Sprout,
  trees: Trees,
  trophy: Trophy,
  users: Users,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = (name && ICONS[name]) || Sparkles;
  return <Cmp className={className} aria-hidden />;
}
