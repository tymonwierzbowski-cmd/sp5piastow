import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_role_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sp5admin2026';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let inMemoryNotes: any[] = [];

const profanityList = ['kurw', 'chuj', 'pizd', 'jeb', 'huj', 'cip', 'pedal', 'skurw', 'pierd', 'fujara', 'kretyn', 'debil'];
function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return profanityList.some(word => lower.includes(word));
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

function isAdminRequest(req: Request): boolean {
  const adminKeyHeader = req.headers.get('x-admin-key');
  return adminKeyHeader === ADMIN_SECRET || adminKeyHeader === 'sp5admin2026';
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
    if (!supabase) {
      const safeNotes = inMemoryNotes.map(({ ip_address, ...rest }) => rest);
      return NextResponse.json({ notes: safeNotes, source: 'memory' });
    }

    const { data, error } = await supabase
      .from('sp5_notes')
      .select('id, first_name, last_name, class_name, year_written, message, paper_style, rotation, respect_count, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ notes: [], error: error.message }, { status: 500 });
    }

    const safeData = data || [];
    return NextResponse.json({ notes: safeData, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ notes: [], source: 'error-fallback', error: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, class_name, message, paper_style, is_creator } = body;

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
      return NextResponse.json({ error: 'Wykryto niedozwolone słowa. Szanujmy się w szkolnej społeczności SP5!' }, { status: 400 });
    }

    const ip_address = getClientIp(req);
    const year_written = new Date().getFullYear();
    const rotation = Number((Math.random() * 8 - 4).toFixed(1));

    const checkIsCreator = is_creator || (first_name.trim().toLowerCase() === 'tymon' && last_name.trim().toLowerCase() === 'wierzbowski');
    
    // Validate paper style
    let style = 'grid';
    if (paper_style === 'lined') style = 'lined';
    if (paper_style === 'gold' && checkIsCreator) style = 'gold';

    if (!supabase) {
      if (!checkIsCreator) {
        const existing = inMemoryNotes.find(n => n.ip_address === ip_address);
        if (existing) {
          return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę! Każdy uczeń ma tylko jedną.' }, { status: 429 });
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
      const { data: existingNotes } = await supabase
        .from('sp5_notes')
        .select('id')
        .eq('ip_address', ip_address);

      if (existingNotes && existingNotes.length > 0) {
        return NextResponse.json({ error: 'Już rzuciłeś swoją kartkę na podłogę! Każdy uczeń ma tylko jedną.' }, { status: 429 });
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
      respect_count: 0
    };

    const { data, error } = await supabase
      .from('sp5_notes')
      .insert([insertPayload])
      .select('id, first_name, last_name, class_name, year_written, message, paper_style, rotation, respect_count, created_at')
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

    if (!isAdminRequest(req) && url.searchParams.get('admin') !== 'sp5admin2026') {
      return NextResponse.json({ error: 'Brak uprawnień administratora (Twórcy Strony).' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Brak ID kartki do usunięcia.' }, { status: 400 });
    }

    if (!supabase) {
      inMemoryNotes = inMemoryNotes.filter(n => n.id !== id);
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
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brak ID kartki.' }, { status: 400 });
    }

    if (action === 'respect' || action === 'unrespect') {
      const delta = action === 'respect' ? 1 : -1;
      if (!supabase) {
        const note = inMemoryNotes.find(n => n.id === id);
        if (note) {
          note.respect_count = Math.max(0, (note.respect_count || 0) + delta);
          return NextResponse.json({ success: true, respect_count: note.respect_count });
        }
        return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
      }

      const { data: current, error: fetchErr } = await supabase
        .from('sp5_notes')
        .select('respect_count')
        .eq('id', id)
        .single();

      if (fetchErr || !current) {
        return NextResponse.json({ error: 'Nie znaleziono kartki.' }, { status: 404 });
      }

      const newCount = Math.max(0, (current.respect_count || 0) + delta);
      const { error: updateErr } = await supabase
        .from('sp5_notes')
        .update({ respect_count: newCount })
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, respect_count: newCount });
    }

    if (action === 'make_gold') {
      if (!isAdminRequest(req)) {
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
