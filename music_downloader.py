import os
import yt_dlp
import requests
from config import DOWNLOAD_FOLDER, CACHE_FOLDER

class MusicDownloader:
    def __init__(self):
        self.download_folder = DOWNLOAD_FOLDER
        self.cache_folder = CACHE_FOLDER
    
    def download_from_youtube(self, url, song_name="song"):
        """YouTube'dan musiqa yuklab olish"""
        try:
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': os.path.join(self.download_folder, f'{song_name}'),
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return os.path.join(self.download_folder, f'{song_name}.mp3')
        except Exception as e:
            print(f"YouTube yuklab olishda xato: {e}")
            return None
    
    def search_youtube_track(self, track_name, artist_name):
        """YouTube'da musiqa qidiruv"""
        try:
            query = f"{track_name} {artist_name} official audio"
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'default_search': 'ytsearch',
                'extract_flat': True,
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                results = ydl.extract_info(f'ytsearch1:{query}', download=False)
                if results and 'entries' in results and len(results['entries']) > 0:
                    return results['entries'][0]
            return None
        except Exception as e:
            print(f"YouTube qidiruvda xato: {e}")
            return None
    
    def get_file_size(self, file_path):
        """Fayl hajmini olish (MB'da)"""
        if os.path.exists(file_path):
            return os.path.getsize(file_path) / (1024 * 1024)
        return 0
    
    def download_and_save_track(self, track_name, artist_name, spotify_url=None):
        """Spotify musiqasini YouTube'dan yuklab olish"""
        try:
            # YouTube'da qidiruv
            yt_result = self.search_youtube_track(track_name, artist_name)
            
            if yt_result:
                yt_url = f"https://www.youtube.com/watch?v={yt_result['id']}"
                safe_name = f"{artist_name} - {track_name}".replace('/', '_').replace('\\', '_')
                file_path = self.download_from_youtube(yt_url, safe_name)
                return file_path
            
            return None
        except Exception as e:
            print(f"Musiqa yuklashda xato: {e}")
            return None
