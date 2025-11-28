import sys
import time
from audio_transcriber import LiveTranscriber, list_microphones
from license_client import check_license, load_config, save_config
from gpt_client import improve_notes, emergency_help


def choose_microphone():
  devices = list_microphones()
  if not devices:
    print('Keine Mikrofone gefunden.')
    return None
  for idx, (dev_idx, name) in enumerate(devices):
    print(f"[{idx}] {name} (ID {dev_idx})")
  selection = input('Gerät wählen: ')
  try:
    selection_idx = int(selection)
    mic_id = devices[selection_idx][0]
    config = load_config()
    config['microphone_id'] = mic_id
    save_config(config)
    print(f'Mikrofon {mic_id} gespeichert.')
    return mic_id
  except (ValueError, IndexError):
    print('Ungültige Auswahl.')
    return None


def start_transcription(config):
  mic_id = config.get('microphone_id')
  if mic_id is None:
    print('Bitte zuerst ein Mikrofon auswählen.')
    return
  transcriber = LiveTranscriber(microphone_id=mic_id, model_name=config.get('whisper_model', 'base'))
  transcriber.start()
  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    transcriber.stop()
    return transcriber


def improve_from_file():
  try:
    with open('mitschrift_raw.txt', 'r', encoding='utf-8') as f:
      text = f.read()
  except FileNotFoundError:
    print('Keine Mitschrift gefunden.')
    return
  if not text.strip():
    print('Datei ist leer.')
    return
  improved = improve_notes(text)
  print('\n=== Verbesserte Mitschrift ===')
  print(improved)


def run_emergency(config):
  try:
    with open('mitschrift_raw.txt', 'r', encoding='utf-8') as f:
      blocks = [line.strip() for line in f.readlines() if line.strip()]
  except FileNotFoundError:
    print('Keine Mitschrift gefunden.')
    return
  last = '\n'.join(blocks[-5:])
  if not last:
    print('Es liegen keine Mitschnitt-Blöcke vor.')
    return
  short, detailed = emergency_help(last)
  print('\n--- Notfall (kurz) ---')
  print(short)
  print('\n--- Notfall (ausführlich) ---')
  print(detailed)


def change_license():
  server_url = input('Server-URL (z.B. http://localhost:4000): ').strip() or 'http://localhost:4000'
  key = input('Lizenzschlüssel: ').strip()
  if not key:
    print('Key darf nicht leer sein.')
    return
  try:
    result = check_license(key, server_url)
    print(f"Lizenz gültig bis {result.get('expires')} – verbleibend: {result.get('remainingRequests')}")
  except Exception as exc:
    print(f'Lizenzprüfung fehlgeschlagen: {exc}')


def main():
  while True:
    config = load_config()
    print('\n--- Transcriptor Desktop ---')
    print('[1] Live-Mitschrift starten')
    print('[2] Mitschrift verbessern')
    print('[3] Mikrofon wählen')
    print('[4] Lizenz ändern')
    print('[5] Notfall-Hilfe aus Mitschrift')
    print('[6] Beenden')
    choice = input('Auswahl: ')

    if choice == '1':
      start_transcription(config)
    elif choice == '2':
      improve_from_file()
    elif choice == '3':
      choose_microphone()
    elif choice == '4':
      change_license()
    elif choice == '5':
      run_emergency(config)
    elif choice == '6':
      print('Auf Wiedersehen! Nutze das Tool nur für eigene Mitschriften.')
      sys.exit(0)
    else:
      print('Ungültige Auswahl.')


if __name__ == '__main__':
  main()
