export interface UserProfile {
  id:          string;
  email:       string;
  firstName:   string;
  lastName:    string;
  role:        string;
  phoneNumber: string | null;
  department:  string | null;
  jobTitle:    string | null;
}
