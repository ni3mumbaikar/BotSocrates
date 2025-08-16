from gtts import gTTS
import sys
import os

if __name__ == "__main__":
    text = sys.argv[1]
    output_file = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else 'en' # Default to English

    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_file)
        print(f"Audio saved to {output_file}")
    except Exception as e:
        print(f"Error generating TTS: {e}", file=sys.stderr)
        sys.exit(1)
