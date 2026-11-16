import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_role_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sp5admin2026';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let inMemoryNotes: any[] = [];
let inMemoryRespects: { user_email: string; note_id: string }[] = [];

const exactProfanities = [
  // Polish profanities & slurs
  'kurwa', 'kurwy', 'kurwie', 'kurwę', 'kurwią', 'chuj', 'huje', 'chuja', 'chujowi', 'chujem', 'pizda', 'pizdy', 'pizdzie', 'pizdę',
  'jeb', 'jebać', 'jebany', 'jebana', 'jebane', 'jebnięty', 'pierdol', 'pierdolić', 'pierdolony', 'pierdolona',
  'cipa', 'cipki', 'cipka', 'pedał', 'pedaly', 'pedali', 'skurwysyn', 'skurwiel', 'suka', 'sukę', 'suce',
  'dziwka', 'dziwki', 'szmata', 'szmaty', 'kutas', 'kutasa', 'ciota', 'cioty', 'chujek', 'chujow', 'kretyn', 'debil', 'idiot',
  'murzyn', 'murzynek', 'murzynka', 'nigger', 'nigga', 'nigg', 'negr', 'neger', 'n1gg', 'n!gg', 'nigg3r', 'nig9a',
  // English profanities & slurs
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'asshole', 'bastard', 'piss', 'slut', 'whore', 'retard',
  'fag', 'faggot', 'coon', 'spic', 'kike', 'chink', 'dyke', 'tranny', 'motherfucker', 'cocksucker'
];

function normalizeWord(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[ąęśćżźłóń]/g, match => {
      const map: { [key: string]: string } = {
        'ą': 'a', 'ę': 'e', 'ś': 's', 'ć': 'c', 'ż': 'z', 'ź': 'z', 'ł': 'l', 'ó': 'o', 'ń': 'n'
      };
      return map[match] || match;
    })
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z0-9]/g, '');
}

function containsProfanity(text: string): boolean {
  if (!text) return false;
  // Split text into words by whitespace and punctuation
  const words = text.toLowerCase().split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
  
  const normalizedProfanities = new Set(exactProfanities.map(p => normalizeWord(p)));

  return words.some(rawWord => {
    const norm = normalizeWord(rawWord);
    if (!norm) return false;
    if (normalizedProfanities.has(norm)) return true;

    // Check specific root stems for heavy profanities (ensuring minimum length / strictness)
    const stems = ['kurw', 'skurw', 'pierdol', 'jeb', 'huj', 'chuj'];
    return stems.some(stem => norm === stem || (norm.startsWith(stem) && norm.length <= stem.length + 4));
  });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

function isAdminRequest(req: Request, userEmail?: string): boolean {
  const adminKeyHeader = req.headers.get('x-admin-key');
  if (adminKeyHeader === ADMIN_SECRET || adminKeyHeader === 'sp5admin2026') return true;
  const userEmailHeader = req.headers.get('x-user-email');
  if (userEmailHeader && userEmailHeader.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com') return true;
  if (userEmail && userEmail.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com') return true;
  const url = new URL(req.url);
  const emailParam = url.searchParams.get('email');
  if (emailParam && emailParam.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com') return true;
  return false;
}

function isValidSp5Class(className: string): boolean {
  if (!className) return false;
  const clean = className.trim().toUpperCase();
  if (clean === 'ABSOLWENT SP5' || clean === 'ABSOLWENT') return true;
  const match = clean.match(/^([1-8])([A-D])$/);
  return match !== null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!supabase) {
      const safeNotes = inMemoryNotes.map(({ ip_address, ...rest }) => rest);
      let userRespectedNotes: string[] = [];
      if (email) {
        userRespectedNotes = inMemoryRespects
          .filter(r => r.user_email === email)
          .map(r => r.note_id);
      }
      return NextResponse.json({ notes: safeNotes, userRespectedNotes, source: 'memory' });
    }

    const { data, error } = await supabase
      .from('sp5_notes')
      .select('id, first_name, last_name, class_name, year_written, message, paper_style, rotation, respect_count, created_at, user_email')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ notes: [], error: error.message }, { status: 500 });
    }

    let userRespectedNotes: string[] = [];
    if (email) {
      const { data: respectsData } = await supabase
        .from('sp5_respects')
        .select('note_id')
        .eq('user_email', email);
      if (respectsData) {
        userRespectedNotes = respectsData.map(r => r.note_id);
      }
    }

    return NextResponse.json({ notes: data || [], userRespectedNotes, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ notes: [], userRespectedNotes: [], source: 'error-fallback', error: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, class_name, message, paper_style, is_creator, user_email } = body;

    if (!first_name || !last_name || !class_name || !message) {
      return NextResponse.json({ error: 'Wszystkie pola (imię, nazwisko, klasa, wiadomość) są wymagane.' }, { status: 400 });
    }

    if (!isValidSp5Class(class_name)) {
      return NextResponse.json({ error: 'Nieprawidłowa klasa SP5. Wybierz klasę od 1A do 8D lub Absolwent SP5.' }, { status: 400 });
    }

    if (message.length > 160) {
      return NextResponse.json({ error: 'Wiadomość może mieć maksymalnie 160 znaków.' }, { status: 400 });
    }

    if (containsProfanity(message) || containsProfanity(first_name) || containsProfanity(last_name) || containsProfanity(class_name)) {
      return NextResponse.json({ error: 'Kartka zawiera niedozwolone słownictwo!' }, { status: 400 });
    }

    const ip_address = getClientIp(req);
    const year_written = new Date().getFullYear();
    const rotation = Number((Math.random() * 8 - 4).toFixed(1));

    const cleanEmail = user_email ? user_email.trim().toLowerCase() : '';
    const checkIsCreator = is_creator || (cleanEmail === 'tymon.wierzbowski@gmail.com');
    
    // Validate paper style
    let style = 'grid';
    if (paper_style === 'lined') style = 'lined';
    if (paper_style === 'gold' && checkIsCreator) style = 'gold';

    if (!supabase) {
      if (!checkIsCreator) {
        if (user_email) {
          const existingEmail = inMemoryNotes.find(n => n.user_email === user_email);
          if (existingEmail) {
            return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę z tego konta Gmail! Każdy uczeń może mieć tylko jedną kartkę.' }, { status: 429 });
          }
        }
        const existingIp = inMemoryNotes.find(n => n.ip_address === ip_address);
        if (existingIp) {
          return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę! Każdy uczeń może mieć tylko jedną.' }, { status: 429 });
        }
      }

      const newNote = {
        id: 'mem-' + Date.now(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        class_name: class_name.trim(),
        year_written,
        message: message.trim(),
        paper_style: style,
        rotation,
        ip_address,
        user_email: user_email ? user_email.trim() : null,
        respect_count: 0,
        created_at: new Date().toISOString()
      };

      if (style === 'gold') {
        inMemoryNotes.unshift(newNote); // pin to top
      } else {
        inMemoryNotes.push(newNote);
      }
      const { ip_address: _, ...safeNote } = newNote;
      return NextResponse.json({ success: true, note: safeNote });
    }

    if (!checkIsCreator) {
      if (user_email) {
        const { data: existingEmailNotes } = await supabase
          .from('sp5_notes')
          .select('id')
          .eq('user_email', user_email.trim());

        if (existingEmailNotes && existingEmailNotes.length > 0) {
          return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę z tego konta Gmail! Każdy uczeń może mieć tylko jedną kartkę.' }, { status: 429 });
        }
      }

      const { data: existingIpNotes } = await supabase
        .from('sp5_notes')
        .select('id')
        .eq('ip_address', ip_address);

      if (existingIpNotes && existingIpNotes.length > 0) {
        return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę! Każdy uczeń może mieć tylko jedną.' }, { status: 429 });
      }
    }

    const insertPayload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      class_name: class_name.trim(),
      year_written,
      message: message.trim(),
      paper_style: style,
      rotation,
      ip_address,
      user_email: user_email ? user_email.trim() : null,
      respect_count: 0
    };

    const { data, error } = await supabase
      .from('sp5_notes')
      .insert([insertPayload])
      .select('id, first_name, last_name, class_name, year_written, message, paper_style, rotation, respect_count, created_at, user_email')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Wystąpił błąd serwera: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const emailParam = url.searchParams.get('email');

    if (!isAdminRequest(req) && url.searchParams.get('admin') !== 'sp5admin2026' && !(emailParam && emailParam.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com')) {
      return NextResponse.json({ error: 'Brak uprawnień administratora (Twórcy Strony).' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Brak ID kartki do usunięcia.' }, { status: 400 });
    }

    if (!supabase) {
      inMemoryNotes = inMemoryNotes.filter(n => n.id !== id);
      inMemoryRespects = inMemoryRespects.filter(r => r.note_id !== id);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('sp5_notes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, user_email } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brak ID kartki.' }, { status: 400 });
    }

    if (action === 'respect' || action === 'unrespect') {
      const delta = action === 'respect' ? 1 : -1;

      if (!supabase) {
        const note = inMemoryNotes.find(n => n.id === id);
        if (!note) {
          return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
        }

        if (user_email) {
          if (action === 'respect') {
            const already = inMemoryRespects.some(r => r.user_email === user_email && r.note_id === id);
            if (!already) {
              inMemoryRespects.push({ user_email, note_id: id });
              note.respect_count = (note.respect_count || 0) + 1;
            }
          } else {
            const idx = inMemoryRespects.findIndex(r => r.user_email === user_email && r.note_id === id);
            if (idx !== -1) {
              inMemoryRespects.splice(idx, 1);
              note.respect_count = Math.max(0, (note.respect_count || 0) - 1);
            }
          }
        } else {
          note.respect_count = Math.max(0, (note.respect_count || 0) + delta);
        }

        return NextResponse.json({ success: true, respect_count: note.respect_count });
      }

      // Supabase database respect tracking
      if (user_email) {
        if (action === 'respect') {
          await supabase.from('sp5_respects').insert([{ user_email: user_email.trim(), note_id: id }]).select();
        } else {
          await supabase.from('sp5_respects').delete().eq('user_email', user_email.trim()).eq('note_id', id);
        }
      }

      const { data: current, error: fetchErr } = await supabase
        .from('sp5_notes')
        .select('respect_count')
        .eq('id', id)
        .single();

      if (fetchErr || !current) {
        return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
      }

      // Recalculate true respect count from sp5_respects if user_email is present, otherwise apply delta
      let newCount = (current.respect_count || 0) + delta;
      if (user_email) {
        const { count, error: countErr } = await supabase
          .from('sp5_respects')
          .select('*', { count: 'exact', head: true })
          .eq('note_id', id);
        if (!countErr && count !== null) {
          newCount = count;
        }
      }
      newCount = Math.max(0, newCount);

      const { error: updateErr } = await supabase
        .from('sp5_notes')
        .update({ respect_count: newCount })
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, respect_count: newCount });
    }

    if (action === 'reset_respect') {
      const isCreatorByEmail = user_email && user_email.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com';
      if (!isAdminRequest(req, user_email) && !isCreatorByEmail) {
        return NextResponse.json({ error: 'Brak uprawnień Twórcy Strony.' }, { status: 403 });
      }

      if (!supabase) {
        const note = inMemoryNotes.find(n => n.id === id);
        if (note) {
          note.respect_count = 0;
          inMemoryRespects = inMemoryRespects.filter(r => r.note_id !== id);
          return NextResponse.json({ success: true, respect_count: 0 });
        }
        return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
      }

      await supabase.from('sp5_respects').delete().eq('note_id', id);
      const { error: updateErr } = await supabase
        .from('sp5_notes')
        .update({ respect_count: 0 })
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, respect_count: 0 });
    }

    if (action === 'make_gold') {
      const isCreatorByEmail = user_email && user_email.trim().toLowerCase() === 'tymon.wierzbowski@gmail.com';
      if (!isAdminRequest(req, user_email) && !isCreatorByEmail) {
        return NextResponse.json({ error: 'Brak uprawnień Twórcy Strony.' }, { status: 403 });
      }

      if (!supabase) {
        const note = inMemoryNotes.find(n => n.id === id);
        if (note) {
          note.paper_style = 'gold';
          inMemoryNotes = [note, ...inMemoryNotes.filter(n => n.id !== id)];
          return NextResponse.json({ success: true, paper_style: 'gold' });
        }
        return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
      }

      const { error: updateErr } = await supabase
        .from('sp5_notes')
        .update({ paper_style: 'gold' })
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, paper_style: 'gold' });
    }

    return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
