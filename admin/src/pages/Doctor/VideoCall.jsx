import React from 'react'
import { useSocket } from '../../context/SocketProvider'
import { useParams } from 'react-router-dom';
import { useEffect, useCallback, useState, useRef } from 'react';
import peer from '../../service/peer';
import ReactPlayer from "react-player";


const VideoChat = () => {
    const { appointmentId } = useParams();
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState(null);
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const hasSentStreamsRef = useRef(false)

    const socket = useSocket()

    useEffect(() => {
    const fetchStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
    } catch (err) {
      console.error("Error getting user media:", err);
    }
    };
    fetchStream();
    }, []);

    useEffect(() => {
    if (socket) {
      socket.emit("room:join", {
        email: "dummy@email.com", // pass user's email from props/context
        room: appointmentId,
      });
    }
    }, [socket, appointmentId]);

    const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
    if (!myStream) return;
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    }, [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(async ({ from, offer }) => {
        console.log("Got incoming call offer:", offer);
      setRemoteSocketId(from);
      if (!myStream) return;
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },[socket]);


    const sendStreams = useCallback(() => {
    if (!myStream || hasSentStreamsRef.current) return;

    for (const track of myStream.getTracks()) {
      console.log("stream sent")
      peer.peer.addTrack(track, myStream);
    }
    
    hasSentStreamsRef.current = true;
    }, [myStream]);

    const handleCallAccepted = useCallback(({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("call acceped")
      sendStreams();
    },[sendStreams]);

    const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },[socket]);

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);}, []);

    useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
    }, []);

    useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted)
    socket.on("peer:nego:needed", handleNegoNeedIncomming)
    socket.on("peer:nego:done", handleNegoNeedFinal)

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted)
      socket.off("peer:nego:needed", handleNegoNeedIncomming)
      socket.off("peer:nego:done", handleNegoNeedFinal)
    }
    },[socket, handleUserJoined, handleIncommingCall, handleCallAccepted, handleNegoNeeded, handleNegoNeedFinal])



    return (
        <div>
        <h1>Hello</h1>
        <h4>{remoteSocketId ? "Connected" : "Waiting for someone to join..."}</h4>
        {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
        <br></br>
        {myStream && <button onClick={sendStreams}>Send Stream</button>}
        <div>
            {myStream && (
            <>
                <h1>My Stream</h1>
                <video
                ref={(videoEl) => {
                    if (videoEl) {
                    videoEl.srcObject = myStream;
                    }
                }}
                autoPlay
                playsInline
                muted
                width="200"
                height="150"
                />
            </>
            )}
            {remoteStream && (
            <>
                <h1>My Stream</h1>
                <video
                ref={(videoEl) => {
                    if (videoEl) {
                    videoEl.srcObject = remoteStream;
                    }
                }}
                autoPlay
                playsInline
                muted
                width="200"
                height="150"
                />
            </>
            )}
        </div>
    </div>

    )
}

export default VideoChat
