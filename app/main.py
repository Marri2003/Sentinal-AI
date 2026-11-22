"""
SentinelAI Backend - FastAPI Application
Multi-modal Phishing Detection System
"""
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import traceback

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import (
    API_TITLE,
    API_VERSION,
    API_DESCRIPTION,
    CORS_ORIGINS,
    TEXT_MODEL_PATH,
    IMAGE_MODEL_PATH,
    METADATA_MODEL_PATH,
    TEXT_TOKENIZER_PATH,
    LOG_LEVEL,
    LOG_FORMAT,
    LLM_CONFIG,
    JUSTIFY_SYSTEM_PROMPT,
    GROQ_API_KEY,
    GROQ_API_URL,
    GROQ_MODEL
)

from app.models import (
    PredictionRequest,
    PredictionResponse,
    HealthResponse,
    ErrorResponse,
    PipelineScores,
    Explainability,
    FusionWeightsUsed,
    ContributingWord,
    ContributingFeature,
    JustifyRequest,
    JustifyResponse,
    ChatRequest,
    ChatResponse
)

from models.text_pipeline import TextPipeline
from models.image_pipeline import ImagePipeline
from models.metadata_pipeline import MetadataPipeline
from fusion.decision_fusion import DecisionFusion

# Configure logging
logger.remove()
logger.add(sys.stderr, format=LOG_FORMAT, level=LOG_LEVEL)

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Global pipeline instances
text_pipeline: Optional[TextPipeline] = None
image_pipeline: Optional[ImagePipeline] = None
metadata_pipeline: Optional[MetadataPipeline] = None
fusion_module: Optional[DecisionFusion] = None


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global text_pipeline, image_pipeline, metadata_pipeline, fusion_module
    
    logger.info("🚀 Starting SentinelAI Backend...")
    
    try:
        # Initialize text pipeline
        logger.info("Loading text model...")
        text_pipeline = TextPipeline(
            model_path=TEXT_MODEL_PATH if TEXT_MODEL_PATH.exists() else None,
            tokenizer_path=TEXT_TOKENIZER_PATH if TEXT_TOKENIZER_PATH.exists() else None
        )
        logger.success("✓ Text model loaded")
        
        # Initialize image pipeline (OCR-based, no model needed)
        logger.info("Loading image pipeline...")
        image_pipeline = ImagePipeline(text_pipeline=text_pipeline)
        logger.success("✓ Image pipeline loaded")
        
        # Initialize metadata pipeline
        logger.info("Loading metadata model...")
        metadata_pipeline = MetadataPipeline(
            model_path=METADATA_MODEL_PATH if METADATA_MODEL_PATH.exists() else None
        )
        logger.success("✓ Metadata model loaded")
        
        # Initialize fusion module
        fusion_module = DecisionFusion()
        logger.success("✓ Fusion module initialized")
        
        logger.success("🎉 All models loaded successfully!")
        logger.info(f"📊 Fusion weights: {fusion_module.get_config()}")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        logger.error(traceback.format_exc())
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down SentinelAI Backend...")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "SentinelAI Phishing Detection API",
        "version": API_VERSION,
        "status": "running",
        "endpoints": {
            "predict": "/predict",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        models_loaded={
            "text_model": text_pipeline is not None,
            "image_model": image_pipeline is not None,
            "metadata_model": metadata_pipeline is not None,
            "fusion_module": fusion_module is not None
        },
        timestamp=datetime.now().isoformat()
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        200: {"model": PredictionResponse},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    tags=["Prediction"]
)
async def predict(request: PredictionRequest):
    """
    Multi-modal phishing detection endpoint.

    Analyzes SMS text, image (OCR), and metadata to detect phishing attempts.
    Returns final score, decision, confidence level, and explainability info.

    Missing modalities are excluded from fusion (not defaulted to 0.5).
    Weights are dynamically redistributed among available modalities.
    """
    try:
        logger.info("📨 New prediction request received")

        # Validate that at least one modality is provided
        if not any([request.text, request.image, request.metadata]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of text, image, or metadata must be provided"
            )

        # Initialize scores as None (will remain None if modality not provided)
        text_score: Optional[float] = None
        metadata_score: Optional[float] = None
        image_score: Optional[float] = None
        url_text_score: Optional[float] = None

        # Initialize explainability components
        contributing_words: List[ContributingWord] = []
        contributing_features: List[ContributingFeature] = []
        ocr_extracted_text: Optional[str] = None

        # ==================== PIPELINE 1: TEXT ANALYSIS ====================
        if request.text and text_pipeline:
            logger.info("🔤 PIPELINE 1: Analyzing text...")
            try:
                text_result = text_pipeline.predict_with_explanation(request.text)
                text_score = text_result.score

                # Extract contributing words with scores
                contributing_words = [
                    ContributingWord(word=tc.word, score=tc.score)
                    for tc in text_result.contributing_words
                ]

                logger.info(f"Text score: {text_score:.4f}")
                if contributing_words:
                    logger.info(f"Top tokens: {[w.word for w in contributing_words[:3]]}")
            except Exception as e:
                logger.warning(f"Text analysis error: {e}")

        # ==================== PIPELINE 2: IMAGE ANALYSIS (OCR) ====================
        if request.image and image_pipeline:
            logger.info("🖼️  PIPELINE 2: Analyzing image (OCR)...")
            try:
                image_result = image_pipeline.analyze(request.image)
                image_score = image_result.score  # None if OCR failed or text too short
                ocr_extracted_text = image_result.ocr_text

                if image_score is not None:
                    logger.info(f"Image score: {image_score:.4f}")
                else:
                    logger.info(f"Image: {image_result.explanation}")
                if ocr_extracted_text:
                    logger.info(f"OCR text: {ocr_extracted_text[:50]}...")
            except Exception as e:
                logger.warning(f"Image processing failed: {e}")

        # ==================== PIPELINE 3: METADATA ANALYSIS ====================
        if request.metadata and metadata_pipeline:
            logger.info("📊 PIPELINE 3: Analyzing metadata...")
            try:
                metadata_result = metadata_pipeline.predict_with_explanation(
                    url=request.metadata.url,
                    sender=request.metadata.sender,
                    timestamp=request.metadata.timestamp
                )

                # metadata_result will be None if no URL provided
                if metadata_result is not None:
                    metadata_score = metadata_result.score
                    url_text_score = metadata_result.url_text_score

                    # Extract contributing features with scores
                    contributing_features = [
                        ContributingFeature(feature=fc.feature, score=fc.score)
                        for fc in metadata_result.contributing_features
                    ]

                    logger.info(f"Metadata score: {metadata_score:.4f}")
                    if url_text_score is not None:
                        logger.info(f"URL text risk score: {url_text_score:.4f}")
                    if contributing_features:
                        logger.info(f"Top features: {[f.feature for f in contributing_features[:3]]}")
                else:
                    logger.info("Metadata: No URL provided, skipping metadata analysis")
            except Exception as e:
                logger.warning(f"Metadata analysis error: {e}")

        # ==================== DECISION FUSION ====================
        logger.info("🔀 Performing decision fusion...")

        # Ensure at least one modality produced a scorable signal
        if text_score is None and metadata_score is None and image_score is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to extract scorable text, OCR content, or URL metadata. Please provide valid text or a legible screenshot."
            )

        # Extract url and sender for trust checking (optional parameters)
        url = request.metadata.url if request.metadata else None
        sender = request.metadata.sender if request.metadata else None

        # Fusion with None for missing modalities (dynamic weight redistribution)
        fusion_result = fusion_module.fuse(
            text_score=text_score,
            metadata_score=metadata_score,
            image_score=image_score,
            url_text_score=url_text_score,
            url=url,
            sender=sender
        )

        # Extract fusion weights (0.0 for modalities not used)
        weights_used = {
            "text": fusion_result.weights_applied.get("text", 0.0),
            "metadata": fusion_result.weights_applied.get("metadata", 0.0),
            "image": fusion_result.weights_applied.get("image", 0.0)
        }

        logger.success(f"✅ Decision: {fusion_result.label} (score: {fusion_result.score:.4f}, confidence: {fusion_result.confidence.value})")
        logger.info(f"Modalities used: {fusion_result.modalities_used}")
        logger.info(f"Weights applied: {weights_used}")

        # Build response
        response = PredictionResponse(
            final_score=fusion_result.score,
            decision=fusion_result.label,
            confidence=fusion_result.confidence.value,
            pipeline_scores=PipelineScores(
                text=text_score,
                metadata=metadata_score,
                image=image_score
            ),
            explainability=Explainability(
                contributing_words=contributing_words,
                contributing_features=contributing_features,
                ocr_text=ocr_extracted_text
            ),
            fusion_weights_used=FusionWeightsUsed(
                text=weights_used["text"],
                metadata=weights_used["metadata"],
                image=weights_used["image"]
            )
        )

        return response

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"⚠️ Validation/Modality error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


def build_justify_user_prompt(request: JustifyRequest) -> str:
    """
    Build user prompt from prediction JSON for LLM justification.

    Extracts key information: final_score, decision, contributing_words,
    contributing_features, and ocr_extracted_text.
    """
    parts = []

    # Original message context (if provided)
    if request.original_message:
        parts.append(f"Original SMS message: \"{request.original_message}\"")

    # Decision summary
    parts.append(f"Detection Result: {request.decision} (confidence: {request.confidence})")
    parts.append(f"Risk Score: {request.final_score:.2f} out of 1.0")

    # Contributing words from text analysis
    if request.explainability.contributing_words:
        words = [f"'{w.word}' (importance: {w.score:.2f})"
                 for w in request.explainability.contributing_words[:5]]
        parts.append(f"Suspicious words detected: {', '.join(words)}")

    # Contributing features from metadata analysis
    if request.explainability.contributing_features:
        features = [f"{f.feature} (importance: {f.score:.2f})"
                    for f in request.explainability.contributing_features[:5]]
        parts.append(f"Suspicious metadata patterns: {', '.join(features)}")

    # OCR extracted text from image
    if request.explainability.ocr_text:
        ocr_text = request.explainability.ocr_text
        if len(ocr_text) > 200:
            ocr_text = ocr_text[:200] + "..."
        parts.append(f"Text extracted from image: \"{ocr_text}\"")

    # Pipeline scores context
    scores_info = []
    if request.pipeline_scores.text is not None:
        scores_info.append(f"text={request.pipeline_scores.text:.2f}")
    if request.pipeline_scores.metadata is not None:
        scores_info.append(f"metadata={request.pipeline_scores.metadata:.2f}")
    if request.pipeline_scores.image is not None:
        scores_info.append(f"image={request.pipeline_scores.image:.2f}")
    if scores_info:
        parts.append(f"Individual pipeline scores: {', '.join(scores_info)}")

    return "\n".join(parts)


def get_justify_system_prompt(language: str) -> str:
    """
    Get language-specific system prompt for justification.

    Args:
        language: Target language (english, hindi, telugu, urdu, tamil)

    Returns:
        System prompt in the appropriate language
    """
    language_instructions = {
        "english": """You are a cybersecurity assistant. Based on the phishing detection analysis provided, give a clear 2-3 sentence explanation to a non-technical user about why this message was flagged or cleared. Mention specific words or URL patterns that were suspicious. Be factual, not alarmist. Respond in plain English only.""",

        "hindi": """आप एक साइबर सुरक्षा सहायक हैं। दिए गए फिशिंग डिटेक्शन एनालिसिस के आधार पर, एक सामान्य उपयोगकर्ता को 2-3 वाक्यों में स्पष्ट रूप से बताएं कि यह संदेश खतरनाक क्यों है या सुरक्षित क्यों है। संदिग्ध शब्दों या URL पैटर्न का उल्लेख करें। तथ्यात्मक रहें, भयभीत न करें। केवल हिंदी में जवाब दें।""",

        "telugu": """మీరు సైబర్ సెక్యూరిటీ అసిస్టెంట్. ఇచ్చిన ఫిషింగ్ డిటెక్షన్ విశ్లేషణ ఆధారంగా, సాధారణ వినియోగదారుకు 2-3 వాక్యాలలో ఈ సందేశం ఎందుకు ప్రమాదకరమో లేదా సురక్షితమో స్పష్టంగా వివరించండి. అనుమానాస్పద పదాలు లేదా URL నమూనాలను పేర్కొనండి. వాస్తవాలు చెప్పండి, భయపెట్టవద్దు. తెలుగులో మాత్రమే సమాధానం ఇవ్వండి.""",

        "marathi": """तुम्ही एक सायबर सिक्युरिटी सहाय्यक आहात। दिलेल्या फिशिंग डिटेक्शन विश्लेषणाच्या आधारावर, सामान्य वापरकर्त्यांना 2-3 वाक्यांमध्ये या संदेशाला धोकादायक का किंवा सुरक्षित का ठरवले याचे स्पष्ट स्पष्टीकरण द्या। संदिग्ध शब्द किंवा URL पैटर्नचा उल्लेख करा. वस्तुस्थितिवादी रहा, भीती निर्माण करू नका. केवळ मराठीत उत्तर द्या.""",

        "urdu": """آپ ایک سائبر سیکیورٹی اسسٹنٹ ہیں۔ دیے گئے فشنگ ڈیٹیکشن تجزیے کی بنیاد پر، ایک عام صارف کو 2-3 جملوں میں واضح طور پر بتائیں کہ یہ پیغام کیوں خطرناک ہے یا محفوظ ہے۔ مشکوک الفاظ یا URL پیٹرن کا ذکر کریں۔ حقائق بیان کریں، خوفزدہ نہ کریں۔ صرف اردو میں جواب دیں۔""",

        "tamil": """நீங்கள் சைபர் பாதுகாப்பு உதவியாளர். வழங்கப்பட்ட ஃபிஷிங் கண்டறிதல் பகுப்பாய்வின் அடிப்படையில், சாதாரண பயனருக்கு 2-3 வாக்கியங்களில் இந்த செய்தி ஏன் ஆபத்தானது அல்லது பாதுகாப்பானது என்பதை தெளிவாக விளக்கவும். சந்தேகத்திற்குரிய வார்த்தைகள் அல்லது URL வடிவங்களைக் குறிப்பிடவும். உண்மைகளை மட்டும் கூறுங்கள், பயமுறுத்த வேண்டாம். தமிழில் மட்டுமே பதிலளிக்கவும்."""
    }

    base_instruction = language_instructions.get(language, language_instructions["english"])

    return f"""{base_instruction}

IMPORTANT: Only mention URLs, words, or features that are explicitly listed in the analysis data. Never invent or assume URLs, keywords, or sender names that are not provided. If contributing_words is empty, say the text analysis flagged suspicious patterns without mentioning specific words."""


async def call_groq_api(system_prompt: str, user_prompt: str) -> str:
    """
    Call Groq API for justification generation.

    Uses Llama 3 8B model via Groq's OpenAI-compatible endpoint.
    Includes fallback logic if API call fails.
    """
    import httpx

    api_key = LLM_CONFIG["groq_api_key"]
    api_url = LLM_CONFIG["groq_api_url"]
    model = LLM_CONFIG["groq_model"]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": LLM_CONFIG["max_tokens"],
                    "temperature": LLM_CONFIG["temperature"]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.warning(f"Groq API call failed: {e}")
        # Return None to trigger fallback in generate_justification
        return None


def get_fallback_justification(decision: str, score: float, language: str = "english") -> str:
    """
    Generate a fallback justification when LLM API fails.

    Args:
        decision: "SPAM" or "HAM"
        score: The final risk score
        language: Target language for the response

    Returns:
        A hardcoded but contextual justification string in the specified language
    """
    fallbacks = {
        "english": {
            "spam_high": "This message was flagged as highly suspicious. It contains multiple indicators commonly associated with phishing attempts, such as urgent language, suspicious links, or unusual sender patterns. We recommend not clicking any links and deleting this message.",
            "spam_medium": "This message shows several warning signs of a potential phishing attempt. The combination of suspicious keywords and metadata patterns triggered our detection system. Exercise caution before taking any action.",
            "spam_low": "This message has been flagged as potentially suspicious. While the risk is moderate, we recommend verifying the sender through official channels before responding or clicking any links.",
            "ham_low": "This message appears to be legitimate. Our analysis found no significant indicators of phishing or spam. The sender and content patterns match expected communication norms.",
            "ham_high": "This message appears to be safe, though it contains some patterns that occasionally appear in spam. The overall risk is low, but always verify unexpected requests through official channels."
        },
        "hindi": {
            "spam_high": "यह संदेश अत्यधिक संदिग्ध है। इसमें फ़िशिंग के कई संकेत हैं जैसे तत्काल भाषा, संदिग्ध लिंक, या असामान्य प्रेषक। किसी भी लिंक पर क्लिक न करें और इस संदेश को हटा दें।",
            "spam_medium": "इस संदेश में फ़िशिंग के कुछ चेतावनी संकेत हैं। संदिग्ध शब्दों और मेटाडेटा पैटर्न ने हमारी प्रणाली को सतर्क किया। कोई भी कार्रवाई करने से पहले सावधान रहें।",
            "spam_low": "यह संदेश संभावित रूप से संदिग्ध है। जोखिम मध्यम है, लेकिन किसी भी लिंक पर क्लिक करने या जवाब देने से पहले प्रेषक की पुष्टि आधिकारिक चैनलों से करें।",
            "ham_low": "यह संदेश वैध प्रतीत होता है। हमारे विश्लेषण में फ़िशिंग या स्पैम के कोई महत्वपूर्ण संकेत नहीं मिले। प्रेषक और सामग्री सामान्य संचार मानकों से मेल खाते हैं।",
            "ham_high": "यह संदेश सुरक्षित प्रतीत होता है, हालांकि इसमें कुछ पैटर्न हैं जो कभी-कभी स्पैम में दिखाई देते हैं। समग्र जोखिम कम है, लेकिन हमेशा अप्रत्याशित अनुरोधों की पुष्टि करें।"
        },
        "telugu": {
            "spam_high": "ఈ సందేశం అత్యంత అనుమానాస్పదమైనది. ఇందులో ఫిషింగ్‌కు సంబంధించిన అనేక సంకేతాలు ఉన్నాయి. ఏ లింక్‌లపై క్లిక్ చేయవద్దు మరియు ఈ సందేశాన్ని తొలగించండి.",
            "spam_medium": "ఈ సందేశంలో ఫిషింగ్ హెచ్చరిక సంకేతాలు ఉన్నాయి. ఏదైనా చర్య తీసుకునే ముందు జాగ్రత్తగా ఉండండి.",
            "spam_low": "ఈ సందేశం సంభావ్యంగా అనుమానాస్పదమైనది. ప్రమాదం మధ్యస్తంగా ఉంది, కానీ అధికారిక చానెల్‌ల ద్వారా పంపినవారిని ధృవీకరించండి.",
            "ham_low": "ఈ సందేశం చట్టబద్ధంగా కనిపిస్తుంది. మా విశ్లేషణలో ఫిషింగ్ లేదా స్పామ్ యొక్క ముఖ్యమైన సంకేతాలు కనుగొనబడలేదు.",
            "ham_high": "ఈ సందేశం సురక్షితంగా కనిపిస్తుంది. మొత్తం ప్రమాదం తక్కువగా ఉంది, కానీ ఊహించని అభ్యర్థనలను ధృవీకరించండి."
        },
        "marathi": {
            "spam_high": "हा संदेश अत्यंत संशयास्पद आहे. यामध्ये फिशिंगच्या अनेक चिह्ने आहेत जसे की तातडीची भाषा, संशयास्पद लिंक्स, किंवा असामान्य पाठवणारे. कृपया कोणत्याही लिंकवर क्लिक करू नका आणि हा संदेश हटवा.",
            "spam_medium": "या संदेशात फिशिंगच्या काही चेतावणी चिन्हे आहेत. संशयास्पद शब्द आणि मेटाडेटा पॅटर्न यांनी आमच्या प्रणालीला सतर्क केले आहे. कोणतीही कारवाई करण्यापूर्वी सावधगिरी बाळगा.",
            "spam_low": "हा संदेश संभाव्यत: संशयास्पद आहे. जोखीम मध्यम आहे, परंतु कोणत्याही लिंकवर क्लिक करण्यापूर्वी किंवा उत्तर देण्यापूर्वी अधिकृत चॅनेलद्वारे पाठवणाऱ्याची पडताळणी करा.",
            "ham_low": "हा संदेश वैध वाटतो. आमच्या विश्लेषणात फिशिंग किंवा स्पॅमची कोणतीही महत्त्वपूर्ण चिन्हे आढळली नाहीत. पाठवणारा आणि सामग्री अपेक्षित संवाद मानकांशी जुळतात.",
            "ham_high": "हा संदेश सुरक्षित वाटतो. एकूण जोखीम कमी आहे, परंतु नेहमी अनपेक्षित विनंत्यांची पडताळणी करा."
        },
        "urdu": {
            "spam_high": "یہ پیغام انتہائی مشکوک ہے۔ اس میں فشنگ کی کئی علامات ہیں۔ کسی بھی لنک پر کلک نہ کریں اور اس پیغام کو حذف کر دیں۔",
            "spam_medium": "اس پیغام میں فشنگ کی کچھ انتباہی علامات ہیں۔ کوئی بھی کارروائی کرنے سے پہلے محتاط رہیں۔",
            "spam_low": "یہ پیغام ممکنہ طور پر مشکوک ہے۔ خطرہ معتدل ہے، لیکن سرکاری چینلز کے ذریعے بھیجنے والے کی تصدیق کریں۔",
            "ham_low": "یہ پیغام جائز معلوم ہوتا ہے۔ ہمارے تجزیے میں فشنگ یا سپیم کی کوئی اہم علامات نہیں ملیں۔",
            "ham_high": "یہ پیغام محفوظ معلوم ہوتا ہے۔ مجموعی خطرہ کم ہے، لیکن غیر متوقع درخواستوں کی تصدیق کریں۔"
        },
        "tamil": {
            "spam_high": "இந்த செய்தி மிகவும் சந்தேகத்திற்குரியது. இதில் ஃபிஷிங்கின் பல அறிகுறிகள் உள்ளன. எந்த இணைப்புகளையும் கிளிக் செய்ய வேண்டாம் மற்றும் இந்த செய்தியை நீக்கவும்.",
            "spam_medium": "இந்த செய்தியில் ஃபிஷிங் எச்சரிக்கை அறிகுறிகள் உள்ளன. எந்த நடவடிக்கையும் எடுப்பதற்கு முன் எச்சரிக்கையாக இருங்கள்.",
            "spam_low": "இந்த செய்தி சாத்தியமான சந்தேகத்திற்குரியது. ஆபத்து மிதமானது, ஆனால் அதிகாரப்பூர்வ சேனல்கள் மூலம் அனுப்புநரை சரிபார்க்கவும்.",
            "ham_low": "இந்த செய்தி சட்டபூர்வமாகத் தெரிகிறது. எங்கள் பகுப்பாய்வில் ஃபிஷிங் அல்லது ஸ்பேமின் முக்கிய அறிகுறிகள் இல்லை.",
            "ham_high": "இந்த செய்தி பாதுகாப்பாகத் தெரிகிறது. ஒட்டுமொத்த ஆபத்து குறைவாக உள்ளது, ஆனால் எதிர்பாராத கோரிக்கைகளை சரிபார்க்கவும்."
        }
    }

    lang_fallbacks = fallbacks.get(language, fallbacks["english"])

    if decision == "SPAM":
        if score > 0.8:
            return lang_fallbacks["spam_high"]
        elif score > 0.6:
            return lang_fallbacks["spam_medium"]
        else:
            return lang_fallbacks["spam_low"]
    else:
        if score < 0.3:
            return lang_fallbacks["ham_low"]
        else:
            return lang_fallbacks["ham_high"]


async def generate_justification(system_prompt: str, user_prompt: str, decision: str = "SPAM", score: float = 0.5, language: str = "english") -> str:
    """
    Generate justification using Groq API with fallback.

    Args:
        system_prompt: The system prompt for the LLM
        user_prompt: The user prompt with detection details
        decision: The detection decision for fallback
        score: The final score for fallback
        language: Target language for the response

    Returns:
        LLM-generated justification or fallback string
    """
    # Try Groq API
    result = await call_groq_api(system_prompt, user_prompt)

    if result:
        return result

    # Fallback if API fails
    logger.warning("Using fallback justification due to API failure")
    return get_fallback_justification(decision, score, language)


@app.post(
    "/justify",
    response_model=JustifyResponse,
    responses={
        200: {"model": JustifyResponse},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    tags=["Justification"]
)
async def justify(request: JustifyRequest):
    """
    Generate human-readable justification for a phishing detection result.

    Accepts the full JSON output from /predict and uses Groq's Llama 3 model
    to generate a clear 2-3 sentence explanation for non-technical users.
    Supports multiple languages: english, hindi, telugu, urdu, tamil.

    If the Groq API fails, returns a contextual fallback justification.
    """
    try:
        logger.info(f"📝 Justification request received (language: {request.language})")
        logger.info(f"Decision: {request.decision}, Score: {request.final_score:.4f}")

        # Build prompts with language-specific system prompt
        system_prompt = get_justify_system_prompt(request.language)
        user_prompt = build_justify_user_prompt(request)

        logger.debug(f"User prompt:\n{user_prompt}")

        # Call Groq API (with fallback)
        logger.info("Calling Groq API for justification...")

        justification = await generate_justification(
            system_prompt,
            user_prompt,
            decision=request.decision,
            score=request.final_score,
            language=request.language
        )

        logger.success(f"✅ Justification generated ({len(justification)} chars)")
        logger.debug(f"Justification: {justification}")

        return JustifyResponse(justification=justification)

    except Exception as e:
        logger.error(f"❌ Justification error: {e}")
        logger.error(traceback.format_exc())
        # Even if everything fails, return a generic fallback
        fallback = get_fallback_justification(request.decision, request.final_score, request.language)
        return JustifyResponse(justification=fallback)


async def call_groq_chat_api(user_message: str, language: str) -> str:
    """
    Call Groq API for chatbot responses with language-specific system prompts.

    Args:
        user_message: The user's message
        language: The target language (english, hindi, telugu)

    Returns:
        The chatbot's response in the requested language
    """
    import httpx

    # Language-specific system prompts
    language_instructions = {
        "hindi": "जवाब हमेशा हिंदी में दें। SMS मोसाम और सुरक्षा के बारे में जानकारी प्रदान करें।",
        "telugu": "ఎల్లప్పుడూ తెలుగులో సమాధానం ఇవ్వండి। SMS మోసాలు మరియు భద్రత గురించి సమాచారం అందించండి।",
        "marathi": "नेहमी मराठीत उत्तर द्या। SMS मोसं आणि सुरक्षितता बद्दल माहिती प्रदान करा।",
        "urdu": "ہمیشہ اردو میں جواب دیں۔ SMS فراڈ اور سیکیورٹی کے بارے میں معلومات فراہم کریں۔",
        "tamil": "எப்போதும் தமிழில் பதிலளிக்கவும். SMS மோசடிகள் மற்றும் பாதுகாப்பு பற்றிய தகவலை வழங்கவும்।",
        "english": "Always respond in English. Provide information about SMS scams and security."
    }

    system_prompt = f"""You are SentinelAI Assistant, an expert in SMS scam detection and cybersecurity.

{language_instructions.get(language, language_instructions['english'])}

You help users understand:
- How to identify SMS scams and phishing attempts
- What to do if they clicked suspicious links or shared information
- When and how to share OTPs and personal information safely
- General cybersecurity best practices for mobile phones

Be helpful, concise, and always prioritize user safety. Provide practical actionable advice."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.warning(f"Groq chat API call failed: {e}")
        # Return fallback message in requested language
        fallback_messages = {
            "hindi": "क्षमा करें, मैं अभी आपकी सहायता नहीं कर सकता। कृपया बाद में कोशिश करें।",
            "telugu": "క్షమించండి, నేను ప్రస్తుతం సహాయం చేయలేకపోతున్నాను. దయచేసి తర్వాత ప్రయత్నించండి।",
            "english": "I'm sorry, I'm unable to help right now. Please try again later."
        }
        return fallback_messages.get(language, fallback_messages["english"])


@app.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        200: {"model": ChatResponse},
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    tags=["Chat"]
)
async def chat(request: ChatRequest):
    """
    Chatbot endpoint for cybersecurity assistance.

    Provides responses in the user's preferred language using Groq's Llama 3 model.
    Specializes in SMS scam detection and cybersecurity guidance.
    """
    try:
        logger.info(f"💬 Chat request received in {request.language}")
        logger.debug(f"User message: {request.user_message[:100]}...")

        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Groq API key not configured"
            )

        # Call Groq API with language-specific prompt
        response_text = await call_groq_chat_api(request.user_message, request.language)

        logger.success(f"✅ Chat response generated ({len(response_text)} chars)")

        return ChatResponse(response=response_text)

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"⚠️ Validation/Modality error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat service error: {str(e)}"
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": exc.detail,
            "details": None
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "details": {"exception": str(exc)}
        }
    )


if __name__ == "__main__":
    import uvicorn

    logger.info("🚀 Starting SentinelAI Backend Server...")
    logger.info("📝 API Documentation: http://localhost:8000/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )