import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Paper, keyframes } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { sendChatMessage, type ChatMessage } from '../../../services/aiService';

interface ChatInterfaceProps {
    userName: string;
}

const typingAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
`;

const TypingIndicator = () => (
    <Paper
        elevation={0}
        sx={{
            p: 1.5,
            mb: 1.5,
            bgcolor: 'grey.200',
            ml: 0,
            mr: 'auto',
            maxWidth: 'fit-content',
            borderRadius: '20px 20px 20px 4px',
            display: 'flex',
            alignItems: 'center',
        }}
    >
        <Box sx={{
            height: '8px',
            width: '8px',
            bgcolor: 'grey.600',
            borderRadius: '50%',
            display: 'inline-block',
            animation: `${typingAnimation} 1.4s infinite ease-in-out both`,
        }} />
        <Box sx={{
            height: '8px',
            width: '8px',
            bgcolor: 'grey.600',
            borderRadius: '50%',
            display: 'inline-block',
            animation: `${typingAnimation} 1.4s infinite ease-in-out both`,
            animationDelay: '0.2s',
            mx: 0.5,
        }} />
        <Box sx={{
            height: '8px',
            width: '8px',
            bgcolor: 'grey.600',
            borderRadius: '50%',
            display: 'inline-block',
            animation: `${typingAnimation} 1.4s infinite ease-in-out both`,
            animationDelay: '0.4s',
        }} />
    </Paper>
);


const ChatInterface: React.FC<ChatInterfaceProps> = ({ userName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: `Hi ${userName}! How can I help you today?` }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSendMessage = async (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) event.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponseText = await sendChatMessage({ message: input, history: messages });
            const aiMessage: ChatMessage = { role: 'model', parts: [{ text: aiResponseText }] };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "I'm sorry, I'm having trouble connecting. Please try again later." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ mb: 2, flexShrink: 0, textAlign: 'center' }}>
                AI Assistant
            </Typography>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, p: 1 }}>
                {messages.map((msg, index) => (
                    <Paper 
                        key={index}
                        elevation={0}
                        sx={{
                            p: 1.5,
                            mb: 1.5,
                            bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                            color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                            ml: msg.role === 'user' ? 'auto' : 0,
                            mr: msg.role === 'user' ? 0 : 'auto',
                            maxWidth: '85%',
                            width: 'fit-content',
                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                    >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</Typography>
                    </Paper>
                ))}
                {/* --- UPDATED: Show the new typing indicator while loading --- */}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </Box>

            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Ask a question..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                />
                <IconButton type="submit" color="primary" disabled={isLoading || !input.trim()}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default ChatInterface;
