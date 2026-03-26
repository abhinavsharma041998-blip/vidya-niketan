import { useState, useEffect } from 'react';
import { Bell, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function AnnouncementsPage() {
  const [form, setForm] = useState({ title: '', message: '', targetAudience: 'All', courseId: '', studentId: '', sendSMSFlag: true, sendWhatsAppFlag: true });
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/courses?active=true').then(r => setCourses(r.data.data || []));
    api.get('/students?status=Active').then(r => setStudents(r.data.data || []));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message required');
    setSending(true);
    try {
      const { data } = await api.post('/notify/announce', form);
      toast.success(data.message);
      setForm({ ...form, title: '', message: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  // Individual SMS/WhatsApp
  const [smsForm, setSmsForm] = useState({ studentId: '', customMsg: '', type: 'both' });
  const handleIndividualSend = async (e) => {
    e.preventDefault();
    const student = students.find(s => s._id === smsForm.studentId);
    if (!student) return toast.error('Select a student');
    if (!smsForm.customMsg) return toast.error('Enter a message');
    try {
      if (smsForm.type === 'sms' || smsForm.type === 'both') { await api.post('/notify/sms', { phone: student.phone, message: smsForm.customMsg }); }
      if (smsForm.type === 'whatsapp' || smsForm.type === 'both') { await api.post('/notify/whatsapp', { phone: student.phone, message: smsForm.customMsg }); }
      toast.success(`Message sent to ${student.name}`);
      setSmsForm({ ...smsForm, customMsg: '' });
    } catch (err) { toast.error('Failed to send message'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Announcements & Notifications</h1>
        <p className="text-gray-500 text-sm">Send SMS and WhatsApp messages to students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulk Announcement */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center"><Bell size={16} /></div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Send Announcement</h2>
          </div>
          <form onSubmit={handleSend} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label><input required className="input-field" placeholder="Announcement title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label><textarea required rows={4} className="input-field resize-none" placeholder="Your announcement message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Audience</label>
              <select className="input-field" value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })}>
                <option value="All">All Active Students</option>
                <option value="Course">Specific Course</option>
                <option value="Individual">Individual Student</option>
              </select>
            </div>
            {form.targetAudience === 'Course' && (
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Course</label>
                <select className="input-field" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Choose course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {form.targetAudience === 'Individual' && (
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Student</label>
                <select className="input-field" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                  <option value="">Choose student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.sendSMSFlag} onChange={e => setForm({ ...form, sendSMSFlag: e.target.checked })} /> Send SMS
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.sendWhatsAppFlag} onChange={e => setForm({ ...form, sendWhatsAppFlag: e.target.checked })} /> Send WhatsApp
              </label>
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
              {sending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </form>
        </div>

        {/* Individual Message */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center"><Send size={16} /></div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Message to Student</h2>
          </div>
          <form onSubmit={handleIndividualSend} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Student</label>
              <select className="input-field" value={smsForm.studentId} onChange={e => setSmsForm({ ...smsForm, studentId: e.target.value })}>
                <option value="">Select student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} - {s.phone}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
              <textarea rows={5} className="input-field resize-none" placeholder="Type your message here..." value={smsForm.customMsg} onChange={e => setSmsForm({ ...smsForm, customMsg: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">{smsForm.customMsg.length} characters</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Send via</label>
              <select className="input-field" value={smsForm.type} onChange={e => setSmsForm({ ...smsForm, type: e.target.value })}>
                <option value="both">SMS + WhatsApp</option>
                <option value="sms">SMS Only</option>
                <option value="whatsapp">WhatsApp Only</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Send size={16} /> Send Message</button>
          </form>

          {/* Template shortcuts */}
          <div className="mt-5 pt-5 border-t dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Quick Templates</p>
            <div className="flex flex-col gap-2">
              {[
                { label: '📅 Fee Reminder', msg: 'Dear student, your fees are pending. Please pay at the earliest to continue your course. - Vidya Niketan' },
                { label: '✅ Welcome', msg: 'Welcome to Vidya Niketan Education Centre! We are glad to have you. Your classes start soon. - Vidya Niketan' },
                { label: '📢 Holiday', msg: 'Dear students, the institute will remain closed tomorrow due to a public holiday. Classes will resume the following day. - Vidya Niketan' },
              ].map(t => (
                <button key={t.label} onClick={() => setSmsForm(f => ({ ...f, customMsg: t.msg }))}
                  className="text-left text-xs text-blue-600 dark:text-blue-400 hover:underline">{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
