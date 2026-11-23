export interface Account {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
}

export interface WorkspacePage {
  page: number;
  pageSize: number;
  total: number;
  items: Workspace[];
}

export interface FieldErrors {
  [field: string]: string[];
}

export interface ApiFailure {
  error: {
    code: string;
    message: string;
    details?: { fields?: FieldErrors };
  };
}
