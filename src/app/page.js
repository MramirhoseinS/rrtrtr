"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState("https://www.w3schools.com/html/mov_bbb.mp4");
  const [inputUrl, setInputUrl] = useState(url);
  const socketRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // جلوگیری از لوپ و lag با تمایز رویدادهای local و remote
  const isRemoteRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    const socket = io({
      path: "/api/ws",
    });
    socketRef.current = socket;

    socket.on("sync", (state) => {
      isRemoteRef.current = true;
      setUrl(state.url);
      setInputUrl(state.url);
      setPlaying(state.playing);
      setTimeout(() => {
        if (playerRef.current) playerRef.current.currentTime = state.played;
        isRemoteRef.current = false;
      }, 200);
    });

    socket.on("video-event", (data) => {
      if (!playerRef.current) return;
      isRemoteRef.current = true;
      switch (data.type) {
        case "play":
          setPlaying(true);
          break;
        case "pause":
          setPlaying(false);
          break;
        case "seek":
          playerRef.current.currentTime = data.time;
          break;
        case "changeUrl":
          setUrl(data.url);
          setInputUrl(data.url);
          setPlaying(false);
          setTimeout(() => {
            if (playerRef.current) playerRef.current.currentTime = 0;
            isRemoteRef.current = false;
          }, 200);
          break;
        default:
          break;
      }
      setTimeout(() => {
        isRemoteRef.current = false;
      }, 50);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // اجرای play/pause واقعی فقط در یک useEffect و فقط زمانی که state تغییر کند
  useEffect(() => {
    if (!mounted) return;
    const video = playerRef.current;
    if (!video) return;

    if (playing) {
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [playing, url, mounted]);

  const handlePlay = () => {
    if (!isRemoteRef.current) {
      socketRef.current?.emit("video-event", { type: "play" });
    }
  };

  const handlePause = () => {
    if (!isRemoteRef.current) {
      socketRef.current?.emit("video-event", { type: "pause" });
    }
  };

  const handleSeek = () => {
    const currentTime = playerRef.current?.currentTime || 0;
    if (!isRemoteRef.current) {
      socketRef.current?.emit("video-event", { type: "seek", time: currentTime });
    }
  };

  const handleUrlChange = (e) => setInputUrl(e.target.value);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (inputUrl && inputUrl !== url) {
      setUrl(inputUrl);
      setPlaying(false);
      socketRef.current?.emit("video-event", { type: "changeUrl", url: inputUrl });
    }
  };

  // Reset handler: emits a reset event to server
  const handleReset = () => {
    socketRef.current?.emit("video-event", { type: "reset" });
  };

  const [check, setCheck] = useState(false);
  const [value, setValue] = useState(false);
  const handleCheck = () => {
    if (value === process.env.NEXT_PUBLIC_OK) {
      setCheck(true);
    }
  };

  if (!check) {
    return (
      <>
        <input
          style={{
            width: 320,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            background: "#fafafa",
          }}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#0070f3",
            color: "#fff",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onClick={handleCheck}
        >
          ok
        </button>
      </>
    );
  }
  return (
    <main style={{ padding: 20 }}>
      <h1>🎬 هم‌زمان‌سازی ویدیو</h1>
      <form
        onSubmit={handleUrlSubmit}
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          type="text"
          value={inputUrl}
          onChange={handleUrlChange}
          placeholder="Video URL"
          style={{
            width: 320,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 16,
            outline: "none",
            transition: "border 0.2s",
            background: "#fafafa",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#0070f3",
            color: "#fff",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          تغییر ویدیو
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#e53e3e",
            color: "#fff",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
            marginLeft: 8,
            transition: "background 0.2s",
          }}
        >
          ریست همه
        </button>
      </form>
      {mounted && (
        <video
          ref={playerRef}
          src={url}
          controls
          width="100%"
          height="auto"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeek}
          style={{ background: "#000", borderRadius: 8, boxShadow: "0 2px 12px #0002" }}
        />
      )}
    </main>
  );
}
