import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    io = new Server(res.socket.server, {
      path: "/api/ws",
      addTrailingSlash: false,
      cors: { origin: "*" },
    });

    // مقدار اولیه وضعیت ویدیو
    let videoState = {
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
      playing: false,
      played: 0,
    };

    io.on("connection", (socket) => {
      // ارسال وضعیت فعلی به کلاینت جدید
      socket.emit("sync", videoState);

      socket.on("video-event", (data) => {
        switch (data.type) {
          case "play":
            videoState.playing = true;
            io.emit("video-event", { type: "play" });
            break;
          case "pause":
            videoState.playing = false;
            io.emit("video-event", { type: "pause" });
            break;
          case "seek":
            videoState.played = data.time;
            io.emit("video-event", { type: "seek", time: data.time });
            break;
          case "changeUrl":
            videoState.url = data.url;
            videoState.played = 0;
            videoState.playing = false;
            io.emit("video-event", { type: "changeUrl", url: data.url });
            break;
          default:
            break;
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
