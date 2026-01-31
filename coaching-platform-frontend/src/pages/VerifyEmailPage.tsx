import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { verifyAndLogin, resendOtp } = useAuth();

    const email = searchParams.get('email');

    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(`An OTP has been sent to ${email}. Please check your inbox.`);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(30); // Changed to 30 seconds
    const { addNotification } = useNotification();

    // Redirect if email is not in the URL
    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    // Timer for the "Resend OTP" button
    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0) {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);


    const handleVerificationSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!email) {
            setError("Email is missing. Please return to registration.");
            return;
        }
        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        setIsLoading(true);
        try {
            await verifyAndLogin({ email, otp });
            addNotification('Email verified successfully!', 'success');
            navigate('/'); 
        } catch (err: any) {
            addNotification(err.message || 'Verification failed. Please check the OTP and try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !email) return;

        setError(null);
        setMessage("Sending a new OTP...");
        try {
            const responseMessage = await resendOtp(email);
            addNotification(responseMessage, 'info');
            setResendCooldown(30); // Reset to 30 seconds
        } catch (err: any) {
            // Handle cooldown error from backend
            if (err.cooldownRemaining) {
                setResendCooldown(err.cooldownRemaining);
                addNotification(err.message || 'Please wait before requesting a new OTP.', 'warning');
            } else {
                addNotification(err.message || 'Failed to resend OTP.', 'error');
            }
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Verify Your Email</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>Enter the 6-digit OTP sent to <strong>{email}</strong>.</p>
            <form onSubmit={handleVerificationSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="otp">One-Time Password (OTP):</label>
                    <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                    />
                </div>
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px', backgroundColor: isLoading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p>Didn't receive the code?</p>
                <button onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#999' : '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmailPage;