import { useState } from "react";
import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import MyDogs from "./pages/MyDogs";
import AnalyzeChat from "./pages/AnalyzeChat";
import Reports from "./pages/Reports";
import { DOGS } from "./data/mockData";
import { G } from "./styles/theme";
import { css, appAnimations } from "./styles/globalStyles";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedDog, setSelectedDog] = useState(DOGS[0]);

  return (
    <div style={{ fontFamily: G.fs, background: G.bg, minHeight: "100vh" }}>
      <style>{`${css}\n${appAnimations}`}</style>
      <Nav page={page} setPage={setPage} />
      {page === "dashboard" && <Dashboard setPage={setPage} setSelectedDog={setSelectedDog} />}
      {page === "dogs" && <MyDogs selectedDog={selectedDog} setSelectedDog={setSelectedDog} setPage={setPage} />}
      {page === "analyze" && <AnalyzeChat dogs={DOGS} selectedDog={selectedDog} setSelectedDog={setSelectedDog} />}
      {page === "reports" && <Reports dogs={DOGS} />}
    </div>
  );
}
