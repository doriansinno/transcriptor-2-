import requests
from license_client import ensure_license


def improve_notes(text: str):
  key, server_url = ensure_license()
  response = requests.post(f"{server_url}/api/improve-notes", json={"key": key, "text": text}, timeout=20)
  if response.status_code != 200:
    raise ValueError(response.json().get('message', 'Verbesserung fehlgeschlagen.'))
  return response.json().get('improved', '')


def emergency_help(text: str):
  key, server_url = ensure_license()
  response = requests.post(f"{server_url}/api/emergency-help", json={"key": key, "text": text}, timeout=20)
  if response.status_code != 200:
    raise ValueError(response.json().get('message', 'Notfallhilfe fehlgeschlagen.'))
  data = response.json()
  return data.get('short_answer', ''), data.get('detailed_explanation', '')
