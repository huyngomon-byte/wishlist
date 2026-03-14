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
import { db } from "./firebase/config";

type GiftItem = {
  id?: string;
  name: string;
  price: string;
  note: string;
  link: string;
  bought?: boolean;
  priority: "uoc" | "thich" | "muon";
};

const EDIT_KEY = "tranginyeuhuy";
const STORAGE_KEY = "wishlist-editor-unlocked";

export default function App() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState<"uoc" | "thich" | "muon">("muon");
  const [tab, setTab] = useState<"form" | "list">("form");

  const [editKey, setEditKey] = useState("");
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setIsEditor(true);
    }

    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get("key");
    if (keyFromUrl === EDIT_KEY) {
      setIsEditor(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, []);

  const unlockEditor = () => {
    if (editKey.trim() === EDIT_KEY) {
      setIsEditor(true);
      localStorage.setItem(STORAGE_KEY, "true");
      setEditKey("");
      alert("Mở quyền chỉnh sửa thành công 💖");
      return;
    }

    alert("Sai key rồi nha");
  };

  const lockEditor = () => {
    setIsEditor(false);
    localStorage.removeItem(STORAGE_KEY);
    setEditKey("");
  };

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
    return parsed.toLocaleString("vi-VN") + "₫";
  };

  useEffect(() => {
    const q = query(collection(db, "gifts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<GiftItem, "id">),
      }));

      setGifts(items);
    });

    return () => unsubscribe();
  }, []);

  const addGift = async () => {
    if (!isEditor) {
      alert("Cần nhập key để chỉnh sửa nha");
      return;
    }

    if (!name.trim()) {
      alert("Nhập tên quà trước nha");
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
    if (!isEditor) return;
    if (!id) return;

    const ok = window.confirm("Xóa món quà này nha?");
    if (!ok) return;

    await deleteDoc(doc(db, "gifts", id));
  };

  const toggleBought = async (id?: string, currentBought?: boolean) => {
    if (!isEditor) return;
    if (!id) return;

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
    <div className="app">
      <div className="floating-hearts">
        <span>💖</span>
        <span>💕</span>
        <span>💗</span>
        <span>💞</span>
        <span>💘</span>
        <span>💓</span>
        <span>💖</span>
        <span>💕</span>
        <span>💗</span>
      </div>

      <div className="floating-photos">
        <img src="/anh-1.png" className="photo photo-1" alt="" />
        <img src="/anh-2.png" className="photo photo-2" alt="" />
        <img src="/anh-3.png" className="photo photo-3" alt="" />
        <img src="/anh-1.png" className="photo photo-4" alt="" />
        <img src="/anh-2.png" className="photo photo-5" alt="" />
        <img src="/anh-3.png" className="photo photo-6" alt="" />
      </div>

      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <div className="container">
        <div className="header-card">
          <div className="rose">🌹</div>
          <div>
            <h1 className="title">Danh Sách Ước Mơ của Trang Ỉn 🤍</h1>
            <p className="subtitle">Những điều bé iu thích, anh lưu hết ở đây 💖</p>
          </div>
        </div>

        <div className="auth-bar">
          {isEditor ? (
            <div className="auth-box">
              <span className="auth-text">🔐 Đang mở quyền chỉnh sửa</span>
              <button className="auth-btn" onClick={lockEditor}>
                Khóa lại
              </button>
            </div>
          ) : (
            <div className="auth-box">
              <span className="auth-text">Nhập key để chỉnh sửa wishlist</span>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  width: "100%",
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="input"
                  style={{ marginBottom: 0, flex: 1 }}
                  placeholder="Nhập key chỉnh sửa..."
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                />
                <button className="auth-btn" onClick={unlockEditor}>
                  Mở quyền
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tabs">
          <button
            className={tab === "form" ? "tab active" : "tab"}
            onClick={() => setTab("form")}
          >
            ✨ Thêm món quà yêu thích của em
          </button>

          <button
            className={tab === "list" ? "tab active" : "tab"}
            onClick={() => setTab("list")}
          >
            💝 Bảng quà của anh
          </button>
        </div>

        {tab === "form" ? (
          <>
            <h2 className="section-title">
              Thêm một món quà em thích vào đây nhaaa 🤍
            </h2>
            <p className="section-desc">
              Em hãy thêm những món quà mình thích nhé, rồi một món quà may mắn
              sẽ là bất ngờ sau này ♥
            </p>

            <div className="form-card">
              <label className="label">♡ TÊN QUÀ TẶNG</label>
              <input
                className="input"
                placeholder="Ví dụ: Vòng tay bạc khắc tên..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditor}
              />

              <label className="label">₫ GIÁ ƯỚC TÍNH (VNĐ)</label>
              <input
                className="input"
                placeholder="Ví dụ: 500k, 1tr, 2.5tr hoặc 500000"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={!isEditor}
              />

              <label className="label">🔗 LINK SẢN PHẨM (NẾU CÓ)</label>
              <input
                className="input"
                placeholder="Ví dụ: shopee.vn/... hoặc tiktok.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
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
                onChange={(e) => setNote(e.target.value)}
                disabled={!isEditor}
              />

              {isEditor ? (
                <button className="submit-btn" onClick={addGift}>
                  Lưu món quà 💌
                </button>
              ) : (
                <div className="view-only-note">
                  Bạn đang ở chế độ chỉ xem 🤍
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="section-title">Bảng quà của anh 💝</h2>
            <p className="section-desc">
              Những món quà em thích đều được lưu lại ở đây.
            </p>

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

                    {gift.bought && (
                      <p className="bought-text">🎁 Anh đã mua món này rồi</p>
                    )}

                    {gift.price && (
                      <p className="gift-line">
                        <strong>Giá dự tính:</strong> {formatPrice(gift.price)}
                      </p>
                    )}

                    {gift.link && (
                      <p className="gift-link">
                        <strong>Link sản phẩm:</strong>{" "}
                        <a
                          href={normalizeLink(gift.link)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Xem sản phẩm
                        </a>
                      </p>
                    )}

                    {gift.note && <p className="gift-note">{gift.note}</p>}

                    {isEditor && (
                      <div className="gift-actions">
                        <button
                          className={`bought-btn ${gift.bought ? "bought-btn-active" : ""}`}
                          onClick={() => toggleBought(gift.id, gift.bought)}
                        >
                          {gift.bought ? "✅ Đã mua" : "🎁 Anh đã mua"}
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => deleteGift(gift.id)}
                        >
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
    </div>
  );
}