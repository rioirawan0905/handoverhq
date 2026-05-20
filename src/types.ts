export type UserRole = 'admin' | 'member' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: any;
}

export type HandoverStatus = 'pending' | 'in progress' | 'done';

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
  createdAt: any;
  updatedAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
}
