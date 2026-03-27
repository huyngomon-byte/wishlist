import { useEffect, useMemo, useState } from "react";
import EditorAccessCard from "../components/EditorAccessCard";
import {
  DEFAULT_DATE,
  createParsedMilestones,
  getAnniversaryDate,
} from "../lib/anniversary";
import {
  addMilestoneToStore,
  ensureCalendarStoreReady,
  removeMilestoneFromStore,
  subscribeToMilestones,
} from "../lib/calendarStore";
import type { CustomMilestone } from "../lib/anniversary";

type CalendarPageProps = {
  isEditor: boolean;
  editKey: string;
  onEditKeyChange: (value: string) => void;
  onUnlock: () => void;
  onLock: () => void;
};

export default function CalendarPage({
  isEditor,
  editKey,
  onEditKeyChange,
  onUnlock,
  onLock,
}: CalendarPageProps) {
  const [customMilestones, setCustomMilestones] = useState<CustomMilestone[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(DEFAULT_DATE);
  const [note, setNote] = useState("");

  useEffect(() => {
    void ensureCalendarStoreReady();

    const unsubscribe = subscribeToMilestones(setCustomMilestones);
    return () => unsubscribe();
  }, []);

  const startDate = getAnniversaryDate();
  const milestones = useMemo(() => createParsedMilestones(customMilestones, new Date()), [customMilestones]);

  const nextMilestone = milestones.find((item) => !item.isPast);

  const addMilestone = async () => {
    if (!isEditor) {
      window.alert("Cần mở quyền chỉnh sửa để thêm mốc nha");
      return;
    }

    if (!title.trim()) {
      window.alert("Nhập tên mốc trước nha");
      return;
    }

    if (!date) {
      window.alert("Chọn ngày cho mốc này nha");
      return;
    }

    try {
      await addMilestoneToStore({
        title: title.trim(),
        date,
        note: note.trim(),
      });

      setTitle("");
      setDate(DEFAULT_DATE);
      setNote("");
    } catch {
      window.alert("Lưu mốc chưa thành công, thử lại giúp mình nha");
    }
  };

  const removeMilestone = async (id: string) => {
    if (!isEditor) {
      window.alert("Cần mở quyền chỉnh sửa để xóa mốc nha");
      return;
    }

    try {
      await removeMilestoneFromStore(id);
    } catch {
      window.alert("Xóa mốc chưa thành công, thử lại giúp mình nha");
    }
  };

  return (
    <div className="container">
      <EditorAccessCard
        isEditor={isEditor}
        editKey={editKey}
        onEditKeyChange={onEditKeyChange}
        onUnlock={onUnlock}
        onLock={onLock}
        lockedText="Nhập key để chỉnh sửa Home, Lịch và Wishlist"
      />

      <div className="header-card">
        <div className="rose">📆</div>
        <div>
          <h1 className="title">Lịch kỷ niệm</h1>
          <p className="subtitle">
            Ngày bắt đầu đã cố định là 09/02/2023, còn các kỷ niệm tiếp theo sẽ do bạn thêm ở đây.
          </p>
        </div>
      </div>

      <section className="highlight-card">
        <p className="eyebrow">💘 NGÀY BẮT ĐẦU</p>
        <h2 className="highlight-title">{startDate.toLocaleDateString("vi-VN")}</h2>
        <p className="section-desc compact">
          {nextMilestone
            ? `Mốc gần nhất là "${nextMilestone.title}" còn ${nextMilestone.daysAway} ngày nữa.`
            : "Chưa có cột mốc nào được thêm. Tạo mốc đầu tiên của tụi mình ở bên dưới nha."}
        </p>
      </section>

      <section className="form-card">
        <p className="eyebrow">✨ THÊM MỐC RIÊNG</p>
        <label className="label">📝 TÊN MỐC</label>
        <input
          className="input"
          placeholder="Ví dụ: Sinh nhật em, chuyến đi Đà Lạt..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={!isEditor}
        />

        <label className="label">📅 NGÀY</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value || DEFAULT_DATE)}
          disabled={!isEditor}
        />

        <label className="label">✎ GHI CHÚ</label>
        <textarea
          className="input textarea"
          placeholder="Ví dụ: đặt bàn trước, mua hoa, chụp ảnh..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={!isEditor}
        />

        {isEditor ? (
          <button className="submit-btn" type="button" onClick={() => void addMilestone()}>
            Lưu mốc mới 💌
          </button>
        ) : (
          <div className="view-only-note">Đang ở chế độ chỉ xem. Mở quyền để thêm và xóa mốc.</div>
        )}
      </section>

      <section className="timeline">
        {milestones.length === 0 ? (
          <div className="empty-card">
            Chưa có mốc nào cả. Thêm sinh nhật, chuyến đi, ngày đặc biệt đầu tiên cho tụi mình nha. 💭
          </div>
        ) : (
          milestones.map((item) => (
            <article
              key={`${item.id}-${item.parsedDate.toISOString()}`}
              className={item.isPast ? "timeline-card passed" : "timeline-card"}
            >
              <div>
                <p className="timeline-title">💗 {item.title}</p>
                <p className="timeline-note">
                  {item.note || "Mốc này đang chờ tụi mình viết thêm điều dễ thương vào."}
                </p>
              </div>
              <div className="timeline-date-wrap">
                <strong className="timeline-date">{item.parsedDate.toLocaleDateString("vi-VN")}</strong>
                <span className="timeline-status">{item.isPast ? "Đã qua" : "Sắp tới"}</span>
                <span className="timeline-countdown">
                  {item.isPast ? "Lưu trong kỷ niệm" : `${item.daysAway} ngày nữa`}
                </span>
                {isEditor && (
                  <button className="timeline-delete" type="button" onClick={() => void removeMilestone(item.id)}>
                    🗑 Xóa
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
