export interface User {
  id: string;
  cognito_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}