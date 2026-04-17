import { Family } from '../models/Family';
import { FamilyLink } from '../models/FamilyLink';
import { Enrollment } from '../models/Enrollment';
import { ParentProfile } from '../models/Parent';
import { SalaryTransaction } from '../models/SalaryTransaction';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import { BusinessRuleService } from './businessRuleService';
import { hashPassword } from '../utils/password';

export class StudentService {
  private readonly businessRuleService = new BusinessRuleService();

  private async assertEnrollmentLinksMatch(payload: { classId: string; subjectId: string; teacherId: string }) {
    const [subject, teacher] = await Promise.all([
      Subject.findOne({ _id: payload.subjectId, isDeleted: false }).lean<any>(),
      User.findOne({ _id: payload.teacherId, role: 'teacher', isDeleted: false }).lean<any>()
    ]);

    if (!subject) {
      throw new Error('Selected subject does not exist');
    }

    if (String(subject.classId) !== String(payload.classId)) {
      throw new Error('Selected subject does not belong to the selected class');
    }

    if (!teacher) {
      throw new Error('Selected teacher does not exist');
    }

    const assignedSubjectIds = Array.isArray(teacher.assignedSubjects) ? teacher.assignedSubjects.map((item: any) => String(item)) : [];
    const assignedClassIds = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses.map((item: any) => String(item)) : [];
    const subjectTeacherMatches = subject.teacher ? String(subject.teacher) === String(teacher._id) : false;
    const teacherSubjectMatches = assignedSubjectIds.includes(String(subject._id));
    const teacherClassMatches = assignedClassIds.includes(String(payload.classId));

    if (!subjectTeacherMatches && !teacherSubjectMatches && !teacherClassMatches) {
      throw new Error('Selected teacher is not assigned to the selected subject');
    }
  }

  async registerStudent(data: any) {
    if (!data.classId || !data.subjectId || !data.teacherId) {
      throw new Error('classId, subjectId, and teacherId are required');
    }

    if (!data.gender) {
      throw new Error('Student gender is required');
    }

    await this.assertEnrollmentLinksMatch({
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId
    });
    await this.businessRuleService.assertStudentGenderMatchesClass(data.gender, data.classId);
    await this.businessRuleService.assertTeacherGenderMatchesClass(data.teacherId, data.classId);

    let family = await Family.findOne({ guardianPhone: data.familyPhone });
    let familyUser: any = null;

    if (!family) {
      const normalizedFatherName = String(data.fatherName || 'parent').toLowerCase().replace(/[^a-z0-9]/g, '') || 'parent';
      let familyEmail = `${normalizedFatherName}@nokta.academy`;
      let suffix = 1;
      while (await User.findOne({ email: familyEmail })) {
        familyEmail = `${normalizedFatherName}${suffix}@nokta.academy`;
        suffix += 1;
      }

      family = await Family.create({
        guardianName: data.fatherName,
        guardianEmail: familyEmail,
        guardianPhone: data.familyPhone,
        students: []
      });

      familyUser = await User.create({
        name: data.fatherName,
        email: familyEmail,
        phone: data.familyPhone,
        password: await hashPassword(`Parent@${String(data.familyPhone).slice(-8)}!`),
        role: 'parent',
        familyId: family._id,
        branchId: data.branchId ?? null,
        mustChangePassword: true
      });
    } else {
      familyUser = await User.findOne({ email: family.guardianEmail });
      if (!familyUser) {
        familyUser = await User.create({
          name: family.guardianName,
          email: family.guardianEmail,
          phone: family.guardianPhone,
          password: await hashPassword(`Parent@${String(family.guardianPhone).slice(-8)}!`),
          role: 'parent',
          familyId: family._id,
          branchId: data.branchId ?? null,
          mustChangePassword: true
        });
      }
    }

    let parentProfile = await ParentProfile.findOne({ userId: familyUser._id });
    if (!parentProfile) {
      parentProfile = await ParentProfile.create({
        userId: familyUser._id,
        branchId: data.branchId ?? null,
        guardianName: data.fatherName,
        guardianPhone: data.familyPhone,
        guardianEmail: family.guardianEmail,
        relationType: 'guardian',
        linkedStudentIds: []
      });
    }

    const studentId = this.generateStudentId();
    const rollNo = data.rollNo || await this.generateStudentRollNo();
    const registrationDate = data.registrationDate ? new Date(data.registrationDate) : new Date();
    const registrationExpiryDate = data.registrationExpiryDate
      ? new Date(data.registrationExpiryDate)
      : new Date(registrationDate.getFullYear(), registrationDate.getMonth() + 1, registrationDate.getDate());

    const student = await Student.create({
      rollNo,
      studentId,
      branchId: data.branchId ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName,
      familyPhone: data.familyPhone,
      familyEmail: family.guardianEmail,
      gender: data.gender,
      registrationDate,
      registrationExpiryDate,
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      feeAmount: data.feeAmount,
      paidAmount: data.paidAmount || 0,
      remainingBalance: data.feeAmount - (data.paidAmount || 0),
      familyId: family._id,
      parentProfileId: parentProfile._id
    });

    const studentEmail = `${studentId.toLowerCase()}@student.nokta.academy`;
    const studentUser = await User.create({
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: studentEmail,
      phone: data.familyPhone,
      password: await hashPassword(`Student@${studentId}!`),
      role: 'student',
      studentId,
      classId: data.classId,
      subjectId: data.subjectId,
      assignedTeacherId: data.teacherId,
      feeAmount: data.feeAmount,
      paidAmount: data.paidAmount || 0,
      remainingBalance: data.feeAmount - (data.paidAmount || 0),
      branchId: data.branchId ?? null,
      familyId: family._id,
      parentProfileId: parentProfile._id,
      gender: data.gender,
      fatherName: data.fatherName,
      mustChangePassword: true
    });

    await Promise.all([
      Family.findByIdAndUpdate(family._id, { $addToSet: { students: student._id } }),
      ParentProfile.findByIdAndUpdate(parentProfile._id, { $addToSet: { linkedStudentIds: student._id } }),
      FamilyLink.findOneAndUpdate(
        { parentId: parentProfile._id, studentId: student._id },
        { parentId: parentProfile._id, studentId: student._id, relationType: 'guardian', isPrimary: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      Enrollment.create({
        studentId: student._id,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        branchId: data.branchId ?? null,
        academicYear: `${registrationDate.getFullYear()}`,
        status: 'active',
        enrolledAt: registrationDate,
        registrationExpiryDate
      }),
      User.findByIdAndUpdate(familyUser._id, { parentProfileId: parentProfile._id, familyId: family._id }),
      User.findByIdAndUpdate(studentUser._id, { familyId: family._id, parentProfileId: parentProfile._id })
    ]);

    const teacher = await User.findById(data.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    let earnedAmount = 0;
    if (teacher.salaryType === 'percentage') {
      const percentage = teacher.customPercentage || teacher.percentageRate;
      earnedAmount = (data.feeAmount * percentage) / 100;
    }

    if (earnedAmount > 0) {
      await SalaryTransaction.create({
        teacherId: data.teacherId,
        studentId: student._id,
        subjectId: data.subjectId,
        classId: data.classId,
        feeAmount: data.feeAmount,
        percentage: teacher.customPercentage || teacher.percentageRate,
        earnedAmount
      });

      await User.findByIdAndUpdate(data.teacherId, {
        $inc: {
          walletBalance: earnedAmount,
          totalSalaryEarned: earnedAmount,
          totalStudents: 1
        }
      });
    }

    return student;
  }

  private async generateStudentRollNo() {
    const count = await Student.countDocuments();
    let rollNo = `STD-${count + 1}`;
    let attempt = 1;
    while (await Student.exists({ rollNo })) {
      rollNo = `STD-${count + 1 + attempt}`;
      attempt += 1;
    }
    return rollNo;
  }

  private generateStudentId() {
    return `S${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }

  async getStudentsByFamily(familyId: string) {
    return Student.find({ familyId, isDeleted: false })
      .populate('classId', 'className name classCode')
      .populate('subjectId', 'title code')
      .populate('teacherId', 'name email');
  }

  async getStudentsByTeacher(teacherId: string) {
    return Student.find({ teacherId, isDeleted: false })
      .populate('classId', 'className name classCode')
      .populate('subjectId', 'title code')
      .populate('teacherId', 'name email');
  }

  async updateStudent(id: string, data: any) {
    const student = await Student.findById(id);
    if (!student) {
      return null;
    }

    if (data.classId !== undefined || data.subjectId !== undefined || data.teacherId !== undefined || data.gender !== undefined) {
      const nextClassId = String(data.classId ?? student.classId);
      const nextSubjectId = String(data.subjectId ?? student.subjectId);
      const nextTeacherId = String(data.teacherId ?? student.teacherId);
      const nextGender = String(data.gender ?? student.gender);

      await this.assertEnrollmentLinksMatch({
        classId: nextClassId,
        subjectId: nextSubjectId,
        teacherId: nextTeacherId
      });
      await this.businessRuleService.assertStudentGenderMatchesClass(nextGender, nextClassId);
      await this.businessRuleService.assertTeacherGenderMatchesClass(nextTeacherId, nextClassId);
    }

    const updatedData: any = { ...data };
    if (data.feeAmount !== undefined || data.paidAmount !== undefined) {
      const fee = data.feeAmount !== undefined ? data.feeAmount : student.feeAmount;
      const paid = data.paidAmount !== undefined ? data.paidAmount : student.paidAmount;
      updatedData.remainingBalance = fee - paid;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    if (!updatedStudent) {
      return null;
    }

    await User.findOneAndUpdate(
      { studentId: updatedStudent.studentId, role: 'student', isDeleted: false },
      {
        $set: {
          name: `${updatedStudent.firstName} ${updatedStudent.lastName}`.trim(),
          firstName: updatedStudent.firstName,
          lastName: updatedStudent.lastName,
          phone: updatedStudent.familyPhone,
          classId: updatedStudent.classId,
          subjectId: updatedStudent.subjectId,
          assignedTeacherId: updatedStudent.teacherId,
          feeAmount: updatedStudent.feeAmount,
          paidAmount: updatedStudent.paidAmount,
          remainingBalance: updatedStudent.remainingBalance,
          branchId: updatedStudent.branchId ?? null,
          familyId: updatedStudent.familyId,
          parentProfileId: updatedStudent.parentProfileId ?? null,
          gender: updatedStudent.gender,
          fatherName: updatedStudent.fatherName,
          status: updatedStudent.status === 'graduated' ? 'inactive' : updatedStudent.status,
          active: updatedStudent.status === 'active'
        }
      }
    );

    await Promise.all([
      updatedStudent.familyId
        ? Family.findByIdAndUpdate(updatedStudent.familyId, {
            guardianName: updatedStudent.fatherName,
            guardianPhone: updatedStudent.familyPhone,
            guardianEmail: updatedStudent.familyEmail
          })
        : Promise.resolve(),
      updatedStudent.parentProfileId
        ? ParentProfile.findByIdAndUpdate(updatedStudent.parentProfileId, {
            guardianName: updatedStudent.fatherName,
            guardianPhone: updatedStudent.familyPhone,
            guardianEmail: updatedStudent.familyEmail,
            branchId: updatedStudent.branchId ?? null
          })
        : Promise.resolve(),
      User.findOneAndUpdate(
        { familyId: updatedStudent.familyId, role: 'parent', isDeleted: false },
        {
          $set: {
            name: updatedStudent.fatherName,
            phone: updatedStudent.familyPhone,
            branchId: updatedStudent.branchId ?? null,
            familyId: updatedStudent.familyId,
            parentProfileId: updatedStudent.parentProfileId ?? null
          }
        }
      )
    ]);

    await Enrollment.updateMany(
      { studentId: updatedStudent._id, isDeleted: false },
      {
        $set: {
          classId: updatedStudent.classId,
          subjectId: updatedStudent.subjectId,
          teacherId: updatedStudent.teacherId,
          branchId: updatedStudent.branchId ?? null,
          registrationExpiryDate: updatedStudent.registrationExpiryDate ?? null
        }
      }
    );

    return updatedStudent;
  }

  async deleteStudent(id: string, actorId?: string | null) {
    const student = await Student.findOne({ _id: id, isDeleted: false });
    if (!student) {
      return null;
    }

    const deletedAt = new Date();

    await Student.updateOne(
      { _id: student._id },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: actorId ?? null,
          status: 'inactive'
        }
      }
    );

    await User.updateOne(
      { studentId: student.studentId, role: 'student', isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: actorId ?? null,
          active: false,
          status: 'inactive'
        }
      }
    );

    await Enrollment.updateMany(
      { studentId: student._id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: actorId ?? null,
          status: 'cancelled'
        }
      }
    );

    await FamilyLink.updateMany(
      { studentId: student._id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: actorId ?? null
        }
      }
    );

    return student;
  }
}
