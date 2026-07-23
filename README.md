# RetroScaffale 🕹️

Una **Progressive Web App** per tracciare la tua collezione di videogiochi tra
console e retroconsole. Veloce, visiva, installabile e **completamente offline** —
nessun backend, i dati vivono solo sul tuo dispositivo.

L'identità visiva è ispirata alle **cartucce/custodie** disposte su uno scaffale:
ogni console è una "cartuccia" colorata con un anello di completamento.

## Caratteristiche

- **Home / scaffale** — griglia di cartucce console, ognuna con un **anello di
  progresso** che indica il completamento a colpo d'occhio tramite colore e
  riempimento (nessun numero in primo piano).
- **Schermata console** — l'elenco dei giochi. Ogni riga mostra **solo** il
  titolo + un indicatore di stato puramente visivo:
  - ✅ **Posseduto** — pallino pieno con spunta (verde)
  - ⚪ **Mancante** — pallino vuoto/contornato, desaturato
  - ⭐ **Wishlist** — stella (ambra)
- **Tap = cambio stato** — toccare un gioco cicla lo stato
  `Mancante → Posseduto → Wishlist → Mancante`, senza conferme né menu.
- **Filtri a icone** — mostra *tutti* / *solo mancanti* / *solo wishlist*.
- **Modifica** — aggiungi/rimuovi console (dallo scaffale) e giochi (dentro una
  console) con il pulsante ✏️.
- **Dati minimali** — ogni gioco ha solo *titolo* e *stato*. Niente regione,
  formato, prezzo o note.
- **PWA completa** — `manifest.json` + service worker per uso offline e
  installazione su smartphone e desktop.
- **Responsive** e accessibile: focus da tastiera visibile, etichette ARIA,
  rispetto di `prefers-reduced-motion`.

## Console precaricate

NES · SNES · N64 · GameCube · Wii · Wii U · Switch · Game Boy/GBC/GBA · DS/3DS ·
PS1 · PS2 · PSP · Master System · Mega Drive/Genesis · Saturn · Dreamcast ·
Game Gear (vuota, da popolare).

Tutti i giochi partono come **mancanti**; lo stato lo cambi tu.

## Come si usa

È un sito statico: apri `index.html` da un qualsiasi server statico (il service
worker richiede `http://localhost` o `https`).

```bash
# esempio con python
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Su Chrome/Edge/Android comparirà il pulsante **"Installa l'app"**; su iOS usa
*Condividi → Aggiungi a Home*.

## Persistenza

I dati sono salvati in `localStorage` (chiave `retroscaffale.v1`) e persistono
tra le sessioni. Nessun dato lascia il dispositivo.

## Struttura

```
index.html        # shell dell'app
style.css         # identità visiva (scaffale/cartucce)
app.js            # logica, stato, routing, persistenza, PWA
data.js           # console e giochi precaricati (seed)
manifest.json     # metadati PWA + icone
sw.js             # service worker (cache offline app-shell)
icons/            # icone PWA (192/512, normali + maskable)
scripts/          # strumenti di sviluppo (generazione icone, test)
```

## Strumenti di sviluppo (opzionali)

- `scripts/gen_icons.py` — rigenera le icone PWA (solo Python, nessuna dipendenza).
- `scripts/test_app.mjs`, `scripts/demo_shots.mjs` — test e screenshot con
  Playwright (`npm i -D playwright`, poi `node scripts/test_app.mjs`).
