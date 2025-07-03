import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketProvider';
import { useParams } from 'react-router-dom';
import peer from '../../service/peer';

const VideoChat = () => {
  const { appointmentId } = useParams();
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const socket = useSocket();
  const remoteVideoRef = useRef(null);
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    const playRemoteVideo = async () => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        try {
          await remoteVideoRef.current.play();
          console.log("Remote video playing");
        } catch (err) {
          console.warn("Play failed, will wait for user interaction");
        }
      }
    };
    if (remoteReady) playRemoteVideo();
  }, [remoteStream, remoteReady]);


  useEffect(() => {
    const handler = () => {
      setRemoteReady(true);
      document.removeEventListener("click", handler);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);


  useEffect(() => {
    const fetchStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMyStream(stream);
        stream.getTracks().forEach(track => peer.peer.addTrack(track, stream));
      } catch (err) {
        console.warn("Local media access failed (continuing anyway):", err.message);
      }
    };
    fetchStream();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("room:join", {
        email: "dummy@email.com", //Update users email
        room: appointmentId,
      });
    }
  }, [socket, appointmentId]);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`User ${email} joined.`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    if (!myStream) return;
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket, myStream]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  }, [socket]);

  const handleCallAccepted = useCallback(({ ans }) => {
    peer.setLocalDescription(ans);
  }, []);

  const handleNegotiationNeeded = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    } catch (error) {
      console.error("Negotiation error:", error);
    }
  }, [remoteSocketId, socket]);

  const handleNegotiationIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegotiationFinal = useCallback(async ({ ans }) => {
    try {
      await peer.setLocalDescription(ans);
    } catch (error) {
      console.error("Negotiation final setLocalDescription error:", error);
    }
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    };
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const [stream] = ev.streams;
      console.log("Received remote stream");
      setRemoteStream(stream  );
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegotiationIncoming);
    socket.on("peer:nego:done", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegotiationIncoming);
      socket.off("peer:nego:done", handleNegotiationFinal);
    };
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegotiationIncoming, handleNegotiationFinal]);

  return (
  <div
    style={{
      backgroundColor: "#f8faff",
      borderRadius: "12px",
      padding: "30px 20px",
      textAlign: "center",
      boxShadow: "0 0 10px rgba(0,0,0,0.05)",
      maxWidth: "500px",
      margin: "auto",
      marginTop: "30px",
    }}
  >
    <h2 style={{ color: "#4b4f56", marginBottom: "10px" }}>
      🩺 <span style={{ fontWeight: 600 }}>MediVerse Video Chat</span>
    </h2>

    <p
      style={{
        color: remoteSocketId ? "#27ae60" : "#999",
        fontWeight: 500,
        marginBottom: "20px",
      }}
    >
      {remoteSocketId ? " Connected to patient" : " Waiting for patient to join..."}
    </p>

    <button
      onClick={handleCallUser}
      disabled={!remoteSocketId}
      style={{
        backgroundColor: remoteSocketId ? "#3498db" : "#bdc3c7",
        color: "white",
        border: "none",
        padding: "12px 28px",
        fontSize: "16px",
        borderRadius: "8px",
        cursor: remoteSocketId ? "pointer" : "not-allowed",
        transition: "background-color 0.3s ease",
        marginBottom: "30px",
      }}
    >
      📞 Call
    </button>

    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {myStream && (
        <div>
          <h3 style={{ marginBottom: "8px", color: "#2c3e50" }}>🧑‍⚕️ My Stream</h3>
          <video
            autoPlay
            playsInline
            muted
            width="100%"
            height="auto"
            style={{
              maxWidth: "100%",
              border: "3px solid #2980b9",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            }}
            ref={(videoEl) => {
              if (videoEl) videoEl.srcObject = myStream;
            }}
          />
        </div>
      )}

      {remoteStream && (
        <div>
          <h3 style={{ marginBottom: "8px", color: "#2c3e50" }}>🎥 Remote Stream</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            controls
            width="100%"
            height="auto"
            style={{
              maxWidth: "100%",
              border: "3px solid #2ecc71",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
      )}
    </div>
  </div>
);

};

export default VideoChat;
