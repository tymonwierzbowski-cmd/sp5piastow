'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface Note {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  year_written: number;
  message: string;
  paper_style: string;
  rotation: number;
  respect_count: number;
  created_at: string;
}

interface StudentProfile {
  firstName: string;
  lastName: string;
  className: string;
}

const bellSchedule = [
  { name: '1. Lekcja', startH: 8, startM: 0, endH: 8, endM: 45, type: 'lesson' },
  { name: 'Przerwa', startH: 8, startM: 45, endH: 8, endM: 55, type: 'break' },
  { name: '2. Lekcja', startH: 8, startM: 55, endH: 9, endM: 40, type: 'lesson' },
  { name: 'Przerwa', startH: 9, startM: 40, endH: 9, endM: 50, type: 'break' },
  { name: '3. Lekcja', startH: 9, startM: 50, endH: 10, endM: 35, type: 'lesson' },
  { name: 'Przerwa', startH: 10, startM: 35, endH: 10, endM: 45, type: 'break' },
  { name: '4. Lekcja', startH: 10, startM: 45, endH: 11, endM: 30, type: 'lesson' },
  { name: 'Długa przerwa', startH: 11, startM: 30, endH: 11, endM: 45, type: 'break' },
  { name: '5. Lekcja', startH: 11, startM: 45, endH: 12, endM: 30, type: 'lesson' },
  { name: 'Długa przerwa', startH: 12, startM: 30, endH: 12, endM: 45, type: 'break' },
  { name: '6. Lekcja', startH: 12, startM: 45, endH: 13, endM: 30, type: 'lesson' },
  { name: 'Długa przerwa', startH: 13, startM: 30, endH: 13, endM: 45, type: 'break' },
  { name: '7. Lekcja', startH: 13, startM: 45, endH: 14, endM: 30, type: 'lesson' },
  { name: 'Przerwa', startH: 14, startM: 30, endH: 14, endM: 40, type: 'break' },
  { name: '8. Lekcja', startH: 14, startM: 40, endH: 15, endM: 25, type: 'lesson' },
  { name: 'Przerwa', startH: 15, startM: 25, endH: 15, endM: 35, type: 'break' },
  { name: '9. Lekcja', startH: 15, startM: 35, endH: 16, endM: 20, type: 'lesson' },
  { name: 'Przerwa', startH: 16, startM: 20, endH: 16, endM: 30, type: 'break' },
];

interface NoteCardProps {
  note: Note;
  isCreator: boolean;
  isRespected: boolean;
  onCardClick: (note: Note) => void;
  onRespect: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onMakeGold: (id: string, e: React.MouseEvent) => void;
}

const NoteCard = React.memo(({ note, isCreator, isRespected, onCardClick, onRespect, onDelete, onMakeGold }: NoteCardProps) => {
  const isNoteCreator =
    note.first_name.toLowerCase() === 'tymon' &&
    note.last_name.toLowerCase() === 'wierzbowski';

  return (
    <div
      className={`sp5-card ${note.paper_style}`}
      style={{ transform: `rotate(${note.rotation}deg)` }}
      onClick={() => onCardClick(note)}
    >
      {isCreator && (
        <div
          className="sp5-card-admin-bar"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="sp5-mini-btn delete"
            title="Usuń kartkę"
            onClick={(e) => onDelete(note.id, e)}
          >
            🗑️ Usuń
          </button>
          {note.paper_style !== 'gold' && (
            <button
              className="sp5-mini-btn gold"
              title="Zmień na Złotą Legendę"
              onClick={(e) => onMakeGold(note.id, e)}
            >
              👑 Złota
            </button>
          )}
        </div>
      )}

      <div className="sp5-card-message">„{note.message}”</div>
      <div className="sp5-card-footer">
        <span>
          {note.first_name} {note.last_name} • {note.class_name} • {note.year_written}{' '}
          {isNoteCreator && '👑'}
        </span>
        <button
          className={`sp5-respect-badge respect-btn ${isRespected ? 'respected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onRespect(note.id, e);
          }}
          title={isRespected ? 'Już dałeś Szacun tej kartce!' : 'Kliknij, aby dać Szacun (+1)'}
        >
          {isRespected ? `✓ Szacun (${note.respect_count})` : `🔥 ${note.respect_count}`}
        </button>
      </div>
    </div>
  );
});
NoteCard.displayName = 'NoteCard';

const sp5Classes = [
  '1A', '1B', '1C', '1D',
  '2A', '2B', '2C', '2D',
  '3A', '3B', '3C', '3D',
  '4A', '4B', '4C', '4D',
  '5A', '5B', '5C', '5D',
  '6A', '6B', '6C', '6D',
  '7A', '7B', '7C', '7D',
  '8A', '8B', '8C', '8D',
  'Absolwent SP5'
];

function SzkolnaPodlogaApp() {
  const searchParams = useSearchParams();
  const urlAdmin = searchParams.get('admin') === 'sp5admin2026';

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [classInput, setClassInput] = useState('8A');

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gold' | 'top' | 'class8' | 'class7' | 'class6'>('all');
  const [respectedNotes, setRespectedNotes] = useState<string[]>([]);

  // Add Note Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPaperStyle, setSelectedPaperStyle] = useState('grid');
  const [messageInput, setMessageInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [activeCard, setActiveCard] = useState<Note | null>(null);

  // Bell countdown timer state
  const [bellStatus, setBellStatus] = useState('Koniec lekcji');

  // Check if current user is Creator (Tymon Wierzbowski or URL admin)
  const isCreator =
    urlAdmin ||
    (profile !== null &&
      profile.firstName.trim().toLowerCase() === 'tymon' &&
      profile.lastName.trim().toLowerCase() === 'wierzbowski');

  useEffect(() => {
    // Load student profile from localStorage
    const saved = localStorage.getItem('sp5_student_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        setOnboardingOpen(true);
      }
    } else {
      setOnboardingOpen(true);
    }

    const savedRespected = localStorage.getItem('sp5_respected_notes');
    if (savedRespected) {
      try {
        setRespectedNotes(JSON.parse(savedRespected));
      } catch (e) {}
    }

    fetchNotes();

    // Schedule clock
    const updateClock = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday

      if (day === 0 || day === 6) {
        setBellStatus('Koniec lekcji (Weekend)');
        return;
      }

      const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      let foundStatus = 'Po lekcjach';

      for (const p of bellSchedule) {
        const pStart = p.startH * 3600 + p.startM * 60;
        const pEnd = p.endH * 3600 + p.endM * 60;

        if (currentSecs >= pStart && currentSecs <= pEnd) {
          if (p.type === 'lesson') {
            const leftSecs = pEnd - currentSecs;
            const m = Math.floor(leftSecs / 60);
            const s = leftSecs % 60;
            foundStatus = `${p.name} (do końca ${m}m ${s < 10 ? '0' : ''}${s}s)`;
          } else {
            const leftSecs = pEnd - currentSecs;
            const m = Math.floor(leftSecs / 60);
            const s = leftSecs % 60;
            foundStatus = `Przerwa (do końca ${m}m ${s < 10 ? '0' : ''}${s}s)`;
          }
          break;
        } else if (currentSecs < pStart) {
          foundStatus = `Przed lekcją (${p.name} o ${p.startH}:${p.startM < 10 ? '0' : ''}${p.startM})`;
          break;
        }
      }
      setBellStatus(foundStatus);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      const notesList = data.notes || (Array.isArray(data) ? data : []);
      setNotes(notesList);
    } catch (err) {
      console.error('Błąd pobierania kartek:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNameInput.trim() || !lastNameInput.trim() || !classInput.trim()) {
      alert('Wypełnij wszystkie pola profilu!');
      return;
    }
    const newProfile: StudentProfile = {
      firstName: firstNameInput.trim(),
      lastName: lastNameInput.trim(),
      className: classInput.trim().toUpperCase()
    };
    setProfile(newProfile);
    localStorage.setItem('sp5_student_profile', JSON.stringify(newProfile));
    setOnboardingOpen(false);
  };

  const handleOpenAddModal = () => {
    if (!profile) {
      setOnboardingOpen(true);
      return;
    }
    setMessageInput('');
    setFormError('');
    setFormSuccess('');
    setAddModalOpen(true);
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !profile) return;

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isCreator ? { 'x-admin-key': 'sp5admin2026' } : {})
        },
        body: JSON.stringify({
          first_name: profile.firstName,
          last_name: profile.lastName,
          class_name: profile.className,
          message: messageInput.trim(),
          paper_style: selectedPaperStyle
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess('Kartka została pomyślnie rzucona na szkolną podłogę! 🎉');
        setMessageInput('');
        await fetchNotes();
        setTimeout(() => {
          setAddModalOpen(false);
        }, 1000);
      } else {
        setFormError(data.error || 'Nie udało się rzucić kartki.');
      }
    } catch (err: any) {
      setFormError('Błąd połączenia z serwerem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespect = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!isCreator && respectedNotes.includes(id)) {
      return; // already respected
    }

    const updatedRespected = isCreator ? respectedNotes : [...respectedNotes, id];
    if (!isCreator) {
      setRespectedNotes(updatedRespected);
      localStorage.setItem('sp5_respected_notes', JSON.stringify(updatedRespected));
    }

    // Optimistic update
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, respect_count: (n.respect_count || 0) + 1 } : n))
    );
    if (activeCard && activeCard.id === id) {
      setActiveCard(prev => (prev ? { ...prev, respect_count: (prev.respect_count || 0) + 1 } : null));
    }

    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'respect' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotes(prev =>
          prev.map(n => (n.id === id ? { ...n, respect_count: data.respect_count } : n))
        );
        if (activeCard && activeCard.id === id) {
          setActiveCard(prev => (prev ? { ...prev, respect_count: data.respect_count } : null));
        }
      }
    } catch (err) {
      console.error('Błąd przyznawania szacunku:', err);
    }
  }, [isCreator, respectedNotes, activeCard]);

  const handleDeleteNote = useCallback(async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kartkę (uprawnienia Twórcy)?')) return;
    try {
      const res = await fetch(`/api/notes?id=${id}&admin=sp5admin2026`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'sp5admin2026' }
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        setActiveCard(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Nie udało się usunąć kartki.');
      }
    } catch (err) {
      alert('Błąd połączenia.');
    }
  }, []);

  const handleMakeGold = useCallback(async (id: string) => {
    if (!confirm('Czy zamienić tę kartkę w Złotą Legendę i przypiąć na górę?')) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'sp5admin2026'
        },
        body: JSON.stringify({ id, action: 'make_gold' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchNotes();
        setActiveCard(null);
      } else {
        alert(data.error || 'Nie udało się zmienić stylu na złoty.');
      }
    } catch (err) {
      alert('Błąd połączenia.');
    }
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Szkolna Podłoga SP5 Piastów',
        text: 'Zobacz pamiątki uczniów na szkolnym korytarzu SP5 Piastów!',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Skopiowano link do schowka! Wklej go na grupę klasową 📱');
    }
  };

  // Helper for correct Polish declension of "kartka"
  const getKartkiForm = (count: number) => {
    if (count === 1) return '1 kartka';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} kartki`;
    }
    return `${count} kartek`;
  };

  // Calculate active class with most notes
  const classCounts: { [key: string]: number } = {};
  notes.forEach(n => {
    const cl = n.class_name.toUpperCase();
    classCounts[cl] = (classCounts[cl] || 0) + 1;
  });
  let activeClass = 'Brak';
  let maxCount = 0;
  Object.entries(classCounts).forEach(([cl, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      activeClass = `${cl} (${getKartkiForm(cnt)})`;
    }
  });

  const rankedClasses = useMemo(() => {
    const classStats: { [key: string]: { notesCount: number; respectSum: number; score: number } } = {};
    notes.forEach(n => {
      const cl = n.class_name.toUpperCase().trim();
      if (!cl) return;
      if (!classStats[cl]) {
        classStats[cl] = { notesCount: 0, respectSum: 0, score: 0 };
      }
      classStats[cl].notesCount += 1;
      classStats[cl].respectSum += (n.respect_count || 0);
    });

    return Object.entries(classStats)
      .map(([className, stats]) => ({
        className,
        notesCount: stats.notesCount,
        respectSum: stats.respectSum,
        score: (stats.notesCount * 10) + stats.respectSum
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [notes]);

  const topLeaderScore = rankedClasses.length > 0 ? rankedClasses[0].score : 1;

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (selectedFilter === 'gold' && n.paper_style !== 'gold') return false;
      if (selectedFilter === 'top' && (n.respect_count || 0) < 20) return false;
      if (selectedFilter === 'class8' && !n.class_name.toUpperCase().startsWith('8')) return false;
      if (selectedFilter === 'class7' && !n.class_name.toUpperCase().startsWith('7')) return false;
      if (selectedFilter === 'class6' && !n.class_name.toUpperCase().startsWith('6')) return false;

      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        n.first_name.toLowerCase().includes(q) ||
        n.last_name.toLowerCase().includes(q) ||
        n.class_name.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        String(n.year_written).includes(q)
      );
    });
  }, [notes, selectedFilter, searchQuery]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="sp5-container">
      {/* Permanent Sidebar Ranking Panel */}
      <aside className="sp5-sidebar">
        <div className="sp5-ranking-sidebar-card">
          <h3 className="sp5-sidebar-title">🏆 Ranking TOP 5 Klas</h3>
          <p className="sp5-sidebar-subtitle">Puchar Klas SP5 • Punkty za kartki i Szacun</p>
          <div className="sp5-ranking-list">
            {rankedClasses.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#a7f3d0', fontSize: '0.85rem' }}>
                Brak punktów — rzuć kartkę jako pierwszy!
              </p>
            ) : (
              rankedClasses.map((item, idx) => {
                const progressPct = topLeaderScore > 0 ? Math.round((item.score / topLeaderScore) * 100) : 0;
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={item.className} className="sp5-ranking-item">
                    <div className="sp5-ranking-row-top">
                      <span className="sp5-ranking-place">
                        {medals[idx] || `${idx + 1}.`} <strong>Klasa {item.className}</strong>
                      </span>
                      <span className="sp5-ranking-score">
                        {item.score} pkt <span className="sp5-ranking-details">({item.notesCount} kartek, 🔥 {item.respectSum})</span>
                      </span>
                    </div>
                    <div className="sp5-ranking-bar-bg">
                      <div className="sp5-ranking-bar-fill" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Header & Controls */}
      <header className="sp5-header">
        <div className="sp5-header-top">
          <div className="sp5-title-area">
            <h1>🏫 SZKOLNA PODŁOGA SP5 PIASTÓW</h1>
            <p>Porozrzucane kartki z pamiątkami uczniów</p>
          </div>

          <div className="sp5-user-badge-area">
            {profile && (
              <div className="sp5-user-badge">
                <span>
                  {profile.firstName} {profile.lastName} ({profile.className})
                </span>
                {isCreator && <span className="sp5-creator-badge">👑 TWÓRCA STRONY</span>}
                <button
                  className="sp5-change-btn"
                  onClick={() => {
                    setFirstNameInput(profile.firstName);
                    setLastNameInput(profile.lastName);
                    setClassInput(profile.className);
                    setOnboardingOpen(true);
                  }}
                >
                  Zmień dane
                </button>
              </div>
            )}
          </div>
        </div>

        {/* School HUD Stats */}
        <div className="sp5-hud-stats">
          <div className="sp5-hud-item">
            🏆 Najbardziej aktywna klasa: <strong>{activeClass}</strong>
          </div>
          <div className="sp5-hud-item">
            ⏰ Zegar SP5: <strong>{bellStatus}</strong>
          </div>
          <div className="sp5-hud-item">
            📄 Kartek na podłodze: <strong>{notes.length}</strong>
          </div>
          {isCreator && (
            <div className="sp5-hud-item" style={{ color: '#fbbf24' }}>
              ✨ Tryb Twórcy aktywny (Brak limitu IP, Pełna Edycja)
            </div>
          )}
        </div>

        <div className="sp5-controls">
          <input
            type="text"
            className="sp5-search-input"
            placeholder="Szukaj po imieniu, klasie lub treści..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button className="sp5-action-btn share" onClick={handleShare}>
            🔗 Udostępnij link
          </button>
        </div>

        {/* Quick Filters Bar */}
        <div className="sp5-filters-bar">
          <button
            className={`sp5-filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            Wszystkie
          </button>
          <button
            className={`sp5-filter-pill ${selectedFilter === 'gold' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('gold')}
          >
            👑 Złote Legendy
          </button>
          <button
            className={`sp5-filter-pill ${selectedFilter === 'top' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('top')}
          >
            🔥 Top Szacun
          </button>
          <button
            className={`sp5-filter-pill ${selectedFilter === 'class8' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('class8')}
          >
            Klasy 8
          </button>
          <button
            className={`sp5-filter-pill ${selectedFilter === 'class7' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('class7')}
          >
            Klasy 7
          </button>
          <button
            className={`sp5-filter-pill ${selectedFilter === 'class6' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('class6')}
          >
            Klasy 6
          </button>
        </div>
      </header>

      {/* Floor Grid */}
      <main className="sp5-floor-grid">
        {loading ? (
          <div className="empty-state">
            <h3>Zbieranie kartek z podłogi...</h3>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-state chalkboard-empty">
            <div className="chalkboard-message-box">
              <h3>Podłoga jest jeszcze czysta!</h3>
              <p>Bądź pierwszą osobą z SP5 Piastów, która rzuci tu swoją kartkę.</p>
            </div>
          </div>
        ) : (
          filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isCreator={isCreator}
              isRespected={respectedNotes.includes(note.id)}
              onCardClick={setActiveCard}
              onRespect={handleRespect}
              onDelete={(id, e) => {
                e.stopPropagation();
                handleDeleteNote(id);
              }}
              onMakeGold={(id, e) => {
                e.stopPropagation();
                handleMakeGold(id);
              }}
            />
          ))
        )}
      </main>

      {/* Floating Action Button (+ Rzuć swoją kartkę) */}
      <div className="sp5-fab-container">
        <button className="sp5-fab" onClick={handleOpenAddModal}>
          ✍️ + Rzuć swoją kartkę na podłogę
        </button>
      </div>

      {/* Onboarding / Profile Modal */}
      {onboardingOpen && (
        <div className="sp5-modal-backdrop">
          <div className="sp5-modal-content onboarding">
            <h2 className="sp5-modal-title">Kim jesteś, Uczniu SP5?</h2>
            <p className="sp5-modal-subtitle">
              Wpisz swoje dane, aby rzucić kartkę na korytarz lub zobaczyć pamiątki innych. (Wpisz
              „Tymon Wierzbowski”, aby aktywować tryb Twórcy).
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="sp5-form-group">
                <label className="sp5-form-label">Imię</label>
                <input
                  type="text"
                  className="sp5-form-input"
                  placeholder="np. Tomek"
                  value={firstNameInput}
                  onChange={e => setFirstNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="sp5-form-group">
                <label className="sp5-form-label">Nazwisko</label>
                <input
                  type="text"
                  className="sp5-form-input"
                  placeholder="np. Kowalski"
                  value={lastNameInput}
                  onChange={e => setLastNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="sp5-form-group">
                <label className="sp5-form-label">Wybierz klasę</label>
                <select
                  className="sp5-form-input"
                  value={classInput}
                  onChange={e => setClassInput(e.target.value)}
                  required
                >
                  <option value="">-- Wybierz klasę SP5 --</option>
                  {sp5Classes.map(cls => (
                    <option key={cls} value={cls}>
                      Klasa {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sp5-modal-actions">
                <button type="submit" className="sp5-btn-primary">
                  Wejdź na podłogę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {addModalOpen && profile && (
        <div className="sp5-modal-backdrop">
          <div className="sp5-modal-content">
            <h2 className="sp5-modal-title">Rzuć kartkę na podłogę</h2>
            <p className="sp5-modal-subtitle">
              Podpis:{' '}
              <strong>
                {profile.firstName} {profile.lastName} • {profile.className} • {currentYear}
              </strong>
              {isCreator && ' 👑 [Twórca]'}
            </p>

            {formError && <div className="sp5-error-msg">{formError}</div>}
            {formSuccess && <div className="sp5-success-msg">{formSuccess}</div>}

            <form onSubmit={handleAddNoteSubmit}>
              <div className="sp5-form-group">
                <label className="sp5-form-label">Wybierz rodzaj papieru</label>
                <div
                  className={`sp5-paper-options ${
                    isCreator ? 'creator-grid' : ''
                  }`}
                >
                  <div
                    className={`sp5-paper-option grid-sample ${
                      selectedPaperStyle === 'grid' ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedPaperStyle('grid')}
                  >
                    Kratka
                  </div>
                  <div
                    className={`sp5-paper-option lined-sample ${
                      selectedPaperStyle === 'lined' ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedPaperStyle('lined')}
                  >
                    Linie
                  </div>
                  {isCreator && (
                    <div
                      className={`sp5-paper-option gold-sample ${
                        selectedPaperStyle === 'gold' ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedPaperStyle('gold')}
                    >
                      👑 Złota Legenda
                    </div>
                  )}
                </div>
              </div>

              <div className="sp5-form-group">
                <label className="sp5-form-label">Twoja pamiątka (max 160 znaków)</label>
                <textarea
                  className="sp5-form-textarea"
                  placeholder="Napisz coś fajnego, pozdrów kolegów lub zostaw wspomnienie..."
                  maxLength={160}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  required
                />
                <div className="sp5-char-count">{messageInput.length} / 160</div>
              </div>

              <div className="sp5-modal-actions">
                <button
                  type="button"
                  className="sp5-btn-secondary"
                  onClick={() => setAddModalOpen(false)}
                >
                  Anuluj
                </button>
                <button type="submit" className="sp5-btn-primary" disabled={submitting}>
                  {submitting ? 'Rzucanie...' : 'Rzuć na podłogę!'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeCard && (
        <div className="sp5-modal-backdrop" onClick={() => setActiveCard(null)}>
          <div
            className={`sp5-detail-card ${activeCard.paper_style}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="sp5-detail-message">„{activeCard.message}”</div>

            <div className="sp5-detail-footer">
              <span>
                {activeCard.first_name} {activeCard.last_name} • {activeCard.class_name} •{' '}
                {activeCard.year_written}
              </span>
              <span className="sp5-respect-badge">🔥 {activeCard.respect_count}</span>
            </div>

            <div className="sp5-detail-actions">
              <button
                className="sp5-btn-primary"
                onClick={() => handleRespect(activeCard.id)}
              >
                🔥 Szacun (+1)
              </button>
              {isCreator && (
                <>
                  <button
                    className="sp5-btn-danger"
                    onClick={() => handleDeleteNote(activeCard.id)}
                  >
                    🗑️ Usuń
                  </button>
                  {activeCard.paper_style !== 'gold' && (
                    <button
                      className="sp5-btn-secondary"
                      style={{ background: '#d97706', color: '#fff' }}
                      onClick={() => handleMakeGold(activeCard.id)}
                    >
                      👑 Zmień na Złotą
                    </button>
                  )}
                </>
              )}
              <button
                className="sp5-btn-secondary"
                onClick={() => setActiveCard(null)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
          Ładowanie szkolnej podłogi...
        </div>
      }
    >
      <SzkolnaPodlogaApp />
    </Suspense>
  );
}
