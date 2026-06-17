import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

export function useInactivity(timeoutMs = 600_000) {
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => navigate('/'), timeoutMs);
    };

    EVENTS.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer.current);
      EVENTS.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [navigate, timeoutMs]);
}
