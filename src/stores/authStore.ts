import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Teacher = {
  id: number;
  phoneNumber: string;
  name: string;
};

type Parent = {
  id: number;
  phoneNumber: string;
  name: string;
  children?: {
    id: number;
    name: string;
    schoolName: string;
    grade: string;
    className: string;
  }[];
};

type UserRole = "teacher" | "parent";

type AuthStore = {
  authToken: string | null;
  userRole: UserRole | null;
  teacher: Teacher | null;
  parent: Parent | null;
  isAuthenticated: boolean;
  setTeacherAuth: (token: string, teacher: Teacher) => void;
  setParentAuth: (token: string, parent: Parent) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      authToken: null,
      userRole: null,
      teacher: null,
      parent: null,
      isAuthenticated: false,
      setTeacherAuth: (token: string, teacher: Teacher) => 
        set({ 
          authToken: token, 
          userRole: "teacher",
          teacher, 
          parent: null,
          isAuthenticated: true 
        }),
      setParentAuth: (token: string, parent: Parent) => 
        set({ 
          authToken: token, 
          userRole: "parent",
          parent, 
          teacher: null,
          isAuthenticated: true 
        }),
      logout: () => 
        set({ 
          authToken: null, 
          userRole: null,
          teacher: null, 
          parent: null,
          isAuthenticated: false 
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
