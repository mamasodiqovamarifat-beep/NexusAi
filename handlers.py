from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from music_downloader import MusicDownloader
from spotify_api import SpotifyAPI
import os

downloader = MusicDownloader()
spotify = SpotifyAPI()

# State constants
WAITING_FOR_SEARCH = 1

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Bot boshlanish"""
    keyboard = [
        [InlineKeyboardButton("🎤 Ijrochining Musiqalari", callback_data='search_artist')],
        [InlineKeyboardButton("🎵 Musiqa Qidiruv", callback_data='search_track')],
        [InlineKeyboardButton("📋 Yo'riqnomalar", callback_data='help')],
        [InlineKeyboardButton("✨ Xususiyatlar", callback_data='features')],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🎵 *Musiqa Bot'ga xush kelibsiz!*\n\n"
        "*Qo'llanish:*\n"
        "1️⃣ Ijrochining nomini yozing → Uning Top 10 musiqasini ko'ring\n"
        "2️⃣ Musiqaning nomini yozing → To'g'ridan-to'g'ri yuklab olib olish\n\n"
        "Masallar:\n"
        "• *The Weeknd* → The Weeknd'ning musiqalari\n"
        "• *Blinding Lights The Weeknd* → Aniq musiqa\n\n"
        "Yoki tugmalardan birini bosing:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Yordam ko'rsatish"""
    help_text = """
🎵 *Musiqa Bot Yo'riqnomalari*

*Qo'llanish usullari:*

1️⃣ *Ijrochining nomini yozing*
   Masalan: "The Weeknd"
   → Bot ijrochining Top 10 musiqasini ko'rsatadi
   → Keyin musiqani tanlang
   → Musiqa yuklab olinadi va jo'natiladi

2️⃣ *Musiqa nomini (+ ijrochini) yozing*
   Masalan: "Blinding Lights The Weeknd"
   → Bot to'g'ridan-to'g'ri musiqani qidiradi
   → Natijalarda tanlang
   → YouTube'dan yuklab olib jo'natadi

*Qo'shimcha:*
/start - Botni boshtan ishga tushirish
/help - Bu yo'riqnomalarni ko'rish
/features - Barcha imkoniyatlarni ko'rish

Savolingiz bo'lsa, xabar yuboring.
"""
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def features_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Barcha imkoniyatlar"""
    features_text = """
✨ *Musiqa Bot Imkoniyatlari*

🎤 *Ijrochi Qidiruvi (Spotify)*
• Ijrochining Top 10 musiqasini ko'rish
• Ijrochi haqida ma'lumot
• Tez qidiruv natijalari

🎵 *Musiqa Qidiruvi (Spotify + YouTube)*
• Musiqa nomi bo'yicha qidiruv
• Ijrochi filtri bilan qidiruv
• Aniq musiqa topish

💾 *Avtomatik Yuklab Olish (YouTube)*
• YouTube'dan HIGH QUALITY (320 kbps) MP3
• Avtomatik format konvertlash
• Meta ma'lumotlarni o'rnatish

📊 *Audio Sifati*
• Bitreit: 320 kbps (eng yaxshi)
• Format: MP3
• Stereo audio

⚡ *Tez Ishlash*
• Tezkor qidiruv
• Darhol yuklab olish
• Katta musiqa libraryasi (10 million+ sarq)

🔄 *Qulaylik*
• Inline tugmalar
• Oson navigatsiya
• Foydalanuvchi-friendly interfeys
"""
    await update.message.reply_text(features_text, parse_mode='Markdown')

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Tugma bosilganida"""
    query = update.callback_query
    await query.answer()
    
    if query.data == 'search_artist':
        await query.edit_message_text(
            "🎤 *Ijrochining nomini yozing*\n\n"
            "Masalan: The Weeknd, Drake, Billie Eilish, Bad Bunny",
            parse_mode='Markdown'
        )
        return WAITING_FOR_SEARCH
    
    elif query.data == 'search_track':
        await query.edit_message_text(
            "🎵 *Musiqa nomini yozing*\n\n"
            "Masalan:\n"
            "• Blinding Lights\n"
            "• Shape of You\n"
            "• Blinding Lights The Weeknd",
            parse_mode='Markdown'
        )
        return WAITING_FOR_SEARCH
    
    elif query.data == 'help':
        await query.edit_message_text(
            "🎵 *Yo'riqnomalar*\n\n"
            "*Qo'llanish:*\n"
            "1️⃣ Ijrochining nomini yozing\n"
            "2️⃣ Musiqaning nomini yozing\n\n"
            "/start - Boshtan\n"
            "/help - Yo'riqnomalar\n"
            "/features - Imkoniyatlar",
            parse_mode='Markdown'
        )
    
    elif query.data == 'features':
        await query.edit_message_text("✨ Imkoniyatlar yuqorida ko'rsatilgan!")
    
    elif query.data.startswith('artist_'):
        artist_id = query.data.split('_')[1]
        await show_artist_tracks(query, artist_id)
    
    elif query.data.startswith('download_'):
        data = query.data.split('_', 1)[1]
        parts = data.split('|')
        track_name = parts[0]
        artist_name = parts[1] if len(parts) > 1 else "Unknown"
        await download_track(query, track_name, artist_name)

async def show_artist_tracks(query, artist_id):
    """Ijrochining musiqalarini ko'rsatish"""
    await query.edit_message_text("⏳ Musiqalar yuklab olinmoqda...")
    
    tracks = spotify.get_artist_tracks(artist_id)
    
    if not tracks:
        await query.edit_message_text("❌ Musiqalarni olishda xato yuz berdi.")
        return
    
    keyboard = []
    for idx, track in enumerate(tracks[:10], 1):
        title = track['name'][:30]
        callback = f"download_{track['name']}|{track['artists'][0]['name']}"
        keyboard.append([InlineKeyboardButton(
            f"{idx}. {title}", 
            callback_data=callback
        )])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    artist_name = tracks[0]['artists'][0]['name'] if tracks else "Unknown"
    
    await query.edit_message_text(
        f"🎤 *{artist_name}* - Top 10 musiqalar:\n\n"
        "Yuklab olish uchun musiqani tanlang:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def download_track(query, track_name, artist_name):
    """Musiqa yuklab olish"""
    try:
        await query.edit_message_text(
            f"⏳ *{track_name}*\n"
            f"Ijrochi: {artist_name}\n\n"
            "YouTube'dan qidirilmoqda...",
            parse_mode='Markdown'
        )
        
        file_path = downloader.download_and_save_track(track_name, artist_name)
        
        if file_path and os.path.exists(file_path):
            file_size = downloader.get_file_size(file_path)
            
            await query.edit_message_text(
                f"📤 *{track_name}*\n"
                f"Ijrochi: {artist_name}\n\n"
                "Telegram'ga jo'natilmoqda...",
                parse_mode='Markdown'
            )
            
            with open(file_path, 'rb') as audio:
                await query.message.reply_audio(
                    audio=audio,
                    caption=f"✅ *{artist_name} - {track_name}*\n📊 Hajmi: {file_size:.2f} MB\n🎵 Sifat: 320 kbps MP3",
                    parse_mode='Markdown',
                    title=track_name,
                    performer=artist_name
                )
            
            await query.edit_message_text("✅ Musiqa yuklandi!")
            
            # Fayl o'chirish
            try:
                os.remove(file_path)
            except:
                pass
        else:
            await query.edit_message_text(
                f"❌ *{track_name}* yuklab olishda xato\n\n"
                "Ijrochi yoki musiqa nomi xato bo'lishi mumkin.\n"
                "Boshqa qidiruv qilib ko'ring.",
                parse_mode='Markdown'
            )
    except Exception as e:
        await query.edit_message_text(f"❌ Xato yuz berdi: {str(e)}")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Matnli xabar qayta ishlash"""
    text = update.message.text.strip()
    
    if not text:
        return
    
    # Ijrochi va musiqa nomini ajratib olish
    words = text.split()
    
    # Agar faqat bir so'z bo'lsa - ijrochi qidiruvi
    if len(words) == 1:
        await update.message.reply_text(f"🔍 '{text}' ijrochisini qidirilmoqda...")
        
        artists = spotify.search_artist(text)
        
        if artists:
            keyboard = []
            for artist in artists:
                name = artist['name'][:35]
                callback = f"artist_{artist['id']}"
                keyboard.append([InlineKeyboardButton(
                    f"🎤 {name}", 
                    callback_data=callback
                )])
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text(
                "🎤 *Topilgan ijrochilari:*\n\n"
                "Musiqalarini ko'rish uchun ijrochini tanlang:",
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(f"❌ '{text}' ijrochisi topilmadi.")
    
    else:
        # Musiqa qidiruvi
        parts = text.rsplit(' ', 1)
        track_name = parts[0]
        artist_name = parts[1] if len(parts) > 1 else ""
        
        await update.message.reply_text(
            f"🎵 Qidirilmoqda:\n"
            f"Musiqa: *{track_name}*\n"
            f"Ijrochi: *{artist_name if artist_name else 'Barchasi'}*",
            parse_mode='Markdown'
        )
        
        tracks = spotify.search_track(track_name, artist_name if artist_name else None)
        
        if tracks:
            keyboard = []
            for idx, track in enumerate(tracks[:5], 1):
                artist = track['artists'][0]['name'][:20]
                title = f"{track['name'][:20]} - {artist}"
                callback = f"download_{track['name']}|{track['artists'][0]['name']}"
                keyboard.append([InlineKeyboardButton(
                    f"{idx}. {title}", 
                    callback_data=callback
                )])
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text(
                "🎵 *Qidiruv natijalari:*\n\n"
                "Yuklab olish uchun musiqani tanlang:",
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                f"❌ Natija topilmadi\n\n"
                f"Musiqa: {track_name}\n"
                f"Ijrochi: {artist_name if artist_name else 'Barchasi'}\n\n"
                "Boshqa nomi bilan qidirib ko'ring yoki /help yozing."
            )
