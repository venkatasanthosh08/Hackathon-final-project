import { read, write, makeId, subscribe } from './storage.js';

const META_KEY = 'lv_uploaded_movies';
const SAMPLE_STATUS_KEY = 'lv_sample_movie_status';
const CATALOGUE_EVENT_KEY = META_KEY;
const DB_NAME = 'lets-vibe-media';
const STORE = 'videos';

const openDb = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('This browser does not support local video storage.'));
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open local video storage.'));
});

const withStore = async (mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = action(store);
    let result;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error || new Error('Video storage operation failed.'));
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Video storage transaction was aborted.')); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Video storage operation failed.')); };
  });
};

export const getUploadedMovies = () => read(META_KEY, []);
export const getSampleMovieStatuses = () => read(SAMPLE_STATUS_KEY, {});
export const getSampleMovieStatus = id => getSampleMovieStatuses()[String(id)] || 'Published';
export const updateSampleMovieStatus = (id, status) => {
  const statuses = getSampleMovieStatuses();
  write(SAMPLE_STATUS_KEY, { ...statuses, [String(id)]: status });
};
export const getPublishedMovies = (sampleMovies = []) => {
  const statuses = getSampleMovieStatuses();
  return [
    ...getUploadedMovies().filter(m => m.status === 'Published'),
    ...sampleMovies.filter(m => (statuses[String(m.id)] || 'Published') === 'Published'),
  ];
};
export const getAllMovies = getPublishedMovies;
export const subscribeCatalogue = callback => subscribe(CATALOGUE_EVENT_KEY, callback);

export const saveUploadedMovie = async ({ title, genre, year, description, thumbnailUrl, file }) => {
  if (!file) throw new Error('Please choose a video file.');
  if (!file.type.startsWith('video/')) throw new Error('Please select a valid video file.');
  const id = makeId('movie');
  await withStore('readwrite', store => store.put(file, id));
  const movie = {
    id,
    videoId: id,
    title: title.trim(),
    genre,
    year: Number(year) || new Date().getFullYear(),
    rating: 0,
    description: description.trim(),
    seed: id,
    thumbnailUrl: thumbnailUrl.trim(),
    fileName: file.name,
    fileSize: file.size,
    status: 'Published',
    createdAt: Date.now(),
    isUploaded: true,
  };
  write(META_KEY, [movie, ...getUploadedMovies()]);
  return movie;
};

export const getUploadedVideo = async id => withStore('readonly', store => store.get(id));
export const updateUploadedMovie = (id, updates) => write(META_KEY, getUploadedMovies().map(m => m.id === id ? { ...m, ...updates } : m));
export const deleteUploadedMovie = async id => {
  await withStore('readwrite', store => store.delete(id));
  write(META_KEY, getUploadedMovies().filter(m => m.id !== id));
};
