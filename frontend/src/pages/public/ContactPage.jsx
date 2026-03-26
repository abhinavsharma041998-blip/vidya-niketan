import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', course: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return toast.error('Please fill all required fields');
    setLoading(true);
    try {
      const { data } = await api.post('/queries', form);
      toast.success(data.message || 'Query submitted! We will contact you soon.');
      setForm({ name: '', phone: '', email: '', course: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-16 mb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-montserrat font-black mb-3">Contact Us</h1>
          <p className="text-blue-200 text-lg">We'd love to hear from you. Send us a message!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white mb-8">Get In Touch</h2>
            <div className="space-y-5 mb-10">
              {[
                { icon: <MapPin className="w-5 h-5" />, title: 'Address', text: 'Vidya Niketan Education Centre, Near Talwara By-Pass, Above Gramin Bank, Chintpurni' },
                { icon: <Phone className="w-5 h-5" />, title: 'Phone', text: '7018935693 / 8894424919 / 8628898993' },
                { icon: <Mail className="w-5 h-5" />, title: 'Email', text: 'vidyaniketaneducation108@gmail.com' },
                { icon: <Clock className="w-5 h-5" />, title: 'Hours', text: 'Monday - Saturday: 9:00 AM - 6:00 PM' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">📞 Quick Enquiry</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">Call or WhatsApp us directly for immediate assistance with admissions and course information.</p>
            </div>
          </div>

          {/* Query Form */}
          <div className="card p-8">
            <h2 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white mb-6">Send Your Query</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="Your phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input className="input-field" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Interested Course</label>
                <select className="input-field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                  <option value="">Select a course</option>
                  {['DCA', 'PGDCA', 'Basic Computer Course', 'Advanced Web Development', 'Tally & Accounting', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message <span className="text-red-500">*</span></label>
                <textarea className="input-field resize-none" rows={4} placeholder="Your message or question..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send size={16} />}
                {loading ? 'Sending...' : 'Send Query'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
