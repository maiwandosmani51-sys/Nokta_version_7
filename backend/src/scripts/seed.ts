import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { connectDatabase } from '../database/connect';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { ClassModel as Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Exam } from '../models/Exam';
import { Result } from '../models/Result';
import { Family } from '../models/Family';
import { Expense } from '../models/Expense';
import { Book } from '../models/Book';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { SalaryTransaction } from '../models/SalaryTransaction';

const ACCOUNT_FILE_PATH = path.resolve(process.cwd(), '..', 'account', 'accounts.md');

const SUBJECT_TITLES = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
  'Social Studies',
  'Islamic Studies',
  'Economics',
  'Accounting',
  'Civics',
  'Persian',
  'Arabic',
  'Environmental Science',
  'Health Education',
  'Programming',
  'Design',
  'Literature'
];

async function clearDatabase() {
  console.log('Deleting all data...');
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    Exam.deleteMany({}),
    Result.deleteMany({}),
    Family.deleteMany({}),
    Expense.deleteMany({}),
    Book.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    SalaryTransaction.deleteMany({})
  ]);
  console.log('All data deleted.');
}

async function createSuperAdmin() {
  console.log('Creating super admin...');
  const hashedPassword = await bcrypt.hash('12345678', 10);
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@gmail.com',
    password: hashedPassword,
    role: 'super_admin'
  });
  console.log('Super admin created.');
  return superAdmin;
}

async function createUserAccounts(accounts: { [key: string]: { name: string; email: string; password: string; role: string }[] }) {
  console.log('Creating user accounts...');
  const teachers: any[] = [];
  const students: any[] = [];
  const familyStudents: any[] = [];
  const admins: any[] = [];
  const accountants: any[] = [];
  const librarians: any[] = [];

  for (let i = 1; i <= 5; i++) {
    const name = faker.person.fullName();
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await User.create({
      name,
      email: `admin${i}@nokta.com`,
      password: hashedPassword,
      role: 'admin'
    });
    admins.push(user);
    accounts.admin.push({ name, email: user.email, password: 'Admin123!', role: 'admin' });
  }

  for (let i = 1; i <= 30; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const hashedPassword = await bcrypt.hash('Teacher123!', 10);
    const salaryType = faker.helpers.arrayElement(['fixed', 'percentage']);
    const salaryValue = salaryType === 'fixed' ? faker.number.int({ min: 8000, max: 25000 }) : faker.number.int({ min: 10, max: 35 });
    const user = await User.create({
      name,
      email: `teacher${i}@nokta.com`,
      password: hashedPassword,
      role: 'teacher',
      teacherId: `TCHR-${String(i).padStart(3, '0')}`,
      firstName,
      lastName,
      phone: faker.phone.number(),
      whatsapp: faker.phone.number(),
      salaryType,
      fixedSalary: salaryType === 'fixed' ? salaryValue : 0,
      percentageRate: salaryType === 'percentage' ? salaryValue : 35,
      assignedSubjects: [],
      assignedClasses: []
    });
    teachers.push(user);
    accounts.teacher.push({ name, email: user.email, password: 'Teacher123!', role: 'teacher' });
  }

  for (let i = 1; i <= 300; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const hashedPassword = await bcrypt.hash('Student123!', 10);
    const user = await User.create({
      name,
      email: `student${i}@nokta.com`,
      password: hashedPassword,
      role: 'student',
      studentId: `STD-${String(i).padStart(4, '0')}`,
      status: 'active'
    });
    students.push(user);
    accounts.student.push({ name, email: user.email, password: 'Student123!', role: 'student' });
  }

  for (let i = 1; i <= 50; i++) {
    const name = faker.person.fullName();
    const hashedPassword = await bcrypt.hash('Family123!', 10);
    const user = await User.create({
      name,
      email: `family${i}@nokta.com`,
      password: hashedPassword,
      role: 'family_student'
    });
    familyStudents.push(user);
    accounts.family_student.push({ name, email: user.email, password: 'Family123!', role: 'family_student' });
  }

  for (let i = 1; i <= 5; i++) {
    const name = faker.person.fullName();
    const hashedPassword = await bcrypt.hash('Accountant123!', 10);
    const user = await User.create({
      name,
      email: `accountant${i}@nokta.com`,
      password: hashedPassword,
      role: 'accountant'
    });
    accountants.push(user);
    accounts.accountant.push({ name, email: user.email, password: 'Accountant123!', role: 'accountant' });
  }

  for (let i = 1; i <= 5; i++) {
    const name = faker.person.fullName();
    const hashedPassword = await bcrypt.hash('Librarian123!', 10);
    const user = await User.create({
      name,
      email: `librarian${i}@nokta.com`,
      password: hashedPassword,
      role: 'librarian'
    });
    librarians.push(user);
    accounts.librarian.push({ name, email: user.email, password: 'Librarian123!', role: 'librarian' });
  }

  console.log('User accounts created.');
  return { admins, teachers, students, familyStudents, accountants, librarians };
}

function chooseRandomSubjectTitles(count: number) {
  return faker.helpers.arrayElements(SUBJECT_TITLES, count).map((title) => ({
    title,
    code: `${title.substring(0, 3).toUpperCase()}-${faker.number.int({ min: 100, max: 999 })}`
  }));
}

async function createClassesAndSubjects(teachers: any[]) {
  console.log('Creating classes and subjects...');
  const classes: any[] = [];
  const subjects: any[] = [];
  const teacherAssignments: Record<string, { subjectIds: mongoose.Types.ObjectId[]; classIds: mongoose.Types.ObjectId[] }> = {};

  const teacherQueue = [...teachers];
  faker.helpers.shuffle(teacherQueue);

  for (let i = 1; i <= 10; i++) {
    const className = `Class ${i}`;
    const subjectCount = faker.number.int({ min: 3, max: 5 });
    const classSubjects: any[] = [];
    const assignedTeacherIds = new Set<string>();

    const classData = await Class.create({
      className,
      name: className,
      assignedSubjects: [],
      assignedTeachers: [],
      capacity: 40
    });

    const subjectEntries = chooseRandomSubjectTitles(subjectCount);
    for (const [subjectIndex, subjectEntry] of subjectEntries.entries()) {
      const teacher = teacherQueue.length > 0 ? teacherQueue.shift()! : faker.helpers.arrayElement(teachers);
      const subject = await Subject.create({
        title: subjectEntry.title,
        code: `SUB-${i}-${subjectIndex + 1}-${faker.number.int({ min: 100, max: 999 })}`,
        classId: classData._id,
        feeAmount: faker.number.int({ min: 1200, max: 4500 }),
        teacher: teacher._id,
        description: faker.lorem.sentence()
      });
      classSubjects.push(subject);
      assignedTeacherIds.add(teacher._id.toString());
      subjects.push(subject);

      if (!teacherAssignments[teacher._id.toString()]) {
        teacherAssignments[teacher._id.toString()] = { subjectIds: [], classIds: [] };
      }
      teacherAssignments[teacher._id.toString()].subjectIds.push(subject._id);
      teacherAssignments[teacher._id.toString()].classIds.push(classData._id);
    }

    classData.assignedSubjects = classSubjects.map((subject) => subject._id);
    classData.assignedTeachers = Array.from(assignedTeacherIds);
    await classData.save();
    classes.push(classData);
  }

  await Promise.all(
    teachers.map((teacher) => {
      const assignment = teacherAssignments[teacher._id.toString()] ?? { subjectIds: [], classIds: [] };
      return User.findByIdAndUpdate(teacher._id, {
        assignedSubjects: Array.from(new Set(assignment.subjectIds.map(String))).map((id) => new mongoose.Types.ObjectId(id)),
        assignedClasses: Array.from(new Set(assignment.classIds.map(String))).map((id) => new mongoose.Types.ObjectId(id))
      });
    })
  );

  console.log('Classes and subjects created.');
  return { classes, subjects };
}

async function createFamilies(count: number) {
  const families: any[] = [];
  for (let i = 0; i < count; i++) {
    const family = await Family.create({
      guardianName: faker.person.fullName(),
      guardianEmail: faker.internet.email(),
      guardianPhone: faker.phone.number(),
      students: [],
      notes: faker.lorem.sentence()
    });
    families.push(family);
  }
  return families;
}

async function createStudentsAndFamilies(students: any[], classes: any[]) {
  console.log('Creating student profiles and families...');
  const families = await createFamilies(Math.ceil(students.length / 3));

  let studentIndex = 0;
  const studentDocs: any[] = [];

  for (const classData of classes) {
    const classSubjects = await Subject.find({ classId: classData._id });
    const countPerClass = Math.ceil(students.length / classes.length);

    for (let i = 0; i < countPerClass && studentIndex < students.length; i++) {
      const student = students[studentIndex];
      const family = faker.helpers.arrayElement(families);
      const subject = faker.helpers.arrayElement(classSubjects);
      const feeAmount = faker.number.int({ min: 5000, max: 20000 });
      const paidAmount = faker.number.int({ min: Math.floor(feeAmount * 0.4), max: feeAmount });
      const studentDoc = await Student.create({
        rollNo: `STD-${studentIndex + 1}`,
        studentId: student.studentId ?? `STD-${studentIndex + 1}`,
        firstName: student.firstName || student.name.split(' ')[0],
        lastName: student.lastName || student.name.split(' ').slice(1).join(' '),
        fatherName: faker.person.fullName(),
        familyPhone: faker.phone.number(),
        classId: classData._id,
        subjectId: subject._id,
        teacherId: subject.teacher,
        feeAmount,
        paidAmount,
        familyId: family._id
      });

      family.students.push(studentDoc._id);
      await User.findByIdAndUpdate(student._id, {
        classId: classData._id,
        subjectId: subject._id,
        assignedTeacherId: subject.teacher,
        feeAmount,
        paidAmount,
        remainingBalance: feeAmount - paidAmount
      });

      studentDocs.push(studentDoc);
      studentIndex += 1;
    }
  }

  await Promise.all(families.map((family) => family.save()));

  console.log('Students and families created.');
  return { families, studentDocs };
}

async function createExams(subjects: any[]) {
  console.log('Creating exams...');
  const exams: any[] = [];

  for (let i = 1; i <= 20; i++) {
    const subject = faker.helpers.arrayElement(subjects);
    const exam = await Exam.create({
      title: `Midterm ${i} - ${subject.title}`,
      subject: subject._id,
      class: subject.classId,
      teacherId: subject.teacher,
      date: faker.date.future(),
      totalMarks: 100,
      passingMarks: 40,
      examType: 'midterm',
      examCode: `EXM-${String(i).padStart(3, '0')}`
    });
    exams.push(exam);
  }

  console.log('Exams created.');
  return exams;
}

async function createResults(exams: any[], teachers: any[]) {
  console.log('Creating results...');
  const results: any[] = [];

  for (const exam of exams) {
    const studentsForClass = await Student.find({ classId: exam.class, subjectId: exam.subject })
      .select('studentId')
      .lean();
    const studentUsers = await User.find({
      role: 'student',
      studentId: { $in: studentsForClass.map((student) => student.studentId).filter(Boolean) }
    })
      .select('_id studentId')
      .lean();
    const studentUserMap = new Map(studentUsers.map((studentUser: any) => [studentUser.studentId, studentUser._id]));

    for (const student of studentsForClass) {
      const studentUserId = studentUserMap.get(student.studentId);
      if (!studentUserId) {
        continue;
      }

      const score = faker.number.int({ min: 0, max: 100 });
      let grade = 'F';
      if (score >= 90) grade = 'A';
      else if (score >= 80) grade = 'B';
      else if (score >= 70) grade = 'C';
      else if (score >= 60) grade = 'D';
      else if (score >= 40) grade = 'E';
      const remarks = score >= 40 ? 'Pass' : 'Fail';
      const result = await Result.create({
        student: studentUserId,
        exam: exam._id,
        score,
        grade,
        remarks,
        gradedBy: faker.helpers.arrayElement(teachers)._id
      });
      results.push(result);
    }
  }

  console.log('Results created.');
  return results;
}

async function createFinanceAndSupportData(teachers: any[], classes: any[]) {
  console.log('Creating finance and support data...');
  const expenses: any[] = [];
  const books: any[] = [];
  const notifications: any[] = [];
  const auditLogs: any[] = [];
  const salaryTransactions: any[] = [];
  const financeActor = await User.findOne({ role: { $in: ['super_admin', 'admin', 'accountant'] } });

  for (const teacher of teachers) {
    const teacherIds = classes
      .filter((klass) => klass.assignedTeachers?.map((id: any) => id.toString()).includes(teacher._id.toString()))
      .map((klass) => klass._id);
    const salary = teacherIds.length * 600;
    const expense = await Expense.create({
      title: `Teacher salary - ${teacher.name}`,
      amount: salary,
      category: 'Salary',
      date: new Date(),
      createdBy: teacher._id,
      notes: `Salary expense for ${teacher.name}`
    });
    expenses.push(expense);
  }

  for (let offset = 5; offset >= 0; offset -= 1) {
    const incomeDate = new Date();
    incomeDate.setMonth(incomeDate.getMonth() - offset);
    incomeDate.setDate(15);

    const income = await Expense.create({
      title: `Tuition income - ${incomeDate.toLocaleString('en', { month: 'long', year: 'numeric' })}`,
      amount: faker.number.int({ min: 180000, max: 235000 }),
      category: 'income',
      date: incomeDate,
      createdBy: financeActor?._id,
      notes: 'Seeded monthly tuition income'
    });
    expenses.push(income);
  }

  const supportExpenseTemplates = [
    { title: 'Campus utilities', category: 'Utilities', monthOffset: 2, amountRange: { min: 2500, max: 4500 } },
    { title: 'Learning supplies', category: 'Supplies', monthOffset: 1, amountRange: { min: 2200, max: 4200 } },
    { title: 'Maintenance', category: 'Maintenance', monthOffset: 0, amountRange: { min: 3000, max: 5200 } }
  ];

  for (const template of supportExpenseTemplates) {
    const expenseDate = new Date();
    expenseDate.setMonth(expenseDate.getMonth() - template.monthOffset);
    expenseDate.setDate(10);

    const supportExpense = await Expense.create({
      title: `${template.title} - ${expenseDate.toLocaleString('en', { month: 'long', year: 'numeric' })}`,
      amount: faker.number.int(template.amountRange),
      category: template.category,
      date: expenseDate,
      createdBy: financeActor?._id,
      notes: 'Seeded operational expense'
    });
    expenses.push(supportExpense);
  }

  for (let i = 1; i <= 10; i++) {
    const book = await Book.create({
      title: faker.lorem.words(3),
      author: faker.person.fullName(),
      isbn: `ISBN-${faker.number.int({ min: 1000000000, max: 9999999999 })}`,
      available: faker.datatype.boolean(),
      category: faker.lorem.word()
    });
    books.push(book);
  }

  const roles = ['admin', 'teacher', 'student', 'family_student', 'accountant', 'librarian'];
  for (let i = 0; i < 10; i++) {
    const recipients = faker.helpers.arrayElements(roles, 2);
    const notification = await Notification.create({
      title: `System alert ${i + 1}`,
      description: faker.lorem.sentence(),
      message: faker.lorem.sentence(),
      recipientRoles: recipients,
      recipientIds: [],
      readBy: [],
      metadata: { priority: faker.helpers.arrayElement(['low', 'medium', 'high']) },
      publishStatus: 'published',
      publishDate: new Date()
    });
    notifications.push(notification);
  }

  const recentUser = await User.findOne({ role: 'admin' });
  if (recentUser) {
    for (let i = 1; i <= 5; i++) {
      const auditLog = await AuditLog.create({
        actor: recentUser._id,
        action: `Seed event ${i}`,
        target: `System seed record ${i}`,
        metadata: { type: 'seed' }
      });
      auditLogs.push(auditLog);
    }
  }

  console.log('Finance and support data created.');
  return { expenses, books, notifications, auditLogs, salaryTransactions };
}

function generateAccountsFile(accounts: { [key: string]: { name: string; email: string; password: string; role: string }[] }) {
  console.log('Generating accounts file...');
  let content = '# System Accounts\n\n';

  content += '## Super Admin\n';
  accounts.super_admin.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Admins\n';
  accounts.admin.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Teachers\n';
  accounts.teacher.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Students\n';
  accounts.student.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Family Students\n';
  accounts.family_student.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Accountants\n';
  accounts.accountant.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  content += '## Librarians\n';
  accounts.librarian.forEach((acc) => {
    content += `Name: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role}\n\n`;
  });

  const dir = path.dirname(ACCOUNT_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(ACCOUNT_FILE_PATH, content, 'utf8');
  console.log('Accounts file generated.');
}

async function seedDatabase() {
  try {
    await connectDatabase();
    console.log('Connected to database.');

    await clearDatabase();

    const accounts: { [key: string]: { name: string; email: string; password: string; role: string }[] } = {
      super_admin: [],
      admin: [],
      teacher: [],
      student: [],
      family_student: [],
      accountant: [],
      librarian: []
    };

    const superAdmin = await createSuperAdmin();
    accounts.super_admin.push({ name: superAdmin.name, email: superAdmin.email, password: '12345678', role: 'super_admin' });

    const { teachers, students } = await createUserAccounts(accounts);
    const { classes, subjects } = await createClassesAndSubjects(teachers);
    const { families } = await createStudentsAndFamilies(students, classes);
    const exams = await createExams(subjects);
    await createResults(exams, teachers);
    await createFinanceAndSupportData(teachers, classes);

    generateAccountsFile(accounts);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
