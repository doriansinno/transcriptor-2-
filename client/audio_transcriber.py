import queue
import threading
from pathlib import Path
import sounddevice as sd
import numpy as np
import whisper

RAW_PATH = Path(__file__).parent / 'mitschrift_raw.txt'


def list_microphones():
  devices = sd.query_devices()
  mics = []
  for idx, dev in enumerate(devices):
    if dev['max_input_channels'] > 0:
      mics.append((idx, dev['name']))
  return mics


class LiveTranscriber:
  def __init__(self, microphone_id=None, model_name='base'):
    self.microphone_id = microphone_id
    self.model_name = model_name
    self.buffer = queue.Queue()
    self.text_blocks = []
    self.running = False
    self.model = None

  def _audio_callback(self, indata, frames, _time, _status):
    if self.running:
      self.buffer.put(indata.copy())

  def _record(self):
    with sd.InputStream(samplerate=16000, channels=1, device=self.microphone_id, callback=self._audio_callback):
      while self.running:
        sd.sleep(500)

  def _transcribe_loop(self):
    self.model = whisper.load_model(self.model_name)
    audio_accumulator = []
    samples_per_block = 16000 * 5

    while self.running:
      try:
        chunk = self.buffer.get(timeout=1)
        audio_accumulator.append(chunk)
      except queue.Empty:
        continue

      flat = np.concatenate(audio_accumulator, axis=0)
      if flat.shape[0] >= samples_per_block:
        segment = flat[:samples_per_block]
        audio_accumulator = []
        result = self.model.transcribe(segment.flatten(), fp16=False, language='de')
        text = result.get('text', '').strip()
        if text:
          self.text_blocks.append(text)
          RAW_PATH.write_text('\n'.join(self.text_blocks), encoding='utf-8')
          print(f"[Mitschrift] {text}")

  def start(self):
    if self.running:
      return
    self.running = True
    RAW_PATH.write_text('', encoding='utf-8')
    record_thread = threading.Thread(target=self._record, daemon=True)
    transcribe_thread = threading.Thread(target=self._transcribe_loop, daemon=True)
    record_thread.start()
    transcribe_thread.start()
    print('Live-Mitschrift gestartet. Hinweis: Nur eigene Stimme transkribieren.')

  def stop(self):
    self.running = False
    print('Aufnahme beendet.')

  def last_blocks(self, count=4):
    return '\n'.join(self.text_blocks[-count:])
