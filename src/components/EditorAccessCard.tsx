type EditorAccessCardProps = {
  isEditor: boolean;
  editKey: string;
  onEditKeyChange: (value: string) => void;
  onUnlock: () => void;
  onLock: () => void;
  lockedText: string;
};

export default function EditorAccessCard({
  isEditor,
  editKey,
  onEditKeyChange,
  onUnlock,
  onLock,
  lockedText,
}: EditorAccessCardProps) {
  return (
    <div className="auth-bar">
      {isEditor ? (
        <div className="auth-box">
          <span className="auth-text">Đang mở quyền chỉnh sửa cho cả app</span>
          <button className="auth-btn" type="button" onClick={onLock}>
            Khóa lại
          </button>
        </div>
      ) : (
        <div className="auth-box">
          <span className="auth-text">{lockedText}</span>
          <div className="auth-input-row">
            <input
              className="input"
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Nhập key chỉnh sửa..."
              value={editKey}
              onChange={(event) => onEditKeyChange(event.target.value)}
            />
            <button className="auth-btn" type="button" onClick={onUnlock}>
              Mở quyền
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
