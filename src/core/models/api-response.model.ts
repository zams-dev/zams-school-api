export class ApiResponseModel<T> {
  data: T;
  message?: string;
  success?: boolean;
}


export class PageAccess {
  page?: string;
  view?: boolean;
  modify?: boolean;
  rights: [];
}