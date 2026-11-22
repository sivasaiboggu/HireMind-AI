import { LayoutDashboard, FileText, Mic, Map, Terminal, Columns3 } from 'lucide-react';

export const navigation = [
  { path: '/hiring', label: 'Hiring pipeline', short: 'Hiring', detail: 'Review candidates and schedule interviews', icon: Columns3 },
  { path: '/dashboard', label: 'Overview', short: 'Overview', detail: 'Scores and saved work', icon: LayoutDashboard },
  { path: '/resume', label: 'Resume review', short: 'Resume', detail: 'Check a resume against a role', icon: FileText },
  { path: '/interview', label: 'Mock interview', short: 'Mock', detail: 'Rehearse with an interviewer', icon: Mic },
  { path: '/roadmap', label: 'Study plan', short: 'Plan', detail: 'Build a week-by-week plan', icon: Map },
  { path: '/quiz', label: 'Practice lab', short: 'Practice', detail: 'Run code or practise interview answers', icon: Terminal },
] as const;
