import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import EditorAccessCard from "../components/EditorAccessCard";
import {
  DEFAULT_DATE,
  differenceInDays,
  getAnniversaryDate,
  readCustomMilestones,
} from "../lib/anniversary";
import { db } from "../firebase/config";

type HomePageProps = {
  isEditor: boolean;
  editKey: string;
  onEditKeyChange: (value: string) => void;
  onUnlock: () => void;
  onLock: () => void;
};

type HeartBurst = {
  id: number;
  x: number;
  delay: number;
  scale: number;
};

const DEFAULT_AVATARS = {
  trang: "/anh-1.webp",
  huy: "/anh-2.webp",
} as const;

const homeConfigRef = doc(db, "appConfig", "home");

const resizeImageToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("image_invalid"));
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas_unavailable"));
          return;
        }

        const shortest = Math.min(image.width, image.height);
        const sx = (image.width - shortest) / 2;
        const sy = (image.height - shortest) / 2;

        context.drawImage(image, sx, sy, shortest, shortest, 0, 0, size, size);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };

      image.src = typeof reader.result === "string" ? reader.result : "";
    };

    reader.readAsDataURL(file);
  });

export default function HomePage({
  isEditor,
  editKey,
  onEditKeyChange,
  onUnlock,
  onLock,
}: HomePageProps) {
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [nextMilestoneText, setNextMilestoneText] = useState("Chưa có mốc nào");
  const [nextMilestoneDate, setNextMilestoneDate] = useState("Thêm mốc ở trang Lịch");
  const [trangAvatar, setTrangAvatar] = useState<string>(DEFAULT_AVATARS.trang);
  const [huyAvatar, setHuyAvatar] = useState<string>(DEFAULT_AVATARS.huy);
  const [uploadingKey, setUploadingKey] = useState<"trang" | "huy" | null>(null);
  const [heartBursts, setHeartBursts] = useState<HeartBurst[]>([]);

  const start = getAnniversaryDate();
  const today = new Date();
  const totalDays = differenceInDays(start, today) + 1;

  useEffect(() => {
    const unsubscribe = onSnapshot(homeConfigRef, (snapshot) => {
      const data = snapshot.data() as { trangAvatar?: string; huyAvatar?: string } | undefined;

      setTrangAvatar(data?.trangAvatar || DEFAULT_AVATARS.trang);
      setHuyAvatar(data?.huyAvatar || DEFAULT_AVATARS.huy);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const milestones = readCustomMilestones()
      .map((item) => ({
        ...item,
        parsedDate: new Date(item.date),
      }))
      .filter((item) => !Number.isNaN(item.parsedDate.getTime()))
      .sort((first, second) => first.parsedDate.getTime() - second.parsedDate.getTime());

    setMilestoneCount(milestones.length);

    const upcoming = milestones.find((item) => item.parsedDate >= today);
    if (upcoming) {
      setNextMilestoneText(`Còn ${differenceInDays(today, upcoming.parsedDate)} ngày`);
      setNextMilestoneDate(upcoming.title);
      return;
    }

    setNextMilestoneText("Chưa có mốc nào");
    setNextMilestoneDate("Thêm mốc ở trang Lịch");
  }, []);

  const startDateText = useMemo(() => new Date(DEFAULT_DATE).toLocaleDateString("vi-VN"), []);

  const popHearts = () => {
    const createdAt = Date.now();
    const bursts = Array.from({ length: 7 }, (_, index) => ({
      id: createdAt + index,
      x: (index - 3) * 18 + Math.round(Math.random() * 10 - 5),
      delay: index * 0.05,
      scale: 0.8 + Math.random() * 0.6,
    }));

    setHeartBursts((current) => [...current, ...bursts]);

    window.setTimeout(() => {
      setHeartBursts((current) => current.filter((item) => !bursts.some((burst) => burst.id === item.id)));
    }, 1400);
  };

  const handleAvatarChange =
    (key: "trang" | "huy", setter: (value: string) => void) =>
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!isEditor) {
        event.target.value = "";
        window.alert("Cần mở quyền chỉnh sửa để đổi ảnh nha");
        return;
      }

      try {
        setUploadingKey(key);
        const dataUrl = await resizeImageToDataUrl(file);

        await setDoc(
          homeConfigRef,
          key === "trang" ? { trangAvatar: dataUrl } : { huyAvatar: dataUrl },
          { merge: true },
        );

        setter(dataUrl);
      } catch {
        window.alert("Đổi ảnh chưa thành công, thử lại giúp mình nha");
      } finally {
        setUploadingKey(null);
        event.target.value = "";
      }
    };

  const handleAvatarReset =
    (key: "trang" | "huy", setter: (value: string) => void) => async () => {
      if (!isEditor) {
        window.alert("Cần mở quyền chỉnh sửa để xóa ảnh nha");
        return;
      }

      try {
        setUploadingKey(key);
        const defaultAvatar = DEFAULT_AVATARS[key];

        await setDoc(
          homeConfigRef,
          key === "trang" ? { trangAvatar: defaultAvatar } : { huyAvatar: defaultAvatar },
          { merge: true },
        );

        setter(defaultAvatar);
      } catch {
        window.alert("Xóa ảnh chưa thành công, thử lại giúp mình nha");
      } finally {
        setUploadingKey(null);
      }
    };

  return (
    <div className="container home-page">
      <EditorAccessCard
        isEditor={isEditor}
        editKey={editKey}
        onEditKeyChange={onEditKeyChange}
        onUnlock={onUnlock}
        onLock={onLock}
        lockedText="Nhập key để chỉnh sửa Home, Lịch và Wishlist"
      />

      <h1 className="home-page-title dark solo">Mãi Bên Nhau Nhé ❤️</h1>

      <section className="love-hero dark">
        <div className="love-hero-overlay dark"></div>
        <div className="love-hero-content">
          <p className="love-hero-label">CHÚNG TA ĐÃ BÊN NHAU ĐƯỢC</p>
          <h2 className="love-hero-days">{totalDays.toLocaleString("vi-VN")}</h2>
          <p className="love-hero-subtitle">Ngày Hạnh Phúc</p>

          <div className="love-hero-avatars">
            <div className="love-avatar-block">
              <div className="love-avatar">
                <img src={trangAvatar} alt="Trang" />
              </div>
              <span>TRANG</span>
              <label className={isEditor ? "avatar-upload" : "avatar-upload disabled"}>
                {uploadingKey === "trang" ? "Đang tải..." : "🖼 Đổi ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange("trang", setTrangAvatar)}
                  disabled={!isEditor}
                />
              </label>
              <button
                className="avatar-reset"
                type="button"
                onClick={handleAvatarReset("trang", setTrangAvatar)}
                disabled={!isEditor}
              >
                🗑 Xóa ảnh
              </button>
            </div>

            <button className="love-heart-badge interactive" type="button" onClick={popHearts} aria-label="Thả tim">
              💗
              <span className="heart-burst-layer" aria-hidden="true">
                {heartBursts.map((heart) => (
                  <span
                    key={heart.id}
                    className="burst-heart"
                    style={
                      {
                        "--burst-x": `${heart.x}px`,
                        "--burst-delay": `${heart.delay}s`,
                        "--burst-scale": `${heart.scale}`,
                      } as CSSProperties
                    }
                  >
                    ❤️
                  </span>
                ))}
              </span>
            </button>

            <div className="love-avatar-block">
              <div className="love-avatar">
                <img src={huyAvatar} alt="Huy" />
              </div>
              <span>HUY</span>
              <label className={isEditor ? "avatar-upload" : "avatar-upload disabled"}>
                {uploadingKey === "huy" ? "Đang tải..." : "🖼 Đổi ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange("huy", setHuyAvatar)}
                  disabled={!isEditor}
                />
              </label>
              <button
                className="avatar-reset"
                type="button"
                onClick={handleAvatarReset("huy", setHuyAvatar)}
                disabled={!isEditor}
              >
                🗑 Xóa ảnh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-insights dark">
        <article className="home-insight-card dark">
          <p className="home-insight-label">📅 KỶ NIỆM TIẾP THEO</p>
          <strong className="home-insight-value">{nextMilestoneText}</strong>
          <span className="home-insight-note">{nextMilestoneDate}</span>
        </article>

        <article className="home-insight-card dark">
          <p className="home-insight-label">✨ CỘT MỐC</p>
          <strong className="home-insight-value">{milestoneCount} tổng cộng</strong>
          <span className="home-insight-note">
            {milestoneCount === 0 ? "Chưa có mốc nào" : "Đã lưu trong trang lịch"}
          </span>
        </article>
      </section>

      <a href="#/lich" className="home-action-card dark">
        <div>
          <strong>💞 Lên lịch hẹn hò</strong>
          <p>Khám phá những ngày quan trọng và thêm mốc riêng của tụi mình.</p>
        </div>
        <span className="home-action-arrow">→</span>
      </a>

      <section className="home-date-card dark">
        <p className="label">💖 NGÀY YÊU NHAU</p>
        <div className="fixed-date-row">
          <strong>{startDateText}</strong>
          <span>Cố định từ ngày bắt đầu</span>
        </div>
      </section>
    </div>
  );
}
