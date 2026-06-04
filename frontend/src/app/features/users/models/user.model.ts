export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  department: string | null;
  jobTitle: string | null;
  isActive: boolean;
  role: RoleSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  isActive?: boolean;
  roleId?: string;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  roleId?: string;
  isActive?: boolean;
}
