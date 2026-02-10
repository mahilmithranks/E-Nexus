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
        <span className={`${isUrgent ? 'text-[#f05423] animate-pulse' : 'text-[#ff9d00]'} font-mono font-black tracking-tighter`}>
            {timeLeft}
        </span>
    );
};

export default Timer;
