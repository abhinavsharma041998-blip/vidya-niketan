// ExamSubjectsPage.jsx — manage subjects + each subject's question bank
import { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp, BookOpenCheck, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY_SUBJECT = { name: '', code: '', description: '' };
const EMPTY_QUESTION = { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1 };

const BULK_EXAMPLE = `What does CPU stand for? | Central Processing Unit | Central Program Unit | Computer Processing Unit | Central Processor User | A
Which key deletes text to the left of the cursor? | Delete | Backspace | Insert | Tab | B | 2`;

export default function ExamSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState(null); // subjectId currently expanded
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT);
  const [saving, setSaving] = useState(false);

  const [questionModal, setQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [bulkModal, setBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { insertedCount, errorCount, errors }

  const fetchSubjects = () => api.get('/exam/subjects').then(r => setSubjects(r.data.data || []));
  useEffect(() => { fetchSubjects(); }, []);

  const toggleExpand = async (subjectId) => {
    if (expanded === subjectId) { setExpanded(null); return; }
    setExpanded(subjectId);
    setLoadingQuestions(true);
    try {
      const r = await api.get(`/exam/questions?subject=${subjectId}`);
      setQuestions(r.data.data || []);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoadingQuestions(false); }
  };

  const refreshQuestions = async (subjectId) => {
    const r = await api.get(`/exam/questions?subject=${subjectId}`);
    setQuestions(r.data.data || []);
    fetchSubjects(); // update counts
  };

  // ── Subject CRUD ──
  const openAddSubject = () => { setSubjectForm(EMPTY_SUBJECT); setSubjectModal(true); };

  const handleSaveSubject = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/exam/subjects', subjectForm);
      toast.success('Subject added');
      setSubjectModal(false);
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`Remove subject "${name}"? This also deletes all its questions.`)) return;
    try {
      await api.delete(`/exam/subjects/${id}`);
      toast.success('Subject removed');
      if (expanded === id) setExpanded(null);
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  // ── Question CRUD ──
  const openAddQuestion = () => { setQuestionForm(EMPTY_QUESTION); setQuestionModal(true); };

  const handleSaveQuestion = async (e) => {
    e.preventDefault(); setSavingQuestion(true);
    try {
      if (questionForm.options.some(o => !o.trim())) {
        toast.error('Fill all 4 options'); setSavingQuestion(false); return;
      }
      await api.post('/exam/questions', { ...questionForm, subject: expanded, marks: Number(questionForm.marks) });
      toast.success('Question added');
      setQuestionModal(false);
      refreshQuestions(expanded);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSavingQuestion(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Remove this question?')) return;
    try {
      await api.delete(`/exam/questions/${id}`);
      toast.success('Question removed');
      refreshQuestions(expanded);
    } catch { toast.error('Failed to delete'); }
  };

  // ── Bulk question import (paste many lines at once — e.g. 80 per subject) ──
  const openBulkAdd = () => { setBulkText(''); setBulkResult(null); setBulkModal(true); };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) { toast.error('Paste at least one question line'); return; }
    setBulkSaving(true);
    setBulkResult(null);
    try {
      const r = await api.post('/exam/questions/bulk', { subject: expanded, text: bulkText });
      setBulkResult(r.data.data);
      if (r.data.data.insertedCount > 0) {
        toast.success(`${r.data.data.insertedCount} question(s) added`);
        refreshQuestions(expanded);
        setBulkText('');
      }
      if (r.data.data.errorCount > 0) toast.error(`${r.data.data.errorCount} line(s) had errors — see details below`);
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    finally { setBulkSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-gray-900 dark:text-white">Exam Subjects &amp; Question Bank</h1>
          <p className="text-gray-500 text-sm">{subjects.length} subjects · {subjects.reduce((s, x) => s + (x.questionCount || 0), 0)} questions total</p>
        </div>
        <button onClick={openAddSubject} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Add Subject</button>
      </div>

      <div className="space-y-3">
        {subjects.map(s => (
          <div key={s._id} className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleExpand(s._id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BookOpenCheck size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.code} · {s.questionCount} question{s.questionCount === 1 ? '' : 's'} in bank</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s._id, s.name); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                {expanded === s._id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {expanded === s._id && (
              <div className="border-t dark:border-gray-800 p-4 space-y-3">
                <div className="flex justify-end">
                  <button onClick={openAddQuestion} className="btn-secondary text-xs flex items-center gap-1.5 !py-1.5 !px-3"><Plus size={14} /> Add Question</button>
                  <button onClick={openBulkAdd} className="btn-secondary text-xs flex items-center gap-1.5 !py-1.5 !px-3"><UploadCloud size={14} /> Bulk Add</button>
                </div>
                {loadingQuestions ? (
                  <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
                ) : questions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No questions yet in this subject.</p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={q._id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{i + 1}. {q.questionText}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                            {q.options.map((opt, idx) => (
                              <span key={idx} className={`text-xs ${idx === q.correctOption ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500'}`}>
                                {String.fromCharCode(65 + idx)}. {opt} {idx === q.correctOption && '✓'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteQuestion(q._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {subjects.length === 0 && <p className="text-center text-gray-400 py-12">No subjects yet. Add one to start building the question bank.</p>}
      </div>

      {/* Add Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Add Subject</h2>
              <button onClick={() => setSubjectModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name *</label>
                <input required className="input-field" placeholder="e.g. Mathematics" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input className="input-field" placeholder="MATH" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={2} className="input-field resize-none" value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setSubjectModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Add Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {questionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Add Question</h2>
              <button onClick={() => setQuestionModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question *</label>
                <textarea required rows={2} className="input-field resize-none" value={questionForm.questionText} onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })} /></div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options * (select the correct one)</label>
                {questionForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={questionForm.correctOption === idx}
                      onChange={() => setQuestionForm({ ...questionForm, correctOption: idx })} className="flex-shrink-0" />
                    <input required className="input-field" placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt}
                      onChange={e => { const opts = [...questionForm.options]; opts[idx] = e.target.value; setQuestionForm({ ...questionForm, options: opts }); }} />
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marks</label>
                <input type="number" min="1" className="input-field" value={questionForm.marks} onChange={e => setQuestionForm({ ...questionForm, marks: e.target.value })} /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setQuestionModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={savingQuestion} className="btn-primary text-sm">{savingQuestion ? 'Saving...' : 'Add Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Questions Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <h2 className="text-lg font-montserrat font-bold text-gray-900 dark:text-white">Bulk Add Questions</h2>
              <button onClick={() => setBulkModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                <p>Paste one question per line, with parts separated by <code className="font-mono bg-white dark:bg-gray-800 px-1 rounded">|</code>:</p>
                <p className="font-mono bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">Question | Option A | Option B | Option C | Option D | Correct(A/B/C/D) | Marks(optional)</p>
                <p>Example:</p>
                <pre className="font-mono bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 whitespace-pre-wrap">{BULK_EXAMPLE}</pre>
                <p>Marks is optional and defaults to 1. You can paste as many lines as you want — e.g. 80 in one go.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paste questions ({bulkText.split('\n').filter(l => l.trim()).length} line(s))</label>
                <textarea required rows={10} className="input-field font-mono text-sm resize-y" placeholder={BULK_EXAMPLE}
                  value={bulkText} onChange={e => setBulkText(e.target.value)} />
              </div>
              {bulkResult && (
                <div className="rounded-lg border dark:border-gray-800 p-3 text-sm space-y-2">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ✅ {bulkResult.insertedCount} added{bulkResult.errorCount > 0 && `, ⚠️ ${bulkResult.errorCount} skipped`}
                  </p>
                  {bulkResult.errors?.length > 0 && (
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto list-disc pl-4">
                      {bulkResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setBulkModal(false)} className="btn-secondary text-sm">Close</button>
                <button type="submit" disabled={bulkSaving} className="btn-primary text-sm">{bulkSaving ? 'Importing...' : 'Import Questions'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
