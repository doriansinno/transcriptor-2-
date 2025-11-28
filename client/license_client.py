import json
import os
from pathlib import Path
import requests

CONFIG_PATH = Path(__file__).parent / 'config.json'


def load_config():
  if not CONFIG_PATH.exists():
    return {}
  with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    return json.load(f)


def save_config(config):
  with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2)


def check_license(key: str, server_url: str):
  response = requests.post(f"{server_url}/license/check", json={"key": key}, timeout=10)
  if response.status_code != 200:
    raise ValueError(response.json().get('message', 'Lizenz ungültig.'))
  data = response.json()
  config = load_config()
  config['license_key'] = key
  config['server_url'] = server_url
  save_config(config)
  return data


def ensure_license():
  config = load_config()
  key = config.get('license_key')
  server_url = config.get('server_url', 'http://localhost:4000')
  if not key:
    raise RuntimeError('Keine Lizenz hinterlegt. Bitte im Menü setzen.')
  return key, server_url
