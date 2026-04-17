import { memo, useCallback, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api } from '@/services/apiClient';
import { getApiOrigin } from '@/utils/profileImage';

interface HomeNotification {
  _id: string;
  title: string;
  description: string;
  message?: string;
  image?: string;
  publishDate?: string;
  classId?: string | null;
  subjectId?: string | null;
  teacherId?: string | null;
  className?: string;
  subjectName?: string;
  teacherName?: string;
}

export const HomePage = memo(function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState('');

  const { data: announcements } = useQuery({
    queryKey: ['home-notifications'],
    queryFn: () => api.get('/notifications/public', { params: { limit: 4 } }).then((res) => res.data.data as HomeNotification[]),
    staleTime: 60_000
  });

  const locale = useMemo(() => {
    if (i18n.resolvedLanguage === 'fa') return 'fa-AF';
    if (i18n.resolvedLanguage === 'ps') return 'ps-AF';
    return 'en-US';
  }, [i18n.resolvedLanguage]);

  const navItems = useMemo(
    () => [
      { id: 'home', label: t('nav_home') },
      { id: 'about', label: t('nav_about') },
      { id: 'services', label: t('nav_services') },
      { id: 'contact', label: t('nav_contact') }
    ],
    [t]
  );

  const services = useMemo(
    () => [
      t('service_student_management'),
      t('service_teacher_management'),
      t('service_finance_reports'),
      t('service_library'),
      t('service_exams_results'),
      t('service_family_access'),
      t('service_notifications')
    ],
    [t]
  );

  const scrollTo = useCallback((section: string) => {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactStatus(t('contact_sent'));
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  const handleAnnouncementRegister = (announcement: HomeNotification) => {
    const params = new URLSearchParams();
    if (announcement.classId) params.set('classId', announcement.classId);
    if (announcement.subjectId) params.set('subjectId', announcement.subjectId);
    if (announcement.teacherId) params.set('teacherId', announcement.teacherId);
    if (announcement.title) params.set('sourceTitle', announcement.title);
    params.set('sourceType', 'announcement');
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-sky-500/15 text-sky-300 shadow-lg shadow-sky-500/10 ring-1 ring-slate-800">
              <span className="text-xl font-black">N</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">{t('home_brand')}</p>
              <p className="text-xs text-slate-500">{t('home_tagline')}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-slate-300 transition hover:text-slate-100"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex">
              <LanguageSwitcher />
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
              {t('nav_login')}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <section id="home" className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950 via-slate-950/90 to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t('home_intro_label')}</p>
                <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl">
                  {t('hero_title')}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
                  {t('hero_description')}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="md" className="min-w-[140px] py-4" onClick={() => navigate('/login')}>
                  {t('hero_cta_login')}
                </Button>
                <Button variant="outline" size="md" className="min-w-[140px] py-4" onClick={() => scrollTo('about')}>
                  {t('hero_cta_learn_more')}
                </Button>
                <Button variant="ghost" size="md" className="min-w-[140px] py-4" onClick={() => scrollTo('contact')}>
                  {t('hero_cta_contact')}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-500 hover:-translate-y-1 hover:border-sky-500/50">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('home_summary_title')}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{t('home_summary_students')}</p>
                  <p className="mt-2 text-slate-400">{t('home_summary_students_text')}</p>
                </div>
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-500 hover:-translate-y-1 hover:border-sky-500/50">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('home_summary_title')}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{t('home_summary_reports')}</p>
                  <p className="mt-2 text-slate-400">{t('home_summary_reports_text')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-sky-400">{t('home_login_card')}</p>
                <h2 className="text-3xl font-semibold text-white">{t('home_login_card')}</h2>
                <p className="text-slate-400">{t('home_login_hint')}</p>
              </div>
              <div className="mt-8">
                <Button className="w-full py-4" onClick={() => navigate('/login')}>
                  {t('hero_cta_login')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-slate-800/80 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t('about_label')}</p>
              <h2 className="text-4xl font-semibold text-white">{t('about_title')}</h2>
              <p className="text-lg leading-8 text-slate-400">{t('about_description')}</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {[
                t('about_feature_students'),
                t('about_feature_teachers'),
                t('about_feature_reports')
              ].map((text) => (
                <div key={text} className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 transition duration-500 hover:-translate-y-1 hover:border-sky-500/50">
                  <p className="text-lg font-semibold text-white">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="bg-slate-900/80 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t('services_label')}</p>
              <h2 className="text-4xl font-semibold text-white">{t('services_title')}</h2>
              <p className="text-lg leading-8 text-slate-400">{t('services_description')}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <div key={service} className="group rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/20 transition duration-500 hover:-translate-y-1 hover:border-sky-500/50">
                  <div className="mb-6 inline-flex rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                    {t('service_tag')}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{service}</h3>
                  <p className="mt-4 text-slate-400">{t('service_card_description')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="notifications" className="border-t border-slate-800/80 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t('notifications.latest_announcements', { defaultValue: 'Latest Announcements' })}</p>
              <h2 className="text-4xl font-semibold text-white">{t('notifications.latest_announcements', { defaultValue: 'Latest Announcements' })}</h2>
              <p className="text-lg leading-8 text-slate-400">{t('notifications.home_description', { defaultValue: 'Stay updated with the newest school announcements, notices, and published updates.' })}</p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {(announcements ?? []).map((announcement) => (
                <article key={announcement._id} className="overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/85 shadow-2xl shadow-slate-950/20 transition duration-500 hover:-translate-y-1 hover:border-sky-500/50">
                  {announcement.image && (
                    <img
                      src={announcement.image.startsWith('http') ? announcement.image : `${getApiOrigin()}${announcement.image}`}
                      alt={announcement.title}
                      className="h-48 w-full object-cover"
                    />
                  )}
                  <div className="space-y-4 p-6">
                    <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                      {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString(locale) : ''}
                    </p>
                    <h3 className="text-2xl font-semibold text-white">{announcement.title}</h3>
                    <p className="text-sm leading-7 text-slate-400">{announcement.description || announcement.message || t('common.not_available')}</p>
                    {(announcement.className || announcement.subjectName || announcement.teacherName) && (
                      <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-sm text-slate-300">
                        <p>{t('students.class')}: {announcement.className || t('common.not_available')}</p>
                        <p>{t('students.subject')}: {announcement.subjectName || t('common.not_available')}</p>
                        <p>{t('students.teacher')}: {announcement.teacherName || t('common.not_available')}</p>
                      </div>
                    )}
                    <Button size="sm" onClick={() => handleAnnouncementRegister(announcement)}>
                      {t('common.register', { defaultValue: 'Register' })}
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {!(announcements ?? []).length && (
              <div className="mt-12 rounded-[2rem] border border-dashed border-slate-800/80 bg-slate-900/60 p-8 text-center text-slate-400">
                {t('common.no_records_found')}
              </div>
            )}
          </div>
        </section>

        <section id="contact" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t('contact_label')}</p>
                <h2 className="text-4xl font-semibold text-white">{t('contact_title')}</h2>
                <p className="text-lg leading-8 text-slate-400">{t('contact_description')}</p>
                <div className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6">
                  <p className="text-base font-semibold text-white">{t('contact_email')}</p>
                  <p className="text-slate-400">support@noktaacademy.edu</p>
                  <p className="text-base font-semibold text-white">{t('contact_phone')}</p>
                  <p className="text-slate-400">+98 21 1234 5678</p>
                  <p className="text-base font-semibold text-white">{t('contact_address')}</p>
                  <p className="text-slate-400">{t('contact_address_text')}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/20">
                <h3 className="text-2xl font-semibold text-white">{t('contact_form_title')}</h3>
                <p className="mt-3 text-slate-400">{t('contact_form_description')}</p>
                <form onSubmit={handleContactSubmit} className="mt-8 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">{t('contact_form_name')}</label>
                    <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder={t('contact_form_name_placeholder')} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">{t('contact_form_email')}</label>
                    <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder={t('contact_form_email_placeholder')} type="email" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">{t('contact_form_message')}</label>
                    <textarea
                      value={contactMessage}
                      onChange={(event) => setContactMessage(event.target.value)}
                      placeholder={t('contact_form_message_placeholder')}
                      rows={5}
                      className="w-full rounded-3xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  {contactStatus && <p className="text-sm text-emerald-400">{contactStatus}</p>}
                  <Button type="submit" className="w-full py-4">
                    {t('contact_form_submit')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">{t('home_brand')}</p>
              <p className="mt-3 max-w-xl text-slate-400">{t('footer_description')}</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-300">{t('footer_quick_links')}</p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                  {navItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => scrollTo(item.id)} className="transition hover:text-slate-100">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-800/70 pt-6 text-sm text-slate-500">
            {t('footer_copyright')}
          </div>
        </footer>
      </main>
    </div>
  );
});
