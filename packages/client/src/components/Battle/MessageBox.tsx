interface MessageBoxProps {
  message: string;
}

export function MessageBox({ message }: MessageBoxProps) {
  return (
    <div className="message-box" data-testid="message-box">
      <div className="message-box-content">{message}</div>
    </div>
  );
}
