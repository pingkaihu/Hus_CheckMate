import { useEffect, useState } from 'react';

interface Props {
  message: string;
  onDone: () => void;
}

export function CompletionToast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold shadow-xl text-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        background: 'linear-gradient(180deg, #faf6ec, #f2ead8)',
        border: '2px solid #c8a870',
        color: '#8b6010',
        fontFamily: 'Georgia, serif',
        boxShadow: '0 8px 24px rgba(100,70,20,0.25)',
      }}
    >
      {message}
    </div>
  );
}
