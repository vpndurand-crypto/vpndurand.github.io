import {
  AlertTriangle, ArrowLeft, Building2, Calculator, Calendar, CalendarClock, Check, ChevronDown, ChevronRight, ChevronUp,
  Construction, ExternalLink, FileText, Gauge, History, Info, Landmark, LayoutDashboard, Lock, Milestone, RotateCcw, Save,
  Search, Settings, Sparkles, Table2, User, X, type LucideIcon,
} from 'lucide-react';

const ICONS = {
  overview: LayoutDashboard, financings: Landmark, covenants: Gauge, documents: FileText, data: Table2,
  schedule: CalendarClock, audit: History, settings: Settings, roadmap: Milestone, building: Building2,
  calendar: Calendar, chevronRight: ChevronRight, chevronDown: ChevronDown, chevronUp: ChevronUp, close: X,
  check: Check, info: Info, warning: AlertTriangle, preview: Sparkles, back: ArrowLeft, search: Search,
  reset: RotateCcw, save: Save, calculator: Calculator, lock: Lock, user: User, external: ExternalLink,
  construction: Construction,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string | undefined;
}

/** Icône au trait (lucide), toujours décorative : le sens est porté par le texte voisin. */
export function Icon({ name, size = 16, strokeWidth = 1.75, className }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
}
