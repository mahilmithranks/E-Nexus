import { useState, useEffect } from 'react';

const Timer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();

            if (difference > 0) {
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

                // Set urgent status if less than 2 minutes remaining
                setIsUrgent(difference < 120000);
            } else {
                setTimeLeft('00:00');
                setIsUrgent(true);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!targetDate) return null;

    return (
        <span className={`timer-display ${isUrgent ? 'urgent' : ''}`} style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: isUrgent ? '#ef4444' : '#10b981',
            marginLeft: '10px',
            fontSize: '1em',
            padding: '2px 8px',
            backgroundColor: isUrgent ? '#fee2e2' : '#d1fae5',
            borderRadius: '4px',
            border: `1px solid ${isUrgent ? '#fca5a5' : '#6ee7b7'}`
        }}>
            ⏱ {timeLeft}
        </span>
    );
};

export default Timer;
