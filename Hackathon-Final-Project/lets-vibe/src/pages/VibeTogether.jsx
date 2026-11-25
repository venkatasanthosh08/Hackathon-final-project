import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../AuthContext";
import { movies, SAMPLE_VIDEOS } from "../data";
import { getAllMovies, getUploadedVideo } from "../services/catalogue";
import { ROOM, KEYS } from "../config";
import { canCreateRoom, getPlan } from "../services/plans";
import {
  createRoom, findOpenRoomOf, getRoom, heartbeat,
  joinRoom, leaveRoom, setPlayback, setRoomVideo, roomSeats
} from "../services/rooms";
import { subscribe } from "../services/storage";

export default function VibeTogether() {
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [room, setRoom] = useState(() => findOpenRoomOf(user.email));
  const [movieId, setMovieId] = useState(1);
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const videoRef = useRef(null);

  const isHost = !!room && room.hostEmail === user.email;

  // Includes published admin-uploaded movies and sample movies.
  const [catalogueVersion, setCatalogueVersion] = useState(0);

  const allMovies = getAllMovies(movies);

  const movie = room
    ? allMovies.find(m => String(m.id) === String(room.movieId)) || null
    : null;

  // Refresh movie list whenever admin uploads, publishes or unpublishes.
  useEffect(() => {
    return subscribe("lv_uploaded_movies", () => {
      setCatalogueVersion(v => v + 1);
    });
  }, []);

  // Load uploaded video from IndexedDB.
  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    setUploadedUrl("");

    if (!movie?.isUploaded || !movie?.videoId) {
      return () => {};
    }

    getUploadedVideo(movie.videoId)
      .then(blob => {
        if (!blob || cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setUploadedUrl(objectUrl);
      })
      .catch(error => {
        console.error("Unable to load uploaded movie:", error);
        setMessage("Unable to load this uploaded video.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [movie?.id, movie?.videoId, movie?.isUploaded]);

  const videoSource = movie?.isUploaded
    ? uploadedUrl
    : SAMPLE_VIDEOS[
        Math.max(0, movies.findIndex(m => String(m.id) === String(room?.movieId)))
      ] || SAMPLE_VIDEOS[0];

  const refresh = useCallback(() => {
    if (room?.code) {
      setRoom(getRoom(room.code));
    } else {
      setRoom(findOpenRoomOf(user.email));
    }
  }, [room?.code, user.email]);

  useEffect(() => subscribe(KEYS.rooms, refresh), [refresh]);

  useEffect(() => {
    if (!room?.code) return;

    const timer = window.setInterval(() => {
      const result = heartbeat(room.code, user.email);

      if (result.error) {
        setMessage(result.error);
        setRoom(null);
      } else {
        setRoom(result.room);
      }
    }, ROOM.heartbeatMs);

    return () => window.clearInterval(timer);
  }, [room?.code, user.email]);

  useEffect(() => {
    if (!room || isHost || !videoRef.current) return;

    const el = videoRef.current;
    const target = Math.max(0, Number(room.playback?.time || 0));

    if (Math.abs(el.currentTime - target) > 2) {
      el.currentTime = target;
    }

    if (room.playback?.playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [
    room?.playback?.updatedAt,
    room?.playback?.playing,
    room?.movieId,
    isHost
  ]);

  const startRoom = () => {
    const result = createRoom(user, movieId);

    if (result.error) return setMessage(result.error);

    setRoom(result.room);
    setMessage(
      result.existing
        ? "You already have an open room."
        : "Your room is ready. Invite up to three friends."
    );
  };

  const join = () => {
    const result = joinRoom(code, user);

    if (result.error) return setMessage(result.error);

    setRoom(result.room);
    setMessage("You joined the room.");
  };

  const exit = () => {
    if (!room) return;

    leaveRoom(room.code, user.email);
    setRoom(null);

    setMessage(isHost ? "You closed the room." : "You left the room.");
  };

  const hostUpdate = (playing, time = videoRef.current?.currentTime || 0) => {
    if (!isHost || !room) return;

    const result = setPlayback(room.code, user.email, {
      playing,
      time
    });

    if (result.error) setMessage(result.error);
  };

  // IMPORTANT: Do not convert uploaded movie IDs to Number.
  const changeVideo = (id) => {
    const result = setRoomVideo(room.code, user.email, id);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Shared movie changed.");
    }
  };

  return (
    <Layout>
      <main className="container feature-page">

        <div className="section-head">
          <div>
            <h2>Vibe Together</h2>
            <p>
              One Premium host. Three friends. Four unique accounts.
              One shared experience.
            </p>
          </div>

          <span className="plan-pill">
            {getPlan(user.email).name}
          </span>
        </div>

        {room ? (
          <section className="panel room-panel">

            <div className="room-top">
              <div>
                <span className="eyebrow">ROOM CODE</span>
                <h2 className="room-code">{room.code}</h2>
                <p className="muted">
                  Share this code with friends · {roomSeats(room)} participants
                </p>
              </div>

              <button
                className="btn btn-outline"
                onClick={() => {
                  navigator.clipboard?.writeText(room.code);
                  setMessage("Room code copied.");
                }}
              >
                Copy code
              </button>
            </div>

            <div className="room-columns">

              <div>
                <div className="video-shell">
                  {videoSource && (
                    <video
                      key={String(room.movieId)}
                      ref={videoRef}
                      src={videoSource}
                      controls={isHost}
                      onPlay={() => hostUpdate(true)}
                      onPause={() => hostUpdate(false)}
                      onSeeked={() =>
                        hostUpdate(!videoRef.current?.paused)
                      }
                      onLoadedMetadata={() => {
                        if (!isHost && videoRef.current) {
                          videoRef.current.currentTime =
                            Number(room.playback?.time || 0);
                        }
                      }}
                    />
                  )}

                  {movie?.isUploaded && !uploadedUrl && (
                    <p className="muted">Loading uploaded video...</p>
                  )}
                </div>

                <h3>{movie?.title || "Shared video"}</h3>

                <p className="muted">
                  {isHost
                    ? "You control playback for everyone."
                    : "The host controls playback. Sit back and enjoy!"}
                </p>

                {isHost && (
                  <div className="form-group">
                    <label>Change shared video</label>

                    <select
                      value={String(room.movieId)}
                      onChange={e => changeVideo(e.target.value)}
                    >
                      {allMovies.map(m => (
                        <option key={m.id} value={String(m.id)}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <aside className="room-members">
                <h3>People in this room</h3>

                {room.participants.map(p => (
                  <div className="member-row" key={p.email}>
                    <span className="member-avatar">
                      {(p.name || "U").slice(0, 1).toUpperCase()}
                    </span>

                    <div>
                      <strong>
                        {p.name}
                        {p.email === room.hostEmail ? " (Host)" : ""}
                      </strong>

                      <small>
                        {p.plan === "premium"
                          ? "Vibe Premium"
                          : p.plan === "standard"
                          ? "Standard"
                          : "Basic"}
                      </small>
                    </div>

                    {p.email === room.hostEmail && (
                      <span className="host-tag">HOST</span>
                    )}
                  </div>
                ))}

                <p className="muted room-capacity">
                  {ROOM.maxParticipants - room.participants.length}
                  {" "}guest seat(s) available
                </p>

                <button
                  className="btn btn-outline btn-block"
                  onClick={exit}
                >
                  {isHost ? "Close room" : "Leave room"}
                </button>
              </aside>

            </div>
          </section>
        ) : (
          <div className="room-entry-grid">

            <section className="panel">
              <h2>Create a room</h2>

              <p className="muted">
                Only Vibe Premium members can host.
                Invite up to three other accounts.
              </p>

              <div className="form-group">
                <label>Choose a starting movie</label>

                <select
                  value={String(movieId)}
                  onChange={e => setMovieId(e.target.value)}
                >
                  {allMovies.map(m => (
                    <option key={m.id} value={String(m.id)}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-block"
                disabled={!canCreateRoom(user.email)}
                onClick={startRoom}
              >
                Create Vibe Together room
              </button>

              {!canCreateRoom(user.email) && (
                <p className="feature-message">
                  Upgrade to Vibe Premium to create a room.
                  Guests can join using any plan.
                </p>
              )}
            </section>

            <section className="panel">
              <h2>Join a room</h2>

              <p className="muted">
                Enter the six-character code shared by your host.
                You need your own account.
              </p>

              <div className="form-group">
                <label>Room code</label>

                <input
                  maxLength={ROOM.codeLength}
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB23CD"
                />
              </div>

              <button className="btn btn-block" onClick={join}>
                Join Vibe Together
              </button>
            </section>

          </div>
        )}

        {message && (
          <p className="feature-message">{message}</p>
        )}

        <p className="prototype-note">
          Prototype limitation: room updates synchronize between tabs/windows
          in the same browser using Local Storage. Different devices need a
          real-time backend. Every participant must sign in with a separate account.
        </p>

        <p>
          <Link to="/subscription">Explore subscription plans →</Link>
        </p>

      </main>
    </Layout>
  );
}