import { useChannelControl } from '@/contexts/channel';
import { btwSignal, useBtwState } from '@/features/btw/btw-feature';
import { ContentPreviewDialog } from './dialogs/ContentPreviewDialog.tsx';
import { ElicitationDialog } from './dialogs/ElicitationDialog.tsx';
import { SideQuestionDialog } from './dialogs/SideQuestionDialog.tsx';

const closeSideQuestion = () => btwSignal.setState({ open: false });

export function ChannelOverlays(): React.ReactNode {
  const {
    pendingDiffReview,
    diffRespond,
    clearPendingDiffReview,
    pendingElicitation,
    respondToElicitation,
    cancelElicitation,
  } = useChannelControl();
  const sideQuestion = useBtwState();

  return (
    <>
      {pendingDiffReview && (
        <ContentPreviewDialog
          content=""
          title={pendingDiffReview.filePath ?? 'Diff'}
          diffs={[
            {
              filePath: pendingDiffReview.filePath,
              oldContent: pendingDiffReview.oldContent,
              newContent: pendingDiffReview.newContent,
            },
          ]}
          pendingDiffToolId={pendingDiffReview.toolId}
          onDiffRespond={(toolId, accepted) => {
            diffRespond(toolId, accepted);
            clearPendingDiffReview();
          }}
          onClose={clearPendingDiffReview}
        />
      )}
      {pendingElicitation && (
        <ElicitationDialog
          requestId={pendingElicitation.requestId}
          prompt={pendingElicitation.prompt}
          inputType={pendingElicitation.inputType}
          options={pendingElicitation.options}
          url={pendingElicitation.url}
          onSubmit={respondToElicitation}
          onCancel={cancelElicitation}
        />
      )}
      <SideQuestionDialog
        open={sideQuestion.open}
        question={sideQuestion.question}
        answer={sideQuestion.answer}
        loading={sideQuestion.loading}
        error={sideQuestion.error}
        onClose={closeSideQuestion}
      />
    </>
  );
}
