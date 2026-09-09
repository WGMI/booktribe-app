"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { addBook, searchOpenLibrary } from "@/lib/actions";
import BookScanner from "./BookScanner";

const GENRES = [
  "Literary Fiction", "Historical Fiction", "Classic", "Afrofuturism",
  "Memoir", "Self-Help", "Romance", "Sci-Fi", "Children's", "Mystery", "Philosophy", "Other",
];

type OLResult = {
  key: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  publishYear: number | null;
  genre: string | null;
};

type FormState = {
  title: string;
  author: string;
  genre: string;
  condition: string;
  description: string;
  isbn: string;
  openLibraryKey: string;
  coverUrl: string;
  images: string[];
  publishYear: string;
};

const BLANK_FORM: FormState = {
  title: "", author: "", genre: "", condition: "good",
  description: "", isbn: "", openLibraryKey: "", coverUrl: "", images: [], publishYear: "",
};

type Step = "search" | "scan" | "details";

export default function AddBookButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openModal() {
    setOpen(true);
    setStep("search");
    setQuery("");
    setResults([]);
    setSearchError("");
    setForm(BLANK_FORM);
    setSubmitError("");
    setUploadError("");
  }

  function closeModal() {
    setOpen(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setSearchError("");
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!value.trim()) { setResults([]); return; }
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchOpenLibrary(value);
        setResults(res);
      } catch {
        setSearchError("Search failed. Check your connection.");
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function selectResult(r: OLResult) {
    setForm({
      title: r.title,
      author: r.author,
      genre: r.genre ?? "",
      condition: "good",
      description: "",
      isbn: r.isbn ?? "",
      openLibraryKey: r.key,
      coverUrl: r.coverUrl ?? "",
      images: [],
      publishYear: r.publishYear ? String(r.publishYear) : "",
    });
    setStep("details");
    setSubmitError("");
  }

  function addManually() {
    setForm(BLANK_FORM);
    setStep("details");
    setSubmitError("");
  }

  function handleScanResults(scanned: OLResult[], via: "barcode" | "cover") {
    // A barcode is an exact ISBN match — skip the picker when it's unambiguous
    if (via === "barcode" && scanned.length === 1) {
      selectResult(scanned[0]);
      return;
    }
    setResults(scanned);
    setQuery("");
    setSearchError("");
    setStep("search");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadError("");
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please choose image files only.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Each image must be under 5MB.");
        return;
      }
    }

    setUploadingImage(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setForm((f) => ({ ...f, images: [...f.images, data.url as string] }));
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  }

  const missingFields: string[] = [];
  if (!form.title.trim()) missingFields.push("Title");
  if (!form.author.trim()) missingFields.push("Author");
  if (!form.coverUrl && form.images.length === 0) missingFields.push("Book image");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (missingFields.length > 0) {
      setSubmitError(`Please add: ${missingFields.join(", ")}.`);
      return;
    }
    startTransition(async () => {
      try {
        await addBook({
          ...form,
          uploadedImages: form.images,
          publishYear: form.publishYear ? Number(form.publishYear) : undefined,
        });
        closeModal();
      } catch {
        setSubmitError("Failed to add book. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        onClick={openModal}
        className="bg-[#85332a] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
      >
        <span>+</span> Add Book
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#f0eee9]">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#1b1c19]">
                  {step === "search" ? "Find a Book" : step === "scan" ? "Scan a Book" : "Book Details"}
                </h2>
                {step === "details" && (
                  <button
                    onClick={() => setStep("search")}
                    className="text-xs text-[#85332a] font-medium hover:underline mt-0.5"
                  >
                    ← Back to search
                  </button>
                )}
              </div>
              <button onClick={closeModal} className="text-[#88726f] hover:text-[#1b1c19] transition-colors text-xl">✕</button>
            </div>

            <div className="overflow-y-auto flex-1">
              {step === "search" && (
                <div className="p-6">
                  <div className="relative mb-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#88726f] text-sm">🔍</span>
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      placeholder="Search by title, author, or ISBN..."
                      className="w-full pl-9 pr-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                    />
                  </div>

                  <button
                    onClick={() => setStep("scan")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#3b6934] text-[#3b6934] font-semibold text-sm hover:bg-[#3b6934] hover:text-white transition-colors mb-2"
                  >
                    📷 Scan a book with your camera
                  </button>

                  {searchError && (
                    <p className="text-xs text-[#ba1a1a] mb-3">{searchError}</p>
                  )}

                  {searching && (
                    <div className="text-center py-8">
                      <div className="inline-block w-6 h-6 border-2 border-[#85332a] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#88726f] mt-2">Searching Open Library...</p>
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {results.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => selectResult(r)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#dbc1bd] hover:border-[#85332a] hover:bg-[#fff8f7] transition-all text-left group"
                        >
                          <div className="w-10 h-14 rounded bg-[#f0eee9] shrink-0 overflow-hidden">
                            {r.coverUrl ? (
                              <img src={r.coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1b1c19] text-sm truncate group-hover:text-[#85332a]">{r.title}</p>
                            <p className="text-xs text-[#554240] truncate">{r.author}</p>
                            {r.publishYear && <p className="text-xs text-[#88726f]">{r.publishYear}</p>}
                          </div>
                          <span className="text-[#85332a] text-xs font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Select →</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && query && results.length === 0 && (
                    <p className="text-sm text-[#88726f] text-center py-6">No results found.</p>
                  )}

                  <div className="mt-6 pt-4 border-t border-[#f0eee9] text-center">
                    <p className="text-xs text-[#88726f] mb-2">Can&apos;t find your book?</p>
                    <button
                      onClick={addManually}
                      className="text-sm text-[#85332a] font-semibold hover:underline"
                    >
                      Add manually instead →
                    </button>
                  </div>
                </div>
              )}

              {step === "scan" && (
                <BookScanner
                  onResults={handleScanResults}
                  onCancel={() => setStep("search")}
                />
              )}

              {step === "details" && (
                <form id="book-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Cover preview if from OL */}
                  {form.coverUrl && (
                    <div className="flex items-center gap-4 p-3 bg-[#f5f3ee] rounded-xl border border-[#dbc1bd]">
                      <img src={form.coverUrl} alt="" className="w-10 h-14 rounded object-cover shrink-0" />
                      <div>
                        <p className="font-semibold text-[#1b1c19] text-sm">{form.title}</p>
                        <p className="text-xs text-[#554240]">{form.author}</p>
                        {form.openLibraryKey && (
                          <p className="text-xs text-[#3b6934] mt-0.5">✓ From Open Library</p>
                        )}
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-4 py-2 rounded-lg">{submitError}</p>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Book Title *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Things Fall Apart"
                      className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Author *</label>
                    <input
                      required
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="e.g. Chinua Achebe"
                      className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Genre</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm({ ...form, genre: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                      >
                        <option value="">Select genre</option>
                        {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Condition</label>
                      <select
                        value={form.condition}
                        onChange={(e) => setForm({ ...form, condition: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                      >
                        <option value="like-new">Like New</option>
                        <option value="very-good">Very Good</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Share your thoughts on this book..."
                      className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1b1c19] mb-1">
                      {form.coverUrl ? "Your Own Photos (optional)" : "Book Photos *"}
                    </label>
                    <p className="text-xs text-[#88726f] mb-2">
                      {form.coverUrl
                        ? "Shown instead of the cover from Open Library, if provided. Add as many as you like."
                        : "At least one photo is required so other members can see the book. Add as many as you like."}
                    </p>
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {form.images.map((url) => (
                          <div key={url} className="relative w-14 h-20 shrink-0 group">
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full rounded object-cover border border-[#dbc1bd]"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(url)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1b1c19] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#dbc1bd] bg-[#f5f3ee] text-sm text-[#554240] cursor-pointer hover:border-[#85332a] transition-colors">
                      {uploadingImage ? "Uploading..." : form.images.length > 0 ? "Add more photos" : "Upload photos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {uploadError && <p className="text-xs text-[#ba1a1a] mt-2">{uploadError}</p>}
                  </div>
                  {/* Hidden OL fields — shown collapsed so user knows data was pulled */}
                  {!form.openLibraryKey && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#1b1c19] mb-1">ISBN</label>
                          <input
                            value={form.isbn}
                            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Publish Year</label>
                          <input
                            type="number"
                            value={form.publishYear}
                            onChange={(e) => setForm({ ...form, publishYear: e.target.value })}
                            placeholder="e.g. 1985"
                            className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#1b1c19] mb-1">Cover Image URL</label>
                        <input
                          value={form.coverUrl}
                          onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-4 py-3 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                        />
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>

            {step === "details" && (
              <div className="p-6 border-t border-[#f0eee9] flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border-2 border-[#dbc1bd] text-[#554240] py-3 rounded-lg font-semibold text-sm hover:border-[#85332a] hover:text-[#85332a] transition-colors"
                >
                  Cancel
                </button>
                <div className="relative flex-1 group">
                  <button
                    type="submit"
                    form="book-form"
                    disabled={isPending || missingFields.length > 0}
                    className="w-full bg-[#85332a] text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {isPending ? "Adding..." : "Add to Library"}
                  </button>
                  {missingFields.length > 0 && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[220px] bg-[#1b1c19] text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 text-center">
                      Missing: {missingFields.join(", ")}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-[#1b1c19]" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
