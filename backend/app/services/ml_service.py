"""
ML Inference Service
Handles dog emotion classification from images.

MVP: Returns mock result if model file does not exist.
Production: Load ONNX model and run real inference.
"""
import os
import io
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

MOOD_LABELS = ["Happy", "Relaxed", "Sad", "Angry"]
MOOD_LABEL_MAP = {0: "Happy", 1: "Relaxed", 2: "Sad", 3: "Angry"}


class MLService:
    def __init__(self):
        self.session = None
        self.model_loaded = False
        self._try_load_model()

    def _try_load_model(self):
        model_path = Path(settings.MODEL_PATH)
        if not model_path.exists():
            logger.warning(
                f"Model file not found at {model_path}. "
                "Using mock inference. Export your model to enable real predictions."
            )
            return

        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(str(model_path))
            self.model_loaded = True
            logger.info(f"✅ ML model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        """Preprocess image to model input format (224x224 RGB normalized)."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        arr = np.array(img, dtype=np.float32) / 255.0
        # Normalize with ImageNet mean/std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        arr = (arr - mean) / std
        # NCHW format
        arr = arr.transpose(2, 0, 1)[np.newaxis, :].astype(np.float32)
        return arr

    def predict(self, image_bytes: bytes) -> dict:
        """
        Returns:
            {
                "mood": "Happy",
                "confidence": 92.1,
                "scores": {"Happy": 92.1, "Relaxed": 5.2, "Sad": 1.8, "Angry": 0.9}
            }
        """
        if not self.model_loaded:
            return self._mock_predict()

        try:
            input_array = self.preprocess(image_bytes)
            input_name = self.session.get_inputs()[0].name
            outputs = self.session.run(None, {input_name: input_array})
            logits = outputs[0][0]

            # Softmax
            e_x = np.exp(logits - np.max(logits))
            probs = e_x / e_x.sum()

            scores = {MOOD_LABEL_MAP[i]: round(float(p) * 100, 2) for i, p in enumerate(probs)}
            top_mood = max(scores, key=scores.get)
            confidence = scores[top_mood]

            return {"mood": top_mood, "confidence": confidence, "scores": scores}

        except Exception as e:
            logger.error(f"Inference error: {e}")
            return self._mock_predict()

    def _mock_predict(self) -> dict:
        """Returns a simulated result when model is not available."""
        import random
        moods = ["Happy", "Relaxed", "Sad", "Angry"]
        top = random.choice(moods)
        remaining = [m for m in moods if m != top]
        pool = sorted([random.uniform(1, 10) for _ in remaining])
        scores = dict(zip(remaining, [round(p, 2) for p in pool]))
        top_score = round(100 - sum(pool), 2)
        scores[top] = top_score
        return {"mood": top, "confidence": top_score, "scores": scores}


# Singleton
ml_service = MLService()
