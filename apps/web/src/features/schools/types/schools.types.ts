export type CreateSchoolInput = {
  name: string;
  abbreviation: string;
  active: boolean;
};

export type UpdateSchoolInput = {
  name: string;
  abbreviation: string;
  active: boolean;
};

export type SchoolListItem = {
  id: string;
  name: string;
  abbreviation?: string | null;
  active?: boolean;
};

export type SchoolClassListItem = {
  id: string;
  school_id: string;
};

export type SchoolTeacherListItem = {
  id: string;
  school_id: string;
};

export type SchoolCardRow = {
  id: string;
  abbreviation: string;
  name: string;
  classCount: number;
  teacherCount: number;
  active: boolean;
};
