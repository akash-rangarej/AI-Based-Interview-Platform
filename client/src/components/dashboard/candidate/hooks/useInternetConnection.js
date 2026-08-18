import { useEffect, useRef, useState } from "react";
import socket from "../../../../socket/socketclient";


export function useInternetConnection() {
  const [connectionLost, setConnectionLost] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const graceSecondsRef = useRef(15);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleConfig = ({ gracePeriodSeconds }) => {
      graceSecondsRef.current = gracePeriodSeconds;
    };

    const handleDisconnect = (reason) => {
        console.log("SOCKET DISCONNECTED:", reason);
      if (reason === "io client disconnect") return; // we disconnected on purpose (unmount)
      setConnectionLost(true);
      setCountdown(graceSecondsRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    };

    const handleResume = () => {
      clearInterval(intervalRef.current);
      setConnectionLost(false);
      setCountdown(null);
    };

    socket.on("reconnect-config", handleConfig);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleResume);       // fires on every reconnect too
    socket.on("interview-resumed", handleResume);

    return () => {
      clearInterval(intervalRef.current);
      socket.off("reconnect-config", handleConfig);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleResume);
      socket.off("interview-resumed", handleResume);
    };
  }, []);

  return { connectionLost, countdown };
}