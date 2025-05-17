import { Request } from "express";
import { UserRole, Subscription, Resume, Payment } from "@prisma/client";

export interface RegisterUser {
  username: string;
  email: string;
  password: string;
}
export interface LoginUser {
  email: string;
  password: string;
}
export interface AuthenticatedRequest extends Request {
  user?: { id: number };
}
export interface User {
  id: number;
  username: string;
  email: string;
  cpf?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  email_verified_at?: Date | null;
  stripe_customer_id?: string | null;
  subscriptions: Subscription[];
  resumes: Resume[];
  payments: Payment[];
}
export interface UpdateUser {
  username?: string;
  email?: string;
  cpf?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  password?: string;
}
