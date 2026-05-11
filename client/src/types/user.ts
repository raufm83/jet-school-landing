import { Role } from "./enums";
import { PaginatedResponse } from "./general";

export interface User {
  id: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
  profile?: {
    avatarUrl?: string | null;
    profession?: string | { az?: string; ru?: string } | null;
  } | null;
}

export type UserResponse = PaginatedResponse<User>;
