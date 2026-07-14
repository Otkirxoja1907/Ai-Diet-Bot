import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell with-nav">
      <Header />
      {children}
      <BottomNav />
    </div>
  );
}
