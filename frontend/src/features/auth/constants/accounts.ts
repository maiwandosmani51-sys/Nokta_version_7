export const accounts = {
  super_admin: {
    email: 'admin@gmail.com',
    password: '12345678',
    name: 'Super Admin'
  },
  admin: {
    email: 'admin1@nokta.com',
    password: 'Admin123!',
    name: 'Admin User'
  },
  branch_manager: {
    email: 'admin1@nokta.com',
    password: 'Admin123!',
    name: 'Branch Manager'
  },
  teacher: {
    email: 'teacher1@nokta.com',
    password: 'Teacher123!',
    name: 'Teacher User'
  },
  student: {
    email: 'student1@nokta.com',
    password: 'Student123!',
    name: 'Student User'
  },
  parent: {
    email: 'family1@nokta.com',
    password: 'Family123!',
    name: 'Parent User'
  },
  owner: {
    email: 'admin@gmail.com',
    password: '12345678',
    name: 'Owner View'
  }
} as const;

export type AccountRole = keyof typeof accounts;
