import { IUser } from '../core/interfaces/user.interface';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SALES_REP = 'SALES_REP',
  SALES_MANAGER = 'SALES_MANAGER',
  CD = 'CD',
  GMM = 'GMM',
  GPO_ANALYST = 'GPO_ANALYST',
  KEY_USER = 'KEY_USER',
  SALES_SUPPORT = 'SALES_SUPPORT',
  READER = 'READER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

export interface IUMUser extends IUser {
  username: string;
  status: UserStatus;
  created: string;
  updated: string;
}

export interface IUserCreateRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface IUserUpdateRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface IUserSearchParams {
  page?: number;
  page_size?: number;
  order?: string;
  firstName?: string;
  lastName?: string;
}
