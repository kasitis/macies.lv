import React from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Home,
  FileText,
  List,
  PlusCircle,
  Settings,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Edit2,
  Image,
  BarChart2,
  FileSpreadsheet,
  Copy,
  BookOpen,
  ListChecks,
  Settings2,
  ArrowLeft,
  PlayCircle,
  FolderKanban,
  Clock,
  Sun,
  Moon,
  Delete,
  CornerDownLeft,
  Gamepad2,
  Calculator,
  MessageCircle,
  Send,
  RefreshCw,
  RotateCw,
  Shuffle,
  CheckCircle,
  Circle
} from 'lucide-react';

const iconComponents = {
  'home': Home,
  'file-text': FileText,
  'list': List,
  'plus-circle': PlusCircle,
  'settings': Settings,
  'download': Download,
  'upload': Upload,
  'trash-2': Trash2,
  'alert-triangle': AlertTriangle,
  'edit-2': Edit2,
  'image': Image,
  'bar-chart-2': BarChart2,
  'file-spreadsheet': FileSpreadsheet,
  'copy': Copy,
  'book-open': BookOpen,
  'list-checks': ListChecks,
  'settings-2': Settings2,
  'arrow-left': ArrowLeft,
  'play-circle': PlayCircle,
  'folder-kanban': FolderKanban,
  'clock': Clock,
  'sun': Sun,
  'moon': Moon,
  'delete': Delete,
  'corner-down-left': CornerDownLeft,
  'gamepad-2': Gamepad2,
  'calculator': Calculator,
  'message-circle': MessageCircle,
  'send': Send,
  'refresh-cw': RefreshCw,
  'rotate-cw': RotateCw,
  'shuffle': Shuffle,
  'check-circle': CheckCircle,
  'circle': Circle
};

export type IconName = keyof typeof iconComponents;

// USE the new type in our interface
interface IconProps extends LucideProps {
  name: IconName;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = iconComponents[name];

  if (!LucideIcon) {
    console.warn(`Icon component: icon with name "${name}" was not found.`);
    return null;
  }

  return <LucideIcon {...props} />;
};

export default Icon;