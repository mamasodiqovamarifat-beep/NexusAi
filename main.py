import logging
import os
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters
from config import TELEGRAM_BOT_TOKEN
from handlers import (
    start, help_command, features_command, 
    button_callback, handle_message
)

# Logging sozlamasi
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def main():
    """Botni ishga tushirish"""
    
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("❌ TELEGRAM_BOT_TOKEN .env faylida topilmadi!")
    
    print("\n" + "="*60)
    print("🎵 MUSIQA BOT ISHGA TUSHMOQDA...")
    print("="*60)
    
    # Application yaratish
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Buyruq handlerları
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("features", features_command))
    
    # Callback handlerı
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Matnli xabar handleri
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Botni ishga tushirish
    print("\n✅ Bot tayyor!")
    print("🤖 @sonovexbot ishga tushdi!")
    print("="*60)
    print("Telegram'da @sonovexbot botini oching va /start yozing\n")
    
    try:
        application.run_polling(allowed_updates=['message', 'callback_query'])
    except KeyboardInterrupt:
        print("\n\n❌ Bot to'xtatildi")

if __name__ == '__main__':
    main()
