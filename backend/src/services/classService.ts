import { ClassRepository } from '../database/repositories/classRepository';
import { TeacherRepository } from '../database/repositories/teacherRepository';
import { AuditLog } from '../models/AuditLog';
import { ClassModel } from '../models/Class';
import { Notification } from '../models/Notification';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { User } from '../models/User';

interface ClassPayload {
  branchId?: string;
  className?: string;
  classCode?: string;
  genderRestriction?: 'male' | 'female' | 'coed';
  feeAmount?: number;
  subjects?: Array<string | { name: string }>;
  assignedTeachers?: string[];
  capacity?: number;
  examSchedule?: string[] | Date[];
  studentCount?: number;
  active?: boolean;
}

export class ClassService {
  private classRepository = new ClassRepository();
  private teacherRepository = new TeacherRepository();

  private normalizeSubjectNames(subjects?: Array<string | { name: string }>) {
    return Array.isArray(subjects)
      ? Array.from(new Set(subjects
          .map((subject) => {
            if (typeof subject === 'string') return subject;
            if (subject && typeof subject === 'object') return String((subject as any).name || '');
            return '';
          })
          .map((name) => name.trim())
          .filter(Boolean)))
      : [];
  }

  private normalizeTeacherIds(teacherIds?: string[]) {
    return Array.isArray(teacherIds)
      ? Array.from(new Set(teacherIds.map(String).filter(Boolean)))
      : [];
  }

  private async validateTeacherAssignments(teacherIds: string[], genderRestriction?: 'male' | 'female' | 'coed') {
    if (!teacherIds.length) {
      return [];
    }

    const teachers = await this.teacherRepository.validateManyByIds(teacherIds);
    if (teachers.length !== teacherIds.length) {
      throw new Error('One or more assigned teachers are invalid');
    }

    if (genderRestriction && genderRestriction !== 'coed') {
      const mismatchedTeacher = teachers.find((teacher: any) => teacher.gender && teacher.gender !== genderRestriction);
      if (mismatchedTeacher) {
        throw new Error('Teacher gender must match class policy');
      }
    }

    return teachers;
  }

  private async generateNextClassCode() {
    const year = new Date().getFullYear();
    const prefix = `CLS-${year}-`;
    let index = await this.classRepository.countClassCodesWithPrefix(prefix);
    index += 1;

    while (true) {
      const classCode = `CLS-${year}-${String(index).padStart(4, '0')}`;
      const exists = await this.classRepository.findByCode(classCode);
      if (!exists) return classCode;
      index += 1;
    }
  }

  private async generateNextSubjectCode(subjectName: string, className: string) {
    const subjectPrefix = String(subjectName).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'SUB';
    const classPrefix = String(className).replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'CLS';
    let index = await Subject.countDocuments({ code: new RegExp(`^${subjectPrefix}-${classPrefix}-`) });
    index += 1;

    let code = `${subjectPrefix}-${classPrefix}-${String(index).padStart(2, '0')}`;
    while (await Subject.exists({ code })) {
      index += 1;
      code = `${subjectPrefix}-${classPrefix}-${String(index).padStart(2, '0')}`;
    }

    return code;
  }

  private async syncTeacherAssignments(classId: string, nextTeacherIds: string[], previousTeacherIds: string[] = []) {
    const removedTeacherIds = previousTeacherIds.filter((teacherId) => !nextTeacherIds.includes(String(teacherId)));
    if (removedTeacherIds.length) {
      await User.updateMany(
        { _id: { $in: removedTeacherIds }, role: 'teacher' },
        { $pull: { assignedClasses: classId } }
      );
    }

    if (nextTeacherIds.length) {
      await this.teacherRepository.assignClassToTeachers(classId, nextTeacherIds);
    }
  }

  private async syncSubjectsForClass(klass: any, subjectNames: string[], actorId: string) {
    if (!subjectNames.length) {
      throw new Error('At least one subject is required');
    }

    const existingSubjects = await Subject.find({ classId: klass._id, isDeleted: false }).lean<any[]>();
    const subjectMap = new Map(existingSubjects.map((subject) => [String(subject.title).trim().toLowerCase(), subject]));
    const nextSubjectIds: string[] = [];

    for (const title of subjectNames) {
      const key = title.toLowerCase();
      const existingSubject = subjectMap.get(key);

      if (existingSubject) {
        if (existingSubject.title !== title) {
          await Subject.updateOne({ _id: existingSubject._id }, { $set: { title } });
        }
        nextSubjectIds.push(String(existingSubject._id));
        continue;
      }

      const subject = await Subject.create({
        branchId: klass.branchId ?? null,
        title,
        code: await this.generateNextSubjectCode(title, klass.className),
        classId: klass._id,
        feeAmount: 0,
        activeStatus: true
      });

      nextSubjectIds.push(String(subject._id));
    }

    klass.assignedSubjects = nextSubjectIds;
    await klass.save();

    await AuditLog.create({
      actor: actorId,
      action: 'CLASS_SUBJECTS_SYNCED',
      target: String(klass._id),
      metadata: {
        className: klass.className,
        subjects: subjectNames
      }
    });
  }

  async createClass(payload: ClassPayload, actorId: string) {
    try {
      const className = String(payload.className || '').trim();
      if (!className) {
        throw new Error('className is required');
      }

      const existingClass = await this.classRepository.findByName(className);
      if (existingClass) {
        throw new Error('Class name already exists');
      }

      const subjectNames = this.normalizeSubjectNames(payload.subjects);
      const teacherIds = this.normalizeTeacherIds(payload.assignedTeachers);
      await this.validateTeacherAssignments(teacherIds, payload.genderRestriction);

      const classCode = payload.classCode?.trim() || await this.generateNextClassCode();
      if (payload.classCode) {
        const existingCode = await this.classRepository.findByCode(classCode);
        if (existingCode) {
          throw new Error('Class code already exists');
        }
      }

      const klass = await this.classRepository.create({
        branchId: payload.branchId ?? null,
        className,
        classCode,
        genderRestriction: payload.genderRestriction ?? 'coed',
        feeAmount: Number(payload.feeAmount ?? 0),
        assignedTeachers: teacherIds,
        capacity: payload.capacity ?? 30,
        examSchedule: Array.isArray(payload.examSchedule) ? payload.examSchedule : [],
        studentCount: payload.studentCount ?? 0,
        active: true
      });

      await this.syncSubjectsForClass(klass, subjectNames, actorId);
      await this.syncTeacherAssignments(String(klass._id), teacherIds);

      await AuditLog.create({
        actor: actorId,
        action: 'CLASS_CREATED',
        target: String(klass._id),
        metadata: {
          className,
          classCode,
          feeAmount: Number(payload.feeAmount ?? 0),
          subjects: subjectNames,
          assignedTeachers: teacherIds
        }
      });

      if (teacherIds.length) {
        await Notification.create({
          title: 'New class assigned',
          description: `A new class "${className}" has been assigned to you.`,
          message: `A new class "${className}" has been assigned to you.`,
          recipientRoles: ['teacher'],
          recipientIds: teacherIds,
          readBy: [],
          publishStatus: 'published',
          publishDate: new Date()
        });
      }

      return klass;
    } catch (error: any) {
      console.error('[CLASS CREATE ERROR]', error?.message || error);
      throw error;
    }
  }

  async updateClass(classId: string, payload: ClassPayload, actorId: string) {
    const klass = await ClassModel.findOne({ _id: classId, isDeleted: false });
    if (!klass) {
      throw new Error('Class not found');
    }

    if (payload.className) {
      const nextClassName = String(payload.className).trim();
      const existingClass = await ClassModel.findOne({
        className: nextClassName,
        _id: { $ne: klass._id },
        isDeleted: false
      }).lean();

      if (existingClass) {
        throw new Error('Class name already exists');
      }

      klass.className = nextClassName;
      klass.name = nextClassName;
    }

    if (payload.classCode) {
      const nextClassCode = String(payload.classCode).trim();
      const existingCode = await ClassModel.findOne({
        classCode: nextClassCode,
        _id: { $ne: klass._id },
        isDeleted: false
      }).lean();

      if (existingCode) {
        throw new Error('Class code already exists');
      }

      klass.classCode = nextClassCode;
    }

    const nextGenderRestriction = payload.genderRestriction ?? (klass.genderRestriction as any);
    const nextTeacherIds = payload.assignedTeachers !== undefined
      ? this.normalizeTeacherIds(payload.assignedTeachers)
      : (Array.isArray(klass.assignedTeachers) ? klass.assignedTeachers.map((item: any) => String(item)) : []);

    await this.validateTeacherAssignments(nextTeacherIds, nextGenderRestriction);

    if (payload.branchId !== undefined) klass.branchId = payload.branchId ?? null;
    if (payload.genderRestriction !== undefined) klass.genderRestriction = payload.genderRestriction;
    if (payload.feeAmount !== undefined) klass.feeAmount = Number(payload.feeAmount ?? 0);
    if (payload.capacity !== undefined) klass.capacity = Number(payload.capacity ?? 30);
    if (payload.examSchedule !== undefined) klass.examSchedule = Array.isArray(payload.examSchedule) ? payload.examSchedule as any : [];
    if (payload.active !== undefined) klass.active = payload.active;
    if (payload.studentCount !== undefined) klass.studentCount = Number(payload.studentCount ?? klass.studentCount ?? 0);

    const previousTeacherIds = Array.isArray(klass.assignedTeachers) ? klass.assignedTeachers.map((item: any) => String(item)) : [];
    klass.assignedTeachers = nextTeacherIds as any;
    await klass.save();

    if (payload.subjects !== undefined) {
      const subjectNames = this.normalizeSubjectNames(payload.subjects);
      await this.syncSubjectsForClass(klass, subjectNames, actorId);
    }

    await this.syncTeacherAssignments(String(klass._id), nextTeacherIds, previousTeacherIds);

    await AuditLog.create({
      actor: actorId,
      action: 'CLASS_UPDATED',
      target: String(klass._id),
      metadata: {
        className: klass.className,
        classCode: klass.classCode,
        assignedTeachers: nextTeacherIds
      }
    });

    return klass;
  }

  async deleteClass(classId: string, actorId: string) {
    const klass = await ClassModel.findOne({ _id: classId, isDeleted: false });
    if (!klass) {
      throw new Error('Class not found');
    }

    const activeStudents = await Student.countDocuments({ classId: klass._id, isDeleted: false });
    if (activeStudents > 0) {
      throw new Error('Cannot delete a class with active students');
    }

    const deletedAt = new Date();
    const teacherIds = Array.isArray(klass.assignedTeachers) ? klass.assignedTeachers.map((item: any) => String(item)) : [];

    await this.syncTeacherAssignments(String(klass._id), [], teacherIds);

    await Subject.updateMany(
      { classId: klass._id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: actorId ?? null,
          activeStatus: false
        }
      }
    );

    klass.isDeleted = true;
    klass.deletedAt = deletedAt;
    klass.deletedBy = actorId as any;
    klass.active = false;
    await klass.save();

    await AuditLog.create({
      actor: actorId,
      action: 'CLASS_DELETED',
      target: String(klass._id),
      metadata: {
        className: klass.className,
        classCode: klass.classCode
      }
    });

    return klass;
  }
}
