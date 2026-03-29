import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { socket } = useSocket();
  const [status, setStatus] = useState<'idle' | 'waiting' | 'code' | 'success' | 'error'>('idle');
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setAuthUrl(null);
      setErrorMsg(null);
      setCode('');
      setState('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onAuthUrl = (payload: { channelId: string; url: string; method: string }) => {
      setAuthUrl(payload.url);
      setStatus('code');
    };
    socket.on('notification:auth_url', onAuthUrl);
    return () => {
      socket.off('notification:auth_url', onAuthUrl);
    };
  }, [open, socket]);

  const handleLogin = () => {
    setStatus('waiting');
    setErrorMsg(null);
    socket.emit('login', { method: 'oauth' }, (res) => {
      if (!res.success) {
        setStatus('error');
        setErrorMsg(res.error ?? 'Login failed');
      }
    });
  };

  const handleSubmitCode = () => {
    setStatus('waiting');
    socket.emit('submit_oauth_code', { code, state }, (res) => {
      if (res.success) {
        setStatus('success');
        setTimeout(onClose, 1500);
      } else {
        setStatus('error');
        setErrorMsg(res.error ?? 'OAuth failed');
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent title="Login to Claude">
        {status === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Login to Claude to use your account. An active session is required.
            </p>
            <button
              type="button"
              onClick={handleLogin}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 text-sm"
            >
              Login with Browser
            </button>
          </div>
        )}

        {status === 'waiting' && (
          <p className="text-sm text-text-muted animate-pulse">Connecting...</p>
        )}

        {status === 'code' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">Open the URL below and authorize access:</p>
            {authUrl && (
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent underline break-all"
              >
                {authUrl}
              </a>
            )}
            <div className="flex flex-col gap-2 mt-2">
              <label htmlFor="auth-code" className="text-xs text-text-muted">
                Authorization Code
              </label>
              <input
                id="auth-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code here"
                className="bg-input-bg border border-border rounded px-3 py-1.5 text-sm text-text"
              />
              <label htmlFor="auth-state" className="text-xs text-text-muted">
                State (if provided)
              </label>
              <input
                id="auth-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State parameter"
                className="bg-input-bg border border-border rounded px-3 py-1.5 text-sm text-text"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmitCode}
              disabled={!code}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 text-sm disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        )}

        {status === 'success' && <p className="text-sm text-success">Login successful!</p>}

        {status === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-danger">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="px-4 py-2 bg-surface-hover text-text rounded text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {status !== 'success' && (
          <div className="flex justify-end mt-3">
            <DialogClose asChild>
              <button
                type="button"
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text rounded"
              >
                Cancel
              </button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
