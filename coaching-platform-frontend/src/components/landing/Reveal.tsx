import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

type RevealProps = {
    children: React.ReactNode;
    delay?: number;
};

/**
 * Scroll-triggered fade + slide up animation.
 */
const Reveal: React.FC<RevealProps> = (props: RevealProps) => {
    const { children, delay = 0 } = props;
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setVisible(true), delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <Box
            ref={ref}
            sx={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
        >
            {children}
        </Box>
    );
};

export default Reveal;
