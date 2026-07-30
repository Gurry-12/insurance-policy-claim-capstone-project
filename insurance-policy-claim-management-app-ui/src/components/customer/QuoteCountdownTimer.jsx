import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const QuoteCountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const target = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    updateTimer(); // Initial call
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, onExpire]);

  return (
    <div className={`d-flex align-items-center ${isExpired ? 'text-danger' : 'text-warning'}`}>
      <Clock size={16} className="me-2" />
      <span className="fw-bold">{timeLeft}</span>
    </div>
  );
};

export default QuoteCountdownTimer;
