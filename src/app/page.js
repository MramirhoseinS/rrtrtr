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

  return (
    <main style={{ padding: 20 }}>
      <h1>🎬 هم‌زمان‌سازی ویدیو</h1>
      <form onSubmit={handleUrlSubmit} style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={inputUrl}
          onChange={handleUrlChange}
          placeholder="Video URL"
          style={{ width: 300, marginRight: 8 }}
        />
        <button type="submit">تغییر ویدیو</button>
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
          style={{ background: "#000" }}
        />
      )}
    </main>
  );
}

