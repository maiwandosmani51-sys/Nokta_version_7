import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { authService } from '@/features/auth/services/authService';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { getRoleFallbackImage } from '@/utils/profileImage';
import { useTheme } from '@/app/providers/ThemeProvider';

interface RegistrationOptionsResponse {
  classes: Array<{ _id: string; className: string; classCode: string; branchId?: string | null; feeAmount?: number }>;
  subjects: Array<{ _id: string; title: string; classId: string; code: string; teacherId?: string | null; feeAmount?: number }>;
  teachers: Array<{ _id: string; name: string; email: string }>;
}

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId')?.trim() ?? '';
  const subjectIdParam = searchParams.get('subjectId')?.trim() ?? '';
  const teacherIdParam = searchParams.get('teacherId')?.trim() ?? '';
  const sourceTitle = searchParams.get('sourceTitle')?.trim() ?? '';
  const sourceType = searchParams.get('sourceType')?.trim() ?? '';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    gender: '',
    password: '',
    confirmPassword: '',
    classId: classIdParam,
    subjectId: subjectIdParam,
    teacherId: teacherIdParam
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(getRoleFallbackImage('student'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: options, isLoading } = useQuery({
    queryKey: ['registration-options', formData.classId, formData.subjectId],
    queryFn: () => authService.getRegistrationOptions({ classId: formData.classId || undefined, subjectId: formData.subjectId || undefined }),
    select: (response) => response.data as RegistrationOptionsResponse
  });

  const locale = useMemo(() => {
    if (i18n.resolvedLanguage === 'fa') return 'fa-AF';
    if (i18n.resolvedLanguage === 'ps') return 'ps-AF';
    return 'en-US';
  }, [i18n.resolvedLanguage]);

  const filteredSubjects = useMemo(
    () => (options?.subjects ?? []).filter((subject) => !formData.classId || subject.classId === formData.classId),
    [options?.subjects, formData.classId]
  );

  const linkedTeachers = useMemo(() => {
    if (!formData.subjectId) return options?.teachers ?? [];
    const subject = (options?.subjects ?? []).find((item) => item._id === formData.subjectId);
    if (!subject?.teacherId) return options?.teachers ?? [];
    return (options?.teachers ?? []).filter((teacher) => teacher._id === subject.teacherId);
  }, [options?.teachers, options?.subjects, formData.subjectId]);

  const selectedClass = useMemo(
    () => (options?.classes ?? []).find((klass) => klass._id === formData.classId),
    [options?.classes, formData.classId]
  );

  const selectedSubject = useMemo(
    () => (options?.subjects ?? []).find((subject) => subject._id === formData.subjectId),
    [options?.subjects, formData.subjectId]
  );

  const classFee = Number(selectedClass?.feeAmount ?? 0);
  const subjectFee = Number(selectedSubject?.feeAmount ?? 0);
  const totalFee = classFee + subjectFee;
  const helperTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const fieldErrorClass = isDark ? 'mt-2 text-xs text-rose-300' : 'mt-2 text-xs text-rose-600';
  const errorBannerClass = isDark ? 'border-rose-500/40 bg-rose-500/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700';
  const successBannerClass = isDark ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const genderOptions = useMemo(
    () => [
      { value: 'male', label: t('students.gender_male', { defaultValue: 'Male' }) },
      { value: 'female', label: t('students.gender_female', { defaultValue: 'Female' }) },
      { value: 'other', label: t('students.gender_other', { defaultValue: 'Other' }) }
    ],
    [t]
  );

  const classOptions = useMemo(
    () => (options?.classes ?? []).map((klass) => ({ value: klass._id, label: klass.className })),
    [options?.classes]
  );

  const subjectOptions = useMemo(
    () => filteredSubjects.map((subject) => ({ value: subject._id, label: subject.title })),
    [filteredSubjects]
  );

  const teacherOptions = useMemo(
    () => linkedTeachers.map((teacher) => ({ value: teacher._id, label: teacher.name })),
    [linkedTeachers]
  );

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      classId: classIdParam || current.classId,
      subjectId: subjectIdParam || current.subjectId,
      teacherId: teacherIdParam || current.teacherId
    }));
  }, [classIdParam, subjectIdParam, teacherIdParam]);

  useEffect(() => {
    if (!formData.subjectId || formData.teacherId) {
      return;
    }

    const linkedTeacherId = selectedSubject?.teacherId ?? (linkedTeachers.length === 1 ? linkedTeachers[0]._id : '');
    if (!linkedTeacherId) {
      return;
    }

    setFormData((current) => (
      current.teacherId
        ? current
        : { ...current, teacherId: String(linkedTeacherId) }
    ));
  }, [formData.subjectId, formData.teacherId, linkedTeachers, selectedSubject?.teacherId]);

  const setFieldValue = (name: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'classId' ? { subjectId: '', teacherId: '' } : {}),
      ...(name === 'subjectId' ? { teacherId: '' } : {})
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[name];
      if (name === 'classId') {
        delete next.subjectId;
        delete next.teacherId;
      }
      if (name === 'subjectId') {
        delete next.teacherId;
      }
      return next;
    });
    setError('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFieldValue(name as keyof typeof formData, value);
  };

  const buildRequiredMessage = (label: string) =>
    t('common.field_required', {
      field: label,
      defaultValue: `${label} is required.`
    });

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = buildRequiredMessage(t('students.first_name', { defaultValue: 'First Name' }));
    if (!formData.lastName.trim()) nextErrors.lastName = buildRequiredMessage(t('students.last_name', { defaultValue: 'Last Name' }));
    if (!formData.email.trim()) {
      nextErrors.email = buildRequiredMessage(t('common.email', { defaultValue: 'Email' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = t('auth.invalid_email', { defaultValue: 'Enter a valid email address.' });
    }
    if (!formData.phone.trim()) nextErrors.phone = buildRequiredMessage(t('students.phone', { defaultValue: 'Phone Number' }));
    if (!formData.gender) nextErrors.gender = buildRequiredMessage(t('students.gender', { defaultValue: 'Gender' }));
    if (!formData.classId) nextErrors.classId = buildRequiredMessage(t('students.class', { defaultValue: 'Class' }));
    if (!formData.subjectId) nextErrors.subjectId = buildRequiredMessage(t('students.subject', { defaultValue: 'Subject' }));
    if (!formData.teacherId) nextErrors.teacherId = buildRequiredMessage(t('students.teacher', { defaultValue: 'Teacher' }));

    if (!formData.password) {
      nextErrors.password = buildRequiredMessage(t('common.password', { defaultValue: 'Password' }));
    } else if (formData.password.length < 4 || formData.password.length > 32) {
      nextErrors.password = t('auth.password_length_hint', { defaultValue: 'Password must be 4 to 32 characters.' });
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = buildRequiredMessage(t('auth.confirm_password', { defaultValue: 'Confirm Password' }));
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t('auth.password_mismatch', { defaultValue: 'Passwords do not match.' });
    }

    return nextErrors;
  };

  const renderFieldError = (fieldName: keyof typeof formData) => {
    const message = fieldErrors[fieldName];
    return message ? <p className={fieldErrorClass}>{message}</p> : null;
  };

  const buildServerFieldErrors = (message: string) => {
    const normalizedMessage = message.toLowerCase();
    const nextErrors: Record<string, string> = {};

    const matchField = (fieldName: keyof typeof formData, ...keywords: string[]) => {
      if (keywords.some((keyword) => normalizedMessage.includes(keyword))) {
        nextErrors[fieldName] = message;
      }
    };

    matchField('firstName', 'firstname', 'first name');
    matchField('lastName', 'lastname', 'last name');
    matchField('email', 'email');
    matchField('phone', 'phone');
    matchField('gender', 'gender');
    matchField('classId', 'classid', 'class');
    matchField('subjectId', 'subjectid', 'subject');
    matchField('teacherId', 'teacherid', 'teacher');
    matchField('password', 'password');
    matchField('confirmPassword', 'confirm password', 'confirmation');

    return nextErrors;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProfileImage(file);
    if (!file) {
      setPreviewUrl(getRoleFallbackImage('student'));
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const nextErrors = validateForm();
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError(Object.values(nextErrors)[0]);
        return;
      }

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (profileImage) {
        payload.append('profileImage', profileImage);
      }

      await authService.registerStudent(payload);
      setSuccess(t('auth.register_success', { defaultValue: 'Student account created successfully. You can sign in now.' }));
      setFieldErrors({});
      setTimeout(() => navigate('/login'), 1200);
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || error.message || t('auth.register_failed', { defaultValue: 'Registration failed' });
      const nextFieldErrors = buildServerFieldErrors(String(serverMessage));
      setFieldErrors(nextFieldErrors);
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-10 ${
      isDark
        ? 'bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.92))]'
        : 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))]'
    }`}>
      <div className={`absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:32px_32px] ${isDark ? 'opacity-40' : 'opacity-70'}`} />
      <div className="relative mx-auto max-w-5xl">
        <Card className={`overflow-hidden border p-8 backdrop-blur-xl ${
          isDark
            ? 'border-white/10 bg-slate-950/80 shadow-[0_30px_120px_rgba(15,23,42,0.5)]'
            : 'border-slate-200/80 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)]'
        }`}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/login')}>
              <ArrowLeft className="h-4 w-4" />
              {t('auth.back_to_login', { defaultValue: 'Back to Login' })}
            </Button>
            <div className={`inline-flex rounded-full border p-1 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <div className={`rounded-[2rem] border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">{t('auth.register_badge', { defaultValue: 'Student Registration' })}</p>
              <h1 className={`mt-3 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('auth.register_title', { defaultValue: 'Create Student Account' })}</h1>
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('auth.register_description', {
                  defaultValue: 'Public registration only creates student accounts. Admin, teacher, finance, and other roles cannot be created here.'
                })}
              </p>

              <div className={`mt-8 flex flex-col items-center rounded-[2rem] border border-dashed p-6 text-center ${isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-300 bg-white/90'}`}>
                <img src={previewUrl} alt={t('auth.avatar_preview', { defaultValue: 'Student avatar preview' })} className="h-32 w-32 rounded-full object-cover" />
                <label className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${isDark ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/15' : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                  <Upload className="h-4 w-4" />
                  {t('auth.upload_avatar', { defaultValue: 'Upload Avatar' })}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <p className={`mt-3 text-xs ${helperTextClass}`}>{t('auth.avatar_requirements', { defaultValue: 'JPEG, PNG, WebP, or GIF up to 5MB' })}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {sourceTitle && (
                <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
                  isDark
                    ? 'border-sky-400/20 bg-sky-500/10 text-sky-100'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
                }`}>
                  {sourceType === 'announcement'
                    ? t('auth.register_from_announcement', { defaultValue: `Prefilled from announcement: ${sourceTitle}` })
                    : t('auth.register_from_class', { defaultValue: `Prefilled from class: ${sourceTitle}` })}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.first_name', { defaultValue: 'First Name' })}</label>
                  <Input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                  {renderFieldError('firstName')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.last_name', { defaultValue: 'Last Name' })}</label>
                  <Input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                  {renderFieldError('lastName')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('common.email', { defaultValue: 'Email' })}</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  {renderFieldError('email')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.phone', { defaultValue: 'Phone Number' })}</label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} required />
                  {renderFieldError('phone')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('auth.whatsapp_number', { defaultValue: 'WhatsApp Number' })}</label>
                  <Input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.gender', { defaultValue: 'Gender' })}</label>
                  <Select
                    value={formData.gender}
                    options={genderOptions}
                    placeholder={t('auth.select_gender', { defaultValue: 'Select gender' })}
                    onChange={(value) => setFieldValue('gender', String(value))}
                  />
                  {renderFieldError('gender')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('common.password', { defaultValue: 'Password' })}</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleInputChange} required minLength={4} maxLength={32} />
                  <p className={`mt-2 text-xs ${helperTextClass}`}>{t('auth.password_length_hint', { defaultValue: 'Password must be 4 to 32 characters.' })}</p>
                  {renderFieldError('password')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('auth.confirm_password', { defaultValue: 'Confirm Password' })}</label>
                  <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required minLength={4} maxLength={32} />
                  {renderFieldError('confirmPassword')}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.class', { defaultValue: 'Class' })}</label>
                  <Select
                    value={formData.classId}
                    options={classOptions}
                    placeholder={
                      isLoading
                        ? t('auth.loading_classes', { defaultValue: 'Loading classes...' })
                        : options?.classes?.length
                          ? t('auth.select_class', { defaultValue: 'Select class' })
                          : t('auth.no_classes_available', { defaultValue: 'No classes available' })
                    }
                    disabled={isLoading}
                    onChange={(value) => setFieldValue('classId', String(value))}
                  />
                  {renderFieldError('classId')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.subject', { defaultValue: 'Subject' })}</label>
                  <Select
                    value={formData.subjectId}
                    options={subjectOptions}
                    placeholder={
                      !formData.classId
                        ? t('auth.select_class_first', { defaultValue: 'Select class first' })
                        : !filteredSubjects.length
                          ? t('auth.no_subjects_available', { defaultValue: 'No subjects available' })
                          : t('auth.select_subject', { defaultValue: 'Select subject' })
                    }
                    disabled={isLoading || !filteredSubjects.length}
                    onChange={(value) => setFieldValue('subjectId', String(value))}
                  />
                  {renderFieldError('subjectId')}
                </div>
                <div>
                  <label className={`mb-2 block text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('students.teacher', { defaultValue: 'Teacher' })}</label>
                  <Select
                    value={formData.teacherId}
                    options={teacherOptions}
                    placeholder={
                      !formData.subjectId
                        ? t('auth.select_subject_first', { defaultValue: 'Select subject first' })
                        : !linkedTeachers.length
                          ? t('auth.no_teachers_available', { defaultValue: 'No teachers available' })
                          : t('auth.select_teacher', { defaultValue: 'Select teacher' })
                    }
                    disabled={isLoading || !linkedTeachers.length}
                    onChange={(value) => setFieldValue('teacherId', String(value))}
                  />
                  {renderFieldError('teacherId')}
                </div>
              </div>

              <div className={`grid gap-4 rounded-[2rem] border p-5 md:grid-cols-3 ${isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/80'}`}>
                <div>
                  <p className={`text-xs uppercase tracking-[0.25em] ${helperTextClass}`}>{t('auth.class_fee', { defaultValue: 'Class Fee' })}</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{classFee.toLocaleString(locale)}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-[0.25em] ${helperTextClass}`}>{t('auth.subject_fee', { defaultValue: 'Subject Fee' })}</p>
                  <p className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{subjectFee.toLocaleString(locale)}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-[0.25em] ${helperTextClass}`}>{t('auth.total_fee', { defaultValue: 'Total Fee' })}</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-400">{totalFee.toLocaleString(locale)}</p>
                </div>
              </div>

              {error && <div className={`rounded-2xl border px-4 py-3 text-sm ${errorBannerClass}`}>{error}</div>}
              {success && <div className={`rounded-2xl border px-4 py-3 text-sm ${successBannerClass}`}>{success}</div>}

              <div className={`flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('auth.already_have_account', { defaultValue: 'Already have an account?' })}{' '}
                  <Link to="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
                    {t('auth.sign_in_here', { defaultValue: 'Sign in here' })}
                  </Link>
                </p>
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting
                    ? t('auth.creating_account', { defaultValue: 'Creating account...' })
                    : t('auth.register_as_student', { defaultValue: 'Register as Student' })}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
