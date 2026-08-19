interface MultilingualText {
  az: string;
  ru: string;
}

export interface TeamMember {
  id: string;
  name: MultilingualText;
  surname: MultilingualText;
  fullName: MultilingualText;
  imageUrl: string;
  bio: {
    az: string;
    ru: string;
  };
  order: number;
  createdAt: string;
  isActive: boolean;
  linkedinUrl?: string;
}

export interface TeamMemberFormInputs {
  name: MultilingualText;
  surname: MultilingualText;
  fullName?: MultilingualText;
  image: File[];
  bio: {
    az: string;
    ru: string;
  };
  linkedinUrl?: string;
}
export interface CourseTeacherAssignment {
  teacherId: string;
  courseId: string;
  position?: string;
  teacher: TeamMember;
}
export interface CourseTeacherRole {
  id: string;
  title: string;
  description: {
    az: string;
    ru: string;
  };
  courses: {
    course: {
      id: string;
      title: {
        az: string;
        ru: string;
      };
    };
    teacher: {
      id: string;
      fullName: MultilingualText;
      imageUrl: string;
      bio: {
        az: string;
        ru: string;
      };
    };
    position?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseTeacherAsMember {
  id: string;
  position: string | null;
  courseId: string;
  teacherId: string;
  courseTeacherId: string;
  createdAt: string;
  teacher: TeamMember;
  courseTeacher: CourseTeacherRole;
  imageUrl: string;
  fullName: MultilingualText;
  bio: {
    az: string;
    ru: string;
  };
}

export interface CourseTeacherResponse {
  items: CourseTeacherRole[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CourseTeacherFormInputs {
  title: string;
  description: {
    az: string;
    ru: string;
  };
}
