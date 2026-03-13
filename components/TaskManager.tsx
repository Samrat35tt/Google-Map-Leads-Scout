import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Lead, AppUser } from '../types';
import { Plus, MoreVertical, Calendar, User as LucideUser, Flag, CheckSquare, Search, LayoutList, Kanban, Clock, AlertCircle } from 'lucide-react';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface TaskManagerProps {
  leads: Lead[];
  user: AppUser;
}

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'review', label: 'In Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'done', label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

const PRIORITIES: { value: TaskPriority; label: string; iconColor: string }[] = [
  { value: 'low', label: 'Low', iconColor: 'text-slate-400' },
  { value: 'medium', label: 'Medium', iconColor: 'text-blue-500' },
  { value: 'high', label: 'High', iconColor: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', iconColor: 'text-red-600' }
];

export default function TaskManager({ leads, user }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    leadId: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('ownerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list' as any, 'tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveTask = async () => {
    if (!formData.title || !user) return;

    try {
      if (editingTask) {
        const docRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...formData,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, editingTask ? 'update' as any : 'create' as any, 'tasks');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, 'delete' as any, 'tasks');
      }
    }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        leadId: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, 'update' as any, 'tasks');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPriorityIcon = (priority: TaskPriority) => {
    const p = PRIORITIES.find(x => x.value === priority);
    return <Flag size={14} className={p?.iconColor || 'text-slate-400'} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-700">
            <CheckSquare size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-normal text-[#1f1f1f]">Tasks</h1>
            <p className="text-[#444746]">Manage your team's workflow and to-dos.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              title="Board View"
            >
              <Kanban size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              title="List View"
            >
              <LayoutList size={18} />
            </button>
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1f1f1f] text-white rounded-xl hover:bg-black transition-colors font-medium text-sm"
          >
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' && (
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[60vh]">
          {STATUSES.map(status => {
            const columnTasks = filteredTasks.filter(t => t.status === status.value);
            return (
              <div 
                key={status.value} 
                className="flex-1 min-w-[300px] bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.value)}
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${status.color}`}>
                      {status.label}
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button onClick={() => { setFormData({...formData, status: status.value}); setShowModal(true); }} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columnTasks.map(task => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openModal(task)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 text-sm leading-tight">{task.title}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                      )}
                      
                      {task.leadId && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                            <LucideUser size={10} />
                            {leads.find(l => l.id === task.leadId)?.name || 'Unknown Lead'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-slate-500" title={`Priority: ${task.priority}`}>
                            {renderPriorityIcon(task.priority)}
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500" title="Due Date">
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                        {task.assignee && (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm" title={`Assigned to ${task.assignee}`}>
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-400">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Task</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No tasks found.</td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openModal(task)}>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 text-sm">{task.title}</div>
                        {task.leadId && <div className="text-xs text-slate-500 mt-0.5">Lead: {leads.find(l => l.id === task.leadId)?.name}</div>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUSES.find(s => s.value === task.status)?.color}`}>
                          {STATUSES.find(s => s.value === task.status)?.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm capitalize">
                          {renderPriorityIcon(task.priority)}
                          <span className="text-slate-600">{task.priority}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                            {task.assignee}
                          </div>
                        ) : <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Add details, links, or notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as TaskStatus})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none capitalize"
                  >
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                  <input 
                    type="text" 
                    value={formData.assignee} 
                    onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Linked Lead (Optional)</label>
                <select 
                  value={formData.leadId} 
                  onChange={(e) => setFormData({...formData, leadId: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- None --</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company || l.category})</option>)}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTask}
                disabled={!formData.title}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
