# Transcriptor Desktop Client

## Voraussetzungen
- Python 3.10+
- FFmpeg installiert (für Whisper-Audioverarbeitung)
- Mikrofonzugriff – nur eigene Stimme aufzeichnen, keine heimlichen Aufnahmen.

## Installation
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Whisper-Modell laden
Das Skript nutzt standardmäßig das `base`-Modell. Alternativ kann in `config.json` `whisper_model` auf `small` gestellt werden.

## Nutzung
1. Starte das Menü:
   ```bash
   python main.py
   ```
2. Lizenz eingeben (Option 4) und Backend-URL setzen.
3. Mikrofon wählen (Option 3). Es werden nur Eingabegeräte angezeigt.
4. Live-Mitschrift starten (Option 1). Alle 5 Sekunden werden Blöcke transkribiert und in `mitschrift_raw.txt` gespeichert.
5. Mitschrift verbessern (Option 2) sendet den Text an das Backend und gibt die strukturierte Version zurück.
6. Notfall-Funktion (Option 5) schickt die letzten Blöcke an das Backend und zeigt eine kurze sowie ausführliche Erklärung.

## Sicherheit & Ethik
- Das Tool ist ausschließlich für die eigene Mitschrift und Lernhilfe gedacht.
- Keine heimlichen Aufnahmen dritter Personen.
- Schütze deine Lizenzschlüssel und den Backend-Admin-Zugang.
