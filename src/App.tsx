import { useEffect, useState } from "react";
import CalendarPage from "./pages/CalendarPage";
import HomePage from "./pages/HomePage";
import WishlistPage from "./pages/WishlistPage";
import { EDIT_KEY, persistEditorAccess, readEditorAccess } from "./lib/editorAccess";

type RouteKey = "home" | "calendar" | "wishlist";

type SharedEditorProps = {
  isEditor: boolean;
  editKey: string;
  onEditKeyChange: (value: string) => void;
  onUnlock: () => void;
  onLock: () => void;
};

const ROUTES: Record<RouteKey, { hash: string; label: string; icon: string }> = {
  home: { hash: "#/", label: "Home", icon: "💕" },
  calendar: { hash: "#/lich", label: "Lịch", icon: "📅" },
  wishlist: { hash: "#/wishlist", label: "Wishlist", icon: "🎁" },
};

const getRouteFromHash = (hash: string): RouteKey => {
  const normalized = hash.toLowerCase() || "#/";

  if (normalized === "#/lich") return "calendar";
  if (normalized === "#/wishlist") return "wishlist";

  return "home";
};

export default function App() {
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash(window.location.hash));
  const [editKey, setEditKey] = useState("");
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    setIsEditor(readEditorAccess());

    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get("key");
    if (keyFromUrl === EDIT_KEY) {
      setIsEditor(true);
      persistEditorAccess(true);
    }
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = ROUTES.home.hash;
    }

    const syncRoute = () => {
      setRoute(getRouteFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", syncRoute);

    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const unlockEditor = () => {
    if (editKey.trim() !== EDIT_KEY) {
      window.alert("Sai key rồi nha");
      return;
    }

    setIsEditor(true);
    persistEditorAccess(true);
    setEditKey("");
    window.alert("Mở quyền chỉnh sửa thành công");
  };

  const lockEditor = () => {
    setIsEditor(false);
    persistEditorAccess(false);
    setEditKey("");
  };

  const sharedEditorProps: SharedEditorProps = {
    isEditor,
    editKey,
    onEditKeyChange: setEditKey,
    onUnlock: unlockEditor,
    onLock: lockEditor,
  };

  const renderPage = () => {
    if (route === "calendar") return <CalendarPage {...sharedEditorProps} />;
    if (route === "wishlist") return <WishlistPage {...sharedEditorProps} />;
    return <HomePage {...sharedEditorProps} />;
  };

  return (
    <div className="app-shell">
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
        <img src="/anh-1.webp" className="photo photo-1" alt="" />
        <img src="/anh-2.webp" className="photo photo-2" alt="" />
        <img src="/anh-3.webp" className="photo photo-3" alt="" />
        <img src="/anh-1.webp" className="photo photo-4" alt="" />
        <img src="/anh-2.webp" className="photo photo-5" alt="" />
        <img src="/anh-3.webp" className="photo photo-6" alt="" />
      </div>

      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <main className="page-shell">{renderPage()}</main>

      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {(Object.keys(ROUTES) as RouteKey[]).map((key) => {
          const item = ROUTES[key];
          const isActive = route === key;

          return (
            <a
              key={key}
              href={item.hash}
              className={isActive ? "bottom-nav-item active" : "bottom-nav-item"}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
