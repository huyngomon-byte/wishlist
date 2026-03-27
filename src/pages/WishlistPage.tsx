import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import EditorAccessCard from "../components/EditorAccessCard";
import { db } from "../firebase/config";

type GiftItem = {
  id?: string;
  name: string;
  price: string;
  note: string;
  link: string;
  bought?: boolean;
  priority: "uoc" | "thich" | "muon";
};

type WishlistPageProps = {
  isEditor: boolean;
  editKey: string;
  onEditKeyChange: (value: string) => void;
  onUnlock: () => void;
  onLock: () => void;
};

export default function WishlistPage({
  isEditor,
  editKey,
  onEditKeyChange,
  onUnlock,
  onLock,
}: WishlistPageProps) {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState<"uoc" | "thich" | "muon">("muon");
  const [tab, setTab] = useState<"form" | "list">("form");

  useEffect(() => {
    const giftsQuery = query(collection(db, "gifts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(giftsQuery, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<GiftItem, "id">),
      }));

      setGifts(items);
    });

    return () => unsubscribe();
  }, []);

  const parsePrice = (value: string) => {
    if (!value) return 0;

    const text = value.toLowerCase().trim().replace(/\s/g, "");

    if (text.includes("tr")) {
      return parseFloat(text.replace("tr", "").replace(",", ".")) * 1000000;
    }

    if (text.includes("k")) {
      return parseFloat(text.replace("k", "").replace(",", ".")) * 1000;
    }

    return Number(text.replace(/[^\d]/g, ""));
  };

  const formatPrice = (value: string) => {
    const parsed = parsePrice(value);
    if (!parsed) return value;
    return `${parsed.toLocaleString("vi-VN")}đ`;
  };

  const addGift = async () => {
    if (!isEditor) {
      window.alert("Cần mở quyền chỉnh sửa để thêm wishlist nha");
      return;
    }

    if (!name.trim()) {
      window.alert("Nhập tên quà trước nha");
      return;
    }

    await addDoc(collection(db, "gifts"), {
      name,
      price,
      note,
      link,
      priority,
      bought: false,
      createdAt: serverTimestamp(),
    });

    setName("");
    setPrice("");
    setNote("");
    setLink("");
    setPriority("muon");
    setTab("list");
  };

  const deleteGift = async (id?: string) => {
    if (!isEditor || !id) return;

    const ok = window.confirm("Xóa món quà này nha?");
    if (!ok) return;

    await deleteDoc(doc(db, "gifts", id));
  };

  const toggleBought = async (id?: string, currentBought?: boolean) => {
    if (!isEditor || !id) return;

    await updateDoc(doc(db, "gifts", id), {
      bought: !currentBought,
    });
  };

  const getPriorityText = (value: GiftItem["priority"]) => {
    if (value === "uoc") return "☁️ Ước thôi";
    if (value === "thich") return "🌷 Thích nha";
    return "🥺 Muốn lắm";
  };

  const normalizeLink = (url: string) => {
    if (!url.trim()) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
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
        <div className="rose">🌹</div>
        <div>
          <h1 className="title">Wishlist của Trang</h1>
          <p className="subtitle">Những món quà em thích, anh lưu hết ở đây 💖</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={tab === "form" ? "tab active" : "tab"}
          type="button"
          onClick={() => setTab("form")}
        >
          ✨ Thêm món quà em thích
        </button>

        <button
          className={tab === "list" ? "tab active" : "tab"}
          type="button"
          onClick={() => setTab("list")}
        >
          💝 Bảng quà của anh
        </button>
      </div>

      {tab === "form" ? (
        <>
          <h2 className="section-title">Thêm một món quà em thích vào đây nha</h2>
          <p className="section-desc">
            Em cứ lưu những món mình thích trước, rồi sau này sẽ có quà bất ngờ xuất hiện.
          </p>

          <div className="form-card">
            <label className="label">♡ TÊN QUÀ TẶNG</label>
            <input
              className="input"
              placeholder="Ví dụ: Vòng tay bạc khắc tên..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!isEditor}
            />

            <label className="label">₫ GIÁ ƯỚC TÍNH</label>
            <input
              className="input"
              placeholder="Ví dụ: 500k, 1tr, 2.5tr hoặc 500000"
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={!isEditor}
            />

            <label className="label">🔗 LINK SẢN PHẨM</label>
            <input
              className="input"
              placeholder="Ví dụ: shopee.vn/... hoặc tiktok.com/..."
              value={link}
              onChange={(event) => setLink(event.target.value)}
              disabled={!isEditor}
            />

            <label className="label">ĐỘ ƯU TIÊN</label>
            <div className="priority-group">
              <button
                type="button"
                className={priority === "uoc" ? "priority active-soft" : "priority"}
                onClick={() => setPriority("uoc")}
                disabled={!isEditor}
              >
                ☁️ Ước thôi
              </button>

              <button
                type="button"
                className={priority === "thich" ? "priority active-soft" : "priority"}
                onClick={() => setPriority("thich")}
                disabled={!isEditor}
              >
                🌷 Thích nha
              </button>

              <button
                type="button"
                className={priority === "muon" ? "priority active-strong" : "priority"}
                onClick={() => setPriority("muon")}
                disabled={!isEditor}
              >
                🥺 Muốn lắm
              </button>
            </div>

            <label className="label">✎ GHI CHÚ</label>
            <textarea
              className="input textarea"
              placeholder="Ví dụ: thích kiểu tối giản, màu bạc, mua dịp sinh nhật..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={!isEditor}
            />

            {isEditor ? (
              <button className="submit-btn" type="button" onClick={addGift}>
                Lưu món quà 💌
              </button>
            ) : (
              <div className="view-only-note">Đang ở chế độ chỉ xem. Mở quyền để thêm và sửa dữ liệu.</div>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="section-title">Bảng quà của anh</h2>
          <p className="section-desc">Tất cả những món em thích đều được lưu lại ở đây để anh không quên.</p>

          <div className="list-wrap">
            {gifts.length === 0 ? (
              <div className="empty-card">Chưa có món quà nào được thêm cả 💭</div>
            ) : (
              gifts.map((gift) => (
                <div
                  className={`gift-card ${gift.bought ? "gift-card-bought" : ""}`}
                  key={gift.id}
                >
                  <div className="gift-top">
                    <h3>{gift.name}</h3>
                    <span className="badge">{getPriorityText(gift.priority)}</span>
                  </div>

                  {gift.bought && <p className="bought-text">🎁 Anh đã mua món này rồi</p>}

                  {gift.price && (
                    <p className="gift-line">
                      <strong>Giá dự tính:</strong> {formatPrice(gift.price)}
                    </p>
                  )}

                  {gift.link && (
                    <p className="gift-link">
                      <strong>Link sản phẩm:</strong>{" "}
                      <a href={normalizeLink(gift.link)} target="_blank" rel="noreferrer">
                        Xem sản phẩm
                      </a>
                    </p>
                  )}

                  {gift.note && <p className="gift-note">{gift.note}</p>}

                  {isEditor && (
                    <div className="gift-actions">
                      <button
                        className={`bought-btn ${gift.bought ? "bought-btn-active" : ""}`}
                        type="button"
                        onClick={() => toggleBought(gift.id, gift.bought)}
                      >
                        {gift.bought ? "✅ Đã mua" : "🎁 Anh đã mua"}
                      </button>

                      <button className="delete-btn" type="button" onClick={() => deleteGift(gift.id)}>
                        🗑 Xóa quà
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
