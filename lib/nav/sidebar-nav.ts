import {
  Calendar,
  CalendarClock,
  CircleDot,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Issues", href: "/issues", icon: CircleDot },
  { label: "Calendar", href: "/calendar", icon: CalendarClock },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Money", href: "/money", icon: Wallet },
  { label: "Notes", href: "/notes", icon: FileText },
];

export const WORKSPACE_NAV: NavItem[] = [
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Courses", href: "/courses", icon: GraduationCap },
];
