import React, { useState, useEffect } from 'react';
import { Fab, Paper, Slide } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import LeadCaptureForm from './LeadCaptureForm';
import ChatInterface from './ChatInterface'; 

const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const leadSubmitted = sessionStorage.getItem('chatbot_lead_submitted');
        const name = sessionStorage.getItem('chatbot_user_name');
        if (leadSubmitted === 'true' && name) {
            setHasSubmittedLead(true);
            setUserName(name);
        }
    }, []);

    const handleToggleChat = () => {
        setIsOpen(prev => !prev);
    };

    const handleLeadSuccess = (submittedName: string) => {
        sessionStorage.setItem('chatbot_lead_submitted', 'true');
        sessionStorage.setItem('chatbot_user_name', submittedName);
        
        setUserName(submittedName);
        setHasSubmittedLead(true);
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="chat"
                onClick={handleToggleChat}
                sx={{ position: 'fixed', bottom: 8, right: 8, zIndex: 1300 }}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Fab>

            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 65, sm: 32 },
                        right: { xs: 30, sm: 32 },
                        width: { xs: 'calc(100% - 40px)', sm: 380 },
                        height: hasSubmittedLead ? { xs: '70vh', sm: 480 } : 'auto',
                        maxHeight: { xs: 'calc(100vh - 100px)', sm: 500 },
                        zIndex: 1299,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {hasSubmittedLead ? (
                        <ChatInterface userName={userName} />
                    ) : (
                        <LeadCaptureForm onSuccess={handleLeadSuccess} />
                    )}
                </Paper>
            </Slide>
        </>
    );
};

export default ChatbotWidget;