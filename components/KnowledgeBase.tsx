import React, { useState, useEffect } from 'react';
import { KnowledgeDocument, AppUser } from '../types';
import { Book, Plus, FileText, Link as LinkIcon, Trash2, Search, Edit2 } from 'lucide-react';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface KnowledgeBaseProps {
  user: AppUser;
}

export default function KnowledgeBase({ user }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);

  const [formData, setFormData] = useState<{ title: string; content: string; type: 'text' | 'url' | 'file' }>({
    title: '',
    content: '',
    type: 'text'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'knowledge'),
      where('ownerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KnowledgeDocument[];
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list' as any, 'knowledge');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!formData.title || !formData.content || !user) return;

    try {
      if (editingDoc) {
        const docRef = doc(db, 'knowledge', editingDoc.id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'knowledge'), {
          ...formData,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, editingDoc ? 'update' as any : 'create' as any, 'knowledge');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDoc(doc(db, 'knowledge', id));
      } catch (error) {
        handleFirestoreError(error, 'delete' as any, 'knowledge');
      }
    }
  };

  const openModal = (doc?: KnowledgeDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({ title: doc.title, content: doc.content, type: doc.type });
    } else {
      setEditingDoc(null);
      setFormData({ title: '', content: '', type: 'text' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoc(null);
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-700">
            <Book size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-normal text-[#1f1f1f]">Knowledge Base</h1>
            <p className="text-[#444746]">Store company info, product details, and context for AI generation.</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1f1f1f] text-white rounded-xl hover:bg-black transition-colors font-medium text-sm"
        >
          <Plus size={18} /> Add Knowledge
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search knowledge base..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  {doc.type === 'url' ? <LinkIcon size={20} /> : <FileText size={20} />}
                </div>
                <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.title}</h3>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(doc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 line-clamp-3 mb-4">
              {doc.content}
            </p>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Added {new Date(doc.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Book size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No knowledge documents</h3>
            <p className="text-slate-500">Add information about your company, products, or services to help the AI generate better emails.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{editingDoc ? 'Edit Document' : 'Add Knowledge'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Product Features 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="text">Raw Text / Notes</option>
                  <option value="url">Website URL (Content will be scraped)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {formData.type === 'url' ? 'URL' : 'Content'}
                </label>
                {formData.type === 'url' ? (
                  <input 
                    type="url" 
                    value={formData.content} 
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://example.com/about"
                  />
                ) : (
                  <textarea 
                    value={formData.content} 
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[200px]"
                    placeholder="Paste your company information, product details, or any context you want the AI to know about..."
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.title || !formData.content}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingDoc ? 'Save Changes' : 'Add to Knowledge Base'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
