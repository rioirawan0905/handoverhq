export type UserRole = 'admin' | 'member' | 'viewer';
export type AppTheme = 'slate' | 'obsidian' | 'midnight' | 'ocean';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  themePreference?: AppTheme;
  createdAt: any;
}

export type HandoverStatus = 'routine' | 'urgent';
export type SubTaskStatus = 'in-progress' | 'delayed' | 'done';

export interface SubTask {
  id: string;
  title: string;
  dueDate: string;
  status: SubTaskStatus;
}

export interface Personnel {
  name: string;
  title: string;
  email: string;
}

export interface Handover {
  id: string;
  title: string;
  content: string;
  status: HandoverStatus;
  dueDate: string | null;
  creatorId: string;
  creatorEmail: string;
  assignees: string[];
  remarks: string;
  outgoingPersonnel?: Personnel;
  incomingPersonnel?: Personnel;
  subTasks: SubTask[];
  createdAt: any;
  updatedAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title?: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
}
