import asyncio
import logging
from typing import List, Dict, Optional
from openai import AsyncOpenAI, APITimeoutError, APIConnectionError, RateLimitError
from config.settings import (
    GROQ_API_KEY, GROQ_MODEL, GROQ_BASE_URL,
    MAX_TOKENS_RESPONSE, MAX_RETRIES, RETRY_DELAY,
)

logger = logging.getLogger(__name__)


class GroqClient:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url=GROQ_BASE_URL,
        )
        self.model = GROQ_MODEL

    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = MAX_TOKENS_RESPONSE,
    ) -> Optional[str]:
        """ส่ง request ไปยัง Groq API พร้อม retry logic"""
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content

            except RateLimitError as e:
                logger.warning(f"Rate limit hit (attempt {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * attempt * 2)

            except (APITimeoutError, APIConnectionError) as e:
                logger.warning(f"API error (attempt {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * attempt)

            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                break

        return None

    async def health_check(self) -> bool:
        """ตรวจสอบว่า Groq API พร้อมใช้งาน"""
        try:
            result = await self.chat(
                system_prompt="You are a helpful assistant.",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return result is not None
        except Exception:
            return False


# Singleton
groq_client = GroqClient()
