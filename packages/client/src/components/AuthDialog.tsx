import { useEffect, useState } from 'react';
import { useChannelConfig } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { Button } from './ui/Button';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps): React.JSX.Element {
  const { auth, login, submitOAuthCode, resetAuth } = useSession();
  const { providerConfig } = useChannelConfig();
  const [code, setCode] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (!open) {
      resetAuth();
      setCode('');
      setState('');
    }
  }, [open, resetAuth]);

  useEffect(() => {
    if (auth.status === 'success') {
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [auth.status, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent title={providerConfig?.brand.loginTitle ?? 'Login to Claude'}>
        {auth.status === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Login to {providerConfig?.brand.name ?? 'Claude'} to use your account. An active
              session is required.
            </p>
            <Button size="md" onClick={login}>
              Login with Browser
            </Button>
          </div>
        )}

        {auth.status === 'waiting' && (
          <p className="text-sm text-text-muted animate-pulse">Connecting...</p>
        )}

        {auth.status === 'code' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">Open the URL below and authorize access:</p>
            {auth.authUrl && (
              <a
                href={auth.authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent underline break-all"
              >
                {auth.authUrl}
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
            <Button size="md" onClick={() => submitOAuthCode(code, state)} disabled={!code}>
              Submit
            </Button>
          </div>
        )}

        {auth.status === 'success' && <p className="text-sm text-success">Login successful!</p>}

        {auth.status === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-danger">{auth.errorMsg}</p>
            <Button variant="secondary" size="md" onClick={resetAuth}>
              Try Again
            </Button>
          </div>
        )}

        {auth.status !== 'success' && (
          <div className="flex justify-end mt-3">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
