import { api } from "@/lib/api";
import type { ApiResponse, User } from "@/types";

interface AuthSuccess {
  user: User;
  token: string;
}

export const authApi = {
  register: async (input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthSuccess> => {
    const { data } = await api.post<ApiResponse<AuthSuccess>>(
      "/auth/register",
      input
    );
    return data.data;
  },

  login: async (input: {
    email: string;
    password: string;
  }): Promise<AuthSuccess> => {
    const { data } = await api.post<ApiResponse<AuthSuccess>>(
      "/auth/login",
      input
    );
    return data.data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<{ user: User }>>("/auth/me");
    return data.data.user;
  },
};
