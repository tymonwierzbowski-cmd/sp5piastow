import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_role_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sp5admin2026';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Starter notes without sticky notes
const starterNotes = [
  {
    id: 'starter-1',
    first_name: 'Kacper',
    last_name: 'Wiśniewski',
    class_name: '8A',
    year_written: 2026,
    message: 'Kto pamięta legendarne bułki z szynką w szkolnym sklepiku? Pozdrowienia dla całej SP5!',
    paper_style: 'grid',
    rotation: -2.5,
    ip_address: '127.0.0.1',
    respect_count: 24,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'starter-2',
    first_name: 'Zuzia',
    last_name: 'Kowalska',
    class_name: '7B',
    year_written: 2026,
    message: 'Najlepsza klasa 7B pozdrawia panią od biologii! Kto idzie na oranżadę po lekcjach?',
    paper_style: 'lined',
    rotation: 1.8,
    ip_address: '127.0.0.2',
    respect_count: 19,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'starter-3',
    first_name: 'Bartek',
    last_name: 'Nowak',
    class_name: '8C',
    year_written: 2026,
    message: 'Piastów rulez! SP5 na zawsze w sercu. Kto gra w piłkę na boisku asfaltowym po dzwonku?',
    paper_style: 'grid',
    rotation: 3.2,
    ip_address: '127.0.0.3',
    respect_count: 31,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'starter-4',
    first_name: 'Tymon',
    last_name: 'Wierzbowski',
    class_name: '8B',
    year_written: 2026,
    message: 'Złota Legenda SP5: Witajcie na oficjalnej podłodze naszej szkoły! Piszcie z szacunkiem i tworzymy historię.',
    paper_style: 'gold',
    rotation: -0.5,
    ip_address: '127.0.0.4',
    respect_count: 99,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'starter-5',
    first_name: 'Ola',
    last_name: 'Zielińska',
    class_name: '6A',
    year_written: 2025,
    message: 'Kto zgubił czarną bluzę z kapturem w szatni? Czeka na portierni! Pozdro dla 6A.',
    paper_style: 'lined',
    rotation: -3.8,
    ip_address: '127.0.0.5',
    respect_count: 12,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'starter-6',
    first_name: 'Michał',
    last_name: 'Wójcik',
    class_name: '8B',
    year_written: 2026,
    message: 'Matma z panem profesorem to czysta przygoda. Kto ma pożyczyć cyrkiel na zaraz?',
    paper_style: 'grid',
    rotation: 2.1,
    ip_address: '127.0.0.6',
    respect_count: 15,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'starter-7',
    first_name: 'Julia',
    last_name: 'Kamińska',
    class_name: '5B',
    year_written: 2026,
    message: 'Uwielbiam świetlicę w SP5! Nasze rysunki wiszą na tablicy. Pozdrowienia dla pani wychowawczyni!',
    paper_style: 'lined',
    rotation: -1.2,
    ip_address: '127.0.0.7',
    respect_count: 22,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'starter-8',
    first_name: 'Tomek',
    last_name: 'Lewandowski',
    class_name: '8A',
    year_written: 2026,
    message: 'Ostatni rok w tej szkole... Będzie mi brakowało tych schodów i hałasów na przerwach. Trzymajcie się!',
    paper_style: 'grid',
    rotation: 3.5,
    ip_address: '127.0.0.8',
    respect_count: 40,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'starter-9',
    first_name: 'Karolina',
    last_name: 'Adamczyk',
    class_name: '7A',
    year_written: 2026,
    message: 'Kto pożyczy notatki z historii? Zbliża się kartkówka z II wojny światowej, ratunku!',
    paper_style: 'lined',
    rotation: -2.1,
    ip_address: '127.0.0.9',
    respect_count: 18,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'starter-10',
    first_name: 'Mateusz',
    last_name: 'Wójcik',
    class_name: '6C',
    year_written: 2026,
    message: 'Najlepsze boisko do kosza jest za halą sportową w SP5! Kto gram w środę po lekcjach?',
    paper_style: 'grid',
    rotation: 1.4,
    ip_address: '127.0.0.10',
    respect_count: 27,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'starter-11',
    first_name: 'Natalia',
    last_name: 'Dąbrowska',
    class_name: '8B',
    year_written: 2026,
    message: 'Pozdrowienia dla całej ekipy z 8B! Będziemy tęsknić za naszymi rozrabianiami w SP5.',
    paper_style: 'grid',
    rotation: -3.0,
    ip_address: '127.0.0.11',
    respect_count: 35,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'starter-12',
    first_name: 'Jakub',
    last_name: 'Kamiński',
    class_name: '7B',
    year_written: 2026,
    message: 'Kto pamięta zieloną szkołę i nocne narady w pokoju? To były legendarne czasy!',
    paper_style: 'lined',
    rotation: 2.7,
    ip_address: '127.0.0.12',
    respect_count: 29,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: 'starter-13',
    first_name: 'Oliwia',
    last_name: 'Szymańska',
    class_name: '5B',
    year_written: 2026,
    message: 'Nasza pani od polskiego jest super, chociaż każe czytać dużo książek. Pozdro dla 5B!',
    paper_style: 'lined',
    rotation: -1.5,
    ip_address: '127.0.0.13',
    respect_count: 14,
    created_at: new Date(Date.now() - 86400000 * 1.5).toISOString()
  },
  {
    id: 'starter-14',
    first_name: 'Filip',
    last_name: 'Mazur',
    class_name: '8A',
    year_written: 2026,
    message: 'Kto ma fizykę z panem dyrektorem? Trzymajcie się, damy radę z Otwartym Zadaniem!',
    paper_style: 'grid',
    rotation: 0.9,
    ip_address: '127.0.0.14',
    respect_count: 33,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'starter-15',
    first_name: 'Maja',
    last_name: 'Wójcik',
    class_name: '6A',
    year_written: 2026,
    message: 'Piastów to super miasto, a SP5 to najlepsza podstawówka w województwie!',
    paper_style: 'lined',
    rotation: -2.8,
    ip_address: '127.0.0.15',
    respect_count: 21,
    created_at: new Date(Date.now() - 5000000).toISOString()
  },
  {
    id: 'starter-16',
    first_name: 'Dawid',
    last_name: 'Krawczyk',
    class_name: '7A',
    year_written: 2026,
    message: 'Kto idzie na zapiekanki po lekcjach na ul. Piłsudskiego? Kto pierwszy, ten lepszy!',
    paper_style: 'grid',
    rotation: 3.1,
    ip_address: '127.0.0.16',
    respect_count: 28,
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];

let inMemoryNotes = [...starterNotes];

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

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ notes: inMemoryNotes, source: 'memory' });
    }

    const { data, error } = await supabase
      .from('sp5_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ notes: data && data.length > 0 ? data : starterNotes, source: 'supabase-fallback' });
    }

    return NextResponse.json({ notes: data, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ notes: starterNotes, source: 'error-fallback', error: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, class_name, message, paper_style, is_creator } = body;

    if (!first_name || !last_name || !class_name || !message) {
      return NextResponse.json({ error: 'Wszystkie pola (imię, nazwisko, klasa, wiadomość) są wymagane.' }, { status: 400 });
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
      return NextResponse.json({ success: true, note: newNote });
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
      .select()
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

    if (action === 'respect') {
      if (!supabase) {
        const note = inMemoryNotes.find(n => n.id === id);
        if (note) {
          note.respect_count += 1;
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

      const newCount = (current.respect_count || 0) + 1;
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
          // Move to top
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
