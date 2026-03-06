import os
from dotenv import load_dotenv

load_dotenv()

# Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Token limits
MAX_TOKENS_RESPONSE = 1024
MAX_CONTEXT_TOKENS = 6000
MAX_HISTORY_TURNS = 10

# Retry
MAX_RETRIES = 3
RETRY_DELAY = 1.5  # seconds

# Cache
CACHE_TTL = 300  # seconds (5 minutes)

# Confidence threshold
CONFIDENCE_THRESHOLD = 0.60

# Default language
DEFAULT_LANGUAGE = "th"
