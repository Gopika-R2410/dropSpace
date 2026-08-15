import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import { RoomProvider } from "./context/RoomContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SocketProvider>
      <RoomProvider>
        <App />
      </RoomProvider>
    </SocketProvider>
  </StrictMode>
);
