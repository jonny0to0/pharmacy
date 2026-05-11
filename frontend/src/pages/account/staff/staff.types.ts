export interface StaffMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  isActive: boolean;
  employeeId?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  joinDate?: string;
  salary?: number;
  workShift?: string;
  reportingManagerId?: string;
  createdAt: string;
}
