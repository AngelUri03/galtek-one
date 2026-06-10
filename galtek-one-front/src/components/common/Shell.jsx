import NavBar from "./NavBar";

export default function Shell({ children }) {
  return (
    <div>
      <NavBar />
      <div style={{ flex: 1, marginTop: "4rem" }}>{children}</div>
    </div>
  );
}
