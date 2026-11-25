import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import MovieCard from "../components/MovieCard";
import { movies, genres } from "../data";
import { getAllMovies, subscribeCatalogue } from "../services/catalogue";

export default function Movies() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState(params.get("genre") || "All");
  const [year, setYear] = useState("All");
  const [catalogue, setCatalogue] = useState(() => getAllMovies(movies));
  useEffect(() => subscribeCatalogue(() => setCatalogue(getAllMovies(movies))), []);
  const years = useMemo(() => [...new Set(catalogue.map(m => Number(m.year)).filter(Number.isFinite))].sort((a,b) => b-a), [catalogue]);
  const filtered = catalogue.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) &&
    (genre === "All" || m.genre === genre) &&
    (year === "All" || Number(m.year) === Number(year))
  );

  return (
    <Layout>
      <main className="container" style={{ paddingTop: 26 }}>
        <div className="section-head"><h2>All movies</h2><p>Search by title, release year or genre</p></div>
        <div className="filter-bar">
          <input placeholder="Search a movie title" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={year} onChange={(e) => setYear(e.target.value)}><option value="All">All years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="All">All genres</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">No movies match that search.</div>
        ) : (
          <div className="movie-grid">
            {filtered.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </main>
    </Layout>
  );
}
