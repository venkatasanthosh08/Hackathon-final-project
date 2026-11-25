import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getMovie, movies, backdropUrl, SAMPLE_VIDEOS } from "../data";
import { addToWatchlist } from "../store";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import { claimStream, heartbeatStream, logWatch, releaseStream } from "../services/streams";
import { getUploadedVideo, getAllMovies } from "../services/catalogue";

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const movie = getAllMovies(movies).find(m => String(m.id) === String(id)) || null;
  const [streamError, setStreamError] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  useEffect(() => {
    let objectUrl = "";
    if (!movie) { setStreamError("This movie is not currently published."); return; }
    if (movie.isUploaded) getUploadedVideo(movie.videoId).then(blob => {
      if (blob) { objectUrl = URL.createObjectURL(blob); setUploadedVideoUrl(objectUrl); }
    }).catch(() => setStreamError("This locally uploaded video is unavailable in this browser."));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [movie?.id]);
  useEffect(() => {
    if (!movie) return;
    const result = claimStream(user.email, movie.id);
    setAllowed(result.ok);
    if (!result.ok) setStreamError(result.message);
    if (result.ok) logWatch({ contentId: movie.id, genre: movie.genre, source: "movie" });
    const timer = result.ok ? window.setInterval(() => heartbeatStream(user.email, movie.id), 5000) : null;
    return () => { if (timer) window.clearInterval(timer); if (result.ok) releaseStream(); };
  }, [user.email, movie?.id]);

  const handleAdd = () => movie && alert(addToWatchlist(movie.id) ? `${movie.title} added to My List.` : "Already in My List.");
  if (!movie) return <Layout><main className="container feature-page"><div className="empty">This movie is not currently published. <Link to="/movies">Browse published movies</Link></div></main></Layout>;

  return (
    <Layout solid={false}>
      <section
        className="watch-banner"
        style={{ backgroundImage: `linear-gradient(rgba(20,20,20,0.55), rgba(20,20,20,0.55)), url('${backdropUrl(movie)}')` }}
      >
        <div className="watch-banner-fade"><div className="container"><h1>{movie.title}</h1></div></div>
      </section>

      <main className="container">
        <section className="watch-layout">
          {allowed ? <video controls playsInline preload="metadata" src={movie.isUploaded ? uploadedVideoUrl : SAMPLE_VIDEOS[(Number(movie.id) - 1) % SAMPLE_VIDEOS.length]} /> : <div className="empty">{streamError || "Checking your streaming access..."}<p><Link to="/subscription">View plans</Link></p></div>}
          <aside className="watch-info">
            <div className="movie-meta">
              <span>{movie.genre}</span><span>{movie.year}</span><span className="rating">&#9733; {movie.rating}</span>
            </div>
            <p>{movie.description}</p>
            <button className="btn btn-block" onClick={handleAdd}>+ Add to My List</button>
            <p className="form-foot"><Link to="/movies">&larr; Back to all movies</Link></p>
          </aside>
        </section>
      </main>
    </Layout>
  );
}