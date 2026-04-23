import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';

const Chat = () => {
    const { plotId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const dummyScroll = useRef();

    // 1. Load messages from Python Backend
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/messages/${plotId}`);
                const data = await response.json();
                setMessages(data);
                dummyScroll.current?.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
        // For real-time, you could use a setInterval(fetchMessages, 3000) 
        // until you learn WebSockets in Python.
    }, [plotId]);

    // 2. Send message to Python Backend
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            text: newMessage,
            plotId: plotId,
            uid: "user_123", // Replace with your Python Auth logic later
            displayName: "Guest"
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                setMessages([...messages, { ...messageData, id: Date.now() }]);
                setNewMessage('');
                dummyScroll.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* ... Your existing Header UI ... */}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.uid === "user_123" ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.uid === "user_123" ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'
                            }`}>
                            <p className="text-xs opacity-50">{msg.displayName}</p>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <span ref={dummyScroll}></span>
            </div>

            {/* ... Your existing Input Form UI ... */}
        </div>
    );
};

export default Chat;