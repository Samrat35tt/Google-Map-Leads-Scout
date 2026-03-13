
import React, { useState, useEffect } from 'react';
import { Conversation, Message, Lead } from '../types';
import { MessageSquare, Mail, Phone, Linkedin, Search, Send, MoreVertical, Paperclip, Clock, CheckCircle2 } from 'lucide-react';

interface InboxProps {
  contacts: Lead[];
  conversations: Conversation[];
  onUpdateConversation: (conversation: Conversation) => void;
}

const Inbox: React.FC<InboxProps> = ({ contacts, conversations, onUpdateConversation }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Initializing new conversations for contacts that don't have one
  useEffect(() => {
    if (contacts.length === 0) return;

    // Identify contacts that need a thread initiated
    const activeContacts = contacts.filter(c => c.pipelineStage === 'Contacted' || c.pipelineStage === 'Interested' || c.pipelineStage === 'Meeting Booked');
    
    activeContacts.forEach(contact => {
        const exists = conversations.find(c => c.leadId === contact.id);
        if (!exists) {
            // Create a fresh conversation for this contact
            const newConv: Conversation = {
                id: `conv-${contact.id}-${Date.now()}`,
                leadId: contact.id,
                leadName: contact.name,
                leadEmail: contact.email,
                channel: 'email',
                unreadCount: 0,
                messages: [],
                lastMessage: 'Thread started',
                lastMessageTime: new Date().toISOString()
            };
            // Note: We use onUpdateConversation to persist this new thread
            onUpdateConversation(newConv);
        }
    });
  }, [contacts, conversations]); // Run when contacts or conversations change

  const filteredConversations = conversations
    .filter(c => c.leadName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendReply = async () => {
     if (!selectedConversation || !replyText.trim()) return;

     const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: replyText,
        timestamp: new Date().toISOString(),
        channel: selectedConversation.channel
     };

     // Optimistically update UI
     const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, newMessage],
        lastMessage: replyText,
        lastMessageTime: newMessage.timestamp
     };

     onUpdateConversation(updatedConversation);
     setReplyText('');

     // Send via API
     try {
       if (selectedConversation.channel === 'email') {
         await fetch('/api/send-email', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             to: selectedConversation.leadEmail,
             subject: `Re: Conversation with ${selectedConversation.leadName}`,
             text: replyText,
           })
         });
       } else if (selectedConversation.channel === 'sms') {
          // Assuming we have a phone number, but falling back to a dummy one if not present in the model
          const toPhone = '+1234567890'; // In a real app, get this from the lead
          await fetch('/api/send-sms', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             to: toPhone,
             body: replyText,
           })
         });
       }
     } catch (error) {
       console.error("Failed to send message:", error);
       // In a real app, you'd want to show an error toast here and maybe mark the message as failed
     }
  };

  const formatTime = (isoString: string) => {
     if (!isoString) return '';
     const date = new Date(isoString);
     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-[24px] border border-[#e0f2fe] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
       
       {/* Sidebar List */}
       <div className="w-80 border-r border-[#e0f2fe] flex flex-col bg-[#f8fafc]">
          <div className="p-4 border-b border-[#e0f2fe]">
             <h2 className="text-lg font-medium text-[#1f1f1f] mb-3">Inbox</h2>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-[#444746]" size={16} />
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e0f2fe] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-[#444746] text-sm">
                   No active conversations.<br/>
                   <span className="text-xs text-[#888] mt-2 block">
                     Contacts in 'Contacted' or 'Interested' stage will appear here.
                   </span>
                </div>
             ) : (
                filteredConversations.map(conv => (
                   <div 
                     key={conv.id}
                     onClick={() => setSelectedConversationId(conv.id)}
                     className={`p-4 border-b border-[#e0f2fe] cursor-pointer hover:bg-white transition-colors relative ${selectedConversationId === conv.id ? 'bg-white shadow-[inset_3px_0_0_0_#0ea5e9]' : ''}`}
                   >
                      <div className="flex justify-between items-start mb-1">
                         <span className={`font-medium text-sm truncate ${conv.unreadCount > 0 ? 'text-[#1f1f1f] font-bold' : 'text-[#444746]'}`}>
                            {conv.leadName}
                         </span>
                         <span className="text-[10px] text-[#444746]">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-[#1f1f1f] font-medium' : 'text-[#888]'}`}>
                         {conv.messages.length > 0 
                            ? (conv.messages[conv.messages.length - 1]?.sender === 'user' ? 'You: ' : '') + conv.lastMessage
                            : <span className="italic">No messages yet</span>
                         }
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                         <div className={`p-1 rounded text-xs ${conv.channel === 'email' ? 'bg-blue-50 text-blue-600' : conv.channel === 'sms' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#0077b5]'}`}>
                            {conv.channel === 'email' && <Mail size={12} />}
                            {conv.channel === 'sms' && <MessageSquare size={12} />}
                            {conv.channel === 'linkedin' && <Linkedin size={12} />}
                         </div>
                         {conv.unreadCount > 0 && (
                            <div className="w-2 h-2 rounded-full bg-[#0ea5e9]"></div>
                         )}
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
             <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#e0f2fe] flex justify-between items-center bg-white">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold">
                         {selectedConversation.leadName.charAt(0)}
                      </div>
                      <div>
                         <h3 className="font-medium text-[#1f1f1f]">{selectedConversation.leadName}</h3>
                         <p className="text-xs text-[#444746] flex items-center gap-1">
                            {selectedConversation.leadEmail || 'No Email'} • 
                            <span className="capitalize">{selectedConversation.channel}</span>
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <button className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]">
                          <Phone size={18} />
                       </button>
                       <button className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]">
                          <MoreVertical size={18} />
                       </button>
                   </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
                   {selectedConversation.messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-[#444746] text-sm opacity-60">
                         <p>Start the conversation with {selectedConversation.leadName}</p>
                      </div>
                   ) : (
                      selectedConversation.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                              msg.sender === 'user' 
                              ? 'bg-[#0ea5e9] text-white rounded-br-none' 
                              : 'bg-white border border-[#e0f2fe] text-[#1f1f1f] rounded-bl-none'
                           }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-2 text-right ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                 {formatTime(msg.timestamp)}
                              </p>
                           </div>
                        </div>
                      ))
                   )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-[#e0f2fe]">
                   <div className="flex flex-col gap-2">
                      <textarea 
                         value={replyText}
                         onChange={(e) => setReplyText(e.target.value)}
                         placeholder="Type your reply..."
                         className="w-full p-3 bg-[#f8fafc] rounded-xl border border-[#e0f2fe] focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-sm resize-none"
                         rows={3}
                      />
                      <div className="flex justify-between items-center">
                         <div className="flex gap-2">
                            <button className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]" title="Attach File">
                               <Paperclip size={18} />
                            </button>
                            <button className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]" title="Schedule Send">
                               <Clock size={18} />
                            </button>
                         </div>
                         <button 
                           onClick={handleSendReply}
                           disabled={!replyText.trim()}
                           className="flex items-center gap-2 px-6 py-2 bg-[#1f1f1f] text-white rounded-full text-sm font-medium hover:bg-black transition-all disabled:opacity-50"
                         >
                            <Send size={16} /> Send Reply
                         </button>
                      </div>
                   </div>
                </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-[#444746] opacity-60">
                <MessageSquare size={48} className="mb-4" />
                <p>Select a conversation to start messaging</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default Inbox;
