import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify, onError, onExpire }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    // If no siteKey configured or placeholder, emulate verification in dev
    if (!siteKey || siteKey === '0x0000000000000000000000') {
      onVerify?.('cf-turnstile-dev-token');
      return;
    }

    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');

    const initWidget = () => {
      if (window.turnstile && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'dark',
            callback: (token) => onVerify?.(token),
            'error-callback': () => onError?.(),
            'expired-callback': () => onExpire?.(),
          });
          setIsLoaded(true);
        } catch {
          // fallback if rendering fails
          onVerify?.('cf-turnstile-dev-token');
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      initWidget();
    } else {
      script.addEventListener('load', initWidget);
    }

    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  // If running in development without key or placeholder key
  if (!siteKey || siteKey === '0x0000000000000000000000') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 212, 170, 0.08)',
          border: '1px solid rgba(0, 212, 170, 0.2)',
          color: 'var(--color-accent)',
          fontSize: 'var(--text-xs)',
          width: 'fit-content',
          margin: 'var(--space-sm) 0',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Protected by Cloudflare Turnstile (Dev Mode)</span>
      </div>
    );
  }

  return (
    <div style={{ margin: 'var(--space-md) 0', minHeight: '65px' }}>
      <div ref={containerRef} />
    </div>
  );
});

export default TurnstileWidget;
