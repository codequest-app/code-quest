import { useProjectActions } from '../contexts/ProjectContext';
import { ResumePicker } from './ResumePicker';
import { Dialog, DialogContent } from './ui/Dialog';

interface ResumeSessionsDialogProps {
  cwd: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeSessionsDialog({ cwd, open, onOpenChange }: ResumeSessionsDialogProps) {
  const { setActiveProject, requestActivateChannel } = useProjectActions();

  function handleResume(channelId: string) {
    setActiveProject(cwd);
    requestActivateChannel(cwd, channelId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Resume session" className="w-[480px]">
        <ResumePicker cwd={cwd} onResume={handleResume} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
