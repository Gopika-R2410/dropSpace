import { useSocketContext } from "../context/SocketContext";

// Thin convenience re-export so components can `import { useSocket }`
// without reaching into the context file directly.
export function useSocket() {
  return useSocketContext();
}
