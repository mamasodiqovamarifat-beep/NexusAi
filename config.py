import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID', '')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET', '')

# Bot Settings
MAX_SEARCH_RESULTS = 5
DOWNLOAD_FOLDER = 'downloads'
CACHE_FOLDER = 'cache'

# Supported Audio Formats
SUPPORTED_FORMATS = ['mp3', 'wav', 'm4a', 'flac']

# File Paths
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)
if not os.path.exists(CACHE_FOLDER):
    os.makedirs(CACHE_FOLDER)
