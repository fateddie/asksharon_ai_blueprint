# Instructions for Claude Code (AI Assistant)

## 🎯 Your Role

You are working on a **decision support system**, not an automated decision-making system. Your job is to help Rob make informed business decisions through transparent, auditable analysis.

**Critical:** Rob must be able to verify every insight, override every recommendation, and audit every decision trail. He owns the decisions; you provide the evidence.

---

## 🚨 MANDATORY READING

Before implementing ANY feature in this codebase:

1. **Read `/PRINCIPLES.md`** - Core system principles (Transparency, Human-in-the-loop, etc.)
2. **Read `/AUDIT_CHECKLIST.md`** - Verification checklist for new features
3. **Check `/config/transparency_config.json`** - Current transparency settings

**These are not guidelines. They are requirements.**

---

## 🔑 Core Rules (NEVER VIOLATE)

### 1. TRANSPARENCY OVER BREVITY

```python
# ❌ BAD - Opaque
def analyze_icp(self):
    return {"top_industry": "dental"}

# ✅ GOOD - Transparent
def analyze_icp(self):
    return {
        "top_industries": [
            {
                "industry": "dental",
                "count": 4,
                "percentage": 9.3,
                "confidence": "medium",  # Based on sample size
                "source_posts": [1, 5, 12, 23],
                "example_quotes": [
                    "I run a dental practice and miss calls all day...",
                    "Our clinic loses patients to voicemail..."
                ],
                "uncertainty": "Small sample size (only 4 posts)"
            }
        ],
        "_audit_trail": {
            "generated_at": "2025-10-25T22:15:00Z",
            "total_posts_analyzed": 43,
            "posts_with_industry_detected": 16,
            "detection_method": "regex_patterns",
            "patterns_used": ["dental", "dentist", "teeth", "orthodont"],
            "version": "v2.0"
        }
    }
```

**Rule:** If you're choosing between a compact output and a transparent output, ALWAYS choose transparent.

---

### 2. ALWAYS INCLUDE SOURCE REFERENCES

Every metric MUST include references to source data.

```python
# ❌ BAD
{"feature": "booking", "mentions": 7}

# ✅ GOOD
{
    "feature": "appointment_booking",
    "mentions": 7,
    "percentage": 16.3,
    "source_posts": [3, 8, 15, 22, 28, 35, 41],
    "example_quotes": [
        "Need AI that can book appointments",
        "Appointment scheduling is killing me"
    ],
    "confidence": "medium",
    "signal_strength": "high"  # 7/43 posts + high urgency
}
```

**Implementation:** Add `source_posts: List[int]` to EVERY aggregated metric.

---

### 3. SHOW CONFIDENCE AND UNCERTAINTY

Never pretend to be certain when you're not.

```python
# ❌ BAD
"Recommendation: Target dental practices"

# ✅ GOOD
"Recommendation: Target dental practices (MEDIUM CONFIDENCE)"
"Evidence: 4 dental posts, all critical urgency, avg 15 upvotes"
"Uncertainty: Small sample size. Alternative: Medical also strong (4 posts)"
"Suggested action: Collect 20+ dental posts before committing"
```

**Confidence Levels:**
- **HIGH:** 10+ posts, clear patterns, high engagement
- **MEDIUM:** 5-9 posts, consistent signals
- **LOW:** 2-4 posts, weak signals
- **INSUFFICIENT:** <2 posts

---

### 4. AUDIT TRAILS ARE MANDATORY

Every analysis output MUST include `_audit_trail`.

```python
{
    "insights": {...},
    "_audit_trail": {
        "generated_at": "2025-10-25T22:15:00Z",
        "data_source": "social_posts_enriched.csv",
        "total_records": 43,
        "date_range": "2024-10-25 to 2025-10-25",
        "analysis_version": "v2.0",
        "config_file": "config/transparency_config.json",
        "scoring_weights": {"signal_volume": 20, ...},
        "thresholds": {"minimum_posts": 30, ...},
        "user_decisions": {}  # Populated if user made choices
    }
}
```

---

### 5. HUMAN DECIDES, NOT THE CODE

```python
# ❌ BAD - Auto-executes
def recommend_target_icp(self):
    best_icp = self._calculate_best()
    self.state.target_icp = best_icp  # AUTO-SELECTED
    return best_icp

# ✅ GOOD - Presents options
def recommend_target_icp(self):
    options = self._rank_icp_options()
    return {
        "recommendations": options,
        "suggested_choice": options[0],  # Top recommendation
        "alternatives": options[1:3],
        "decision_needed": True,
        "decision_prompt": "Select target ICP (1-3 or 'custom'):",
        "rationale_for_suggestion": "Dental has highest urgency + engagement"
    }
```

**Pattern:** Recommend, don't decide. Present, don't execute.

---

### 6. CONFIGURATION OVER HARD-CODING

```python
# ❌ BAD - Hard-coded
MINIMUM_POSTS = 30
URGENCY_WEIGHT = 3

# ✅ GOOD - Configurable
class Config:
    def __init__(self, config_path="config/transparency_config.json"):
        self.config = json.load(open(config_path))

    @property
    def minimum_posts(self):
        return self.config["thresholds"]["minimum_posts"]

    @property
    def urgency_weight(self):
        return self.config["scoring_weights"]["urgency_profile"]
```

**Rule:** If a number affects analysis, it goes in `config.json`.

---

### 7. EXPORT EVERYTHING

Every analysis must support multiple export formats.

```python
class Analyzer:
    def export_results(self, format: str = "json", output_path: str = None):
        """Export analysis results in multiple formats."""
        if format == "json":
            return self._export_json(output_path)
        elif format == "csv":
            return self._export_csv(output_path)
        elif format == "excel":
            return self._export_excel(output_path)
        elif format == "markdown":
            return self._export_markdown(output_path)
        else:
            raise ValueError(f"Unsupported format: {format}")
```

**Supported Formats:**
- JSON (machine-readable)
- CSV (spreadsheet)
- Excel (rich formatting)
- Markdown (human-readable reports)

---

## 📋 Implementation Checklist

Before marking ANY feature as complete, verify:

### Data Transparency
- [ ] Raw data is preserved (not just aggregates)
- [ ] User can view full dataset
- [ ] Filterable/searchable interface exists
- [ ] Export to CSV/Excel/JSON available

### Insight Traceability
- [ ] Every metric includes `source_posts` or `source_ids`
- [ ] Example quotes provided
- [ ] Confidence levels displayed
- [ ] Uncertainty acknowledged when present

### Human Control
- [ ] Decision checkboxes/prompts provided (no auto-execute)
- [ ] User can override recommendations
- [ ] Annotations/notes supported
- [ ] Configuration is external (not hard-coded)

### Auditability
- [ ] Timestamp in ISO format
- [ ] Log collection parameters
- [ ] Version analysis logic
- [ ] Include `_audit_trail` in all outputs

### Configuration
- [ ] Weights/thresholds in `config.json`
- [ ] Document default assumptions
- [ ] Support real-time recalculation
- [ ] Allow UI adjustments (if applicable)

### Output Formats
- [ ] JSON (structured data)
- [ ] Markdown (reports)
- [ ] CSV (raw data)
- [ ] Excel (rich export)

---

## 🎨 Code Patterns

### Pattern 1: Transparent Metric

```python
def calculate_urgency_score(self) -> Dict:
    """Calculate urgency distribution with full transparency."""

    urgency_counts = self.df['urgency'].value_counts()
    critical_posts = self.df[self.df['urgency'] == 'critical']

    return {
        "score": self._calculate_score(urgency_counts),
        "distribution": {
            "critical": {
                "count": int(urgency_counts.get('critical', 0)),
                "percentage": round(urgency_counts.get('critical', 0) / len(self.df) * 100, 1),
                "source_posts": critical_posts.index.tolist(),
                "example_quotes": critical_posts['text_excerpt'].head(3).tolist()
            },
            # ... high, medium, low
        },
        "confidence": self._assess_confidence(len(self.df)),
        "interpretation": self._interpret_urgency(urgency_counts),
        "_audit_trail": {
            "total_posts": len(self.df),
            "detection_patterns": URGENCY_PATTERNS,
            "unmatched_posts": self.df[self.df['urgency'].isna()].index.tolist()
        }
    }

def _assess_confidence(self, n_posts: int) -> str:
    """Transparent confidence assessment."""
    if n_posts >= 30:
        return "high"
    elif n_posts >= 15:
        return "medium"
    else:
        return "low"

def _interpret_urgency(self, counts: pd.Series) -> str:
    """Human-readable interpretation."""
    critical_pct = counts.get('critical', 0) / counts.sum() * 100
    if critical_pct >= 60:
        return "STRONG SIGNAL - Most posts show critical urgency"
    elif critical_pct >= 40:
        return "MODERATE SIGNAL - Significant urgency present"
    else:
        return "WEAK SIGNAL - Low urgency detected"
```

### Pattern 2: Decision Presentation

```python
def present_icp_decision(self, icp_analysis: Dict) -> Dict:
    """Present ICP options for human decision."""

    top_industries = icp_analysis['top_industries'][:3]

    return {
        "decision_prompt": "Based on the data, which ICP should we target?",
        "options": [
            {
                "id": 1,
                "industry": top_industries[0]['industry'],
                "evidence": f"{top_industries[0]['count']} posts, {top_industries[0]['percentage']}%",
                "confidence": top_industries[0]['confidence'],
                "view_posts_cmd": f"python scripts/view_posts.py --industry {top_industries[0]['industry']}"
            },
            # ... more options
        ],
        "recommendation": {
            "suggested_option": 1,
            "rationale": "Highest urgency + engagement",
            "caution": "Small sample size - consider collecting more data"
        },
        "custom_option": {
            "id": "custom",
            "description": "I see a different pattern in the data"
        },
        "decision_storage_path": "data/decisions/icp_decision.json"
    }
```

### Pattern 3: Configurable Scoring

```python
class ValidationScorer:
    def __init__(self, config_path: str = "config/transparency_config.json"):
        self.config = json.load(open(config_path))
        self.weights = self.config['scoring_weights']

    def calculate_score(self, metrics: Dict) -> Dict:
        """Calculate validation score with full transparency."""

        scores = {
            "signal_volume": self._score_volume(metrics['volume']) * self.weights['signal_volume'] / 20,
            "icp_clarity": self._score_icp(metrics['icp']) * self.weights['icp_clarity'] / 20,
            # ... more factors
        }

        total_score = sum(scores.values())

        return {
            "total_score": round(total_score, 1),
            "max_score": 100,
            "breakdown": {
                "signal_volume": {
                    "raw_score": scores['signal_volume'],
                    "weight": self.weights['signal_volume'],
                    "metric_value": metrics['volume'],
                    "explanation": f"{metrics['volume']} posts collected"
                },
                # ... more breakdowns
            },
            "interpretation": self._interpret_score(total_score),
            "config_used": self.config,
            "recalculate_cmd": "python scripts/recalculate_score.py --adjust-weights"
        }
```

---

## 🤝 Hybrid AI Patterns (HuggingFace + OpenAI)

**Status:** Phase 1 Complete ✅ (66-75% cost reduction achieved)
**Details:** See `docs/COST_OPTIMIZATION.md` and `docs/ARCHITECTURE.md`

### Philosophy: Use the Right Tool for the Job

The system uses a **cost-optimized hybrid approach**:

- **HuggingFace (Free/Local):** Commoditized NLP tasks
- **OpenAI (Paid API):** Complex reasoning, structured outputs, domain expertise

**Goal:** Minimize cost while maintaining quality and transparency.

---

### Decision Matrix: When to Use Each

#### Use HuggingFace When:

✅ **Commoditized NLP tasks:**
- Grammar correction
- Sentiment analysis
- Keyword extraction (candidates)
- Named entity recognition
- Semantic similarity/embeddings
- Text classification (standard categories)

✅ **High-volume operations:**
- Batch processing 100+ texts
- Real-time requirements (<100ms)
- Privacy-sensitive data (stays local)

✅ **Budget constraints:**
- Startup/MVP phase
- High request volume (>1000/day)

#### Use OpenAI When:

✅ **Complex reasoning:**
- Multi-step analysis
- Domain-specific expertise
- Creative content generation
- Nuanced interpretation

✅ **Structured outputs:**
- JSON schema validation
- Complex formatting requirements
- Precise instruction following

✅ **Quality critical:**
- User-facing content
- High-stakes decisions
- Novel/edge cases

---

### Pattern 1: Hybrid Preprocessing

**Use HuggingFace for preprocessing, OpenAI for value-add.**

```python
# ✅ GOOD - Hybrid approach
class IdeaCritic:
    def __init__(self):
        # Optional: T5 grammar correction (free)
        try:
            from transformers import pipeline
            self.grammar_corrector = pipeline(
                "text2text-generation",
                model="vennify/t5-base-grammar-correction"
            )
            self.use_t5 = True
        except:
            self.use_t5 = False
            logger.warning("T5 unavailable, using OpenAI only")

    def critique(self, idea_text: str) -> Dict:
        """Critique idea with hybrid approach."""

        # STEP 1: Free preprocessing (if available)
        if self.use_t5:
            corrected = self._correct_with_t5(idea_text)
            logger.info("✅ T5 grammar correction applied ($0)")
        else:
            corrected = idea_text

        # STEP 2: Paid reasoning
        critique = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": "You are a business critique assistant. Provide reasoning only."
            }, {
                "role": "user",
                "content": f"Critique this business idea:\n\n{corrected}"
            }]
        )

        return {
            "corrected_text": corrected,
            "critique": critique.choices[0].message.content,
            "preprocessing": "t5" if self.use_t5 else "none",
            "cost_savings": "$0.02-0.05" if self.use_t5 else "$0",
            "_audit_trail": {
                "grammar_model": "vennify/t5-base-grammar-correction" if self.use_t5 else "none",
                "critique_model": "gpt-4o-mini",
                "fallback_used": not self.use_t5
            }
        }
```

**Cost Impact:**
- Before: $0.05/request
- After: $0.02/request (60% savings)

---

### Pattern 2: Candidate Generation + Refinement

**Use HuggingFace to generate candidates, OpenAI to refine/categorize.**

```python
# ✅ GOOD - Hybrid candidate refinement
class KeywordGenerator:
    def __init__(self):
        try:
            from keybert import KeyBERT
            self.keybert = KeyBERT(model='all-MiniLM-L6-v2')
            self.use_keybert = True
        except:
            self.use_keybert = False
            logger.warning("KeyBERT unavailable, using OpenAI only")

    def generate_keywords(self, idea_context: str, n_keywords: int = 50) -> Dict:
        """Generate keywords with hybrid approach."""

        if self.use_keybert:
            # STEP 1: Free candidate extraction (50 keywords)
            candidates = self.keybert.extract_keywords(
                idea_context,
                keyphrase_ngram_range=(1, 3),
                stop_words='english',
                use_mmr=True,  # Diversity
                diversity=0.7,
                top_n=n_keywords
            )
            keywords_list = [kw[0] for kw in candidates]

            # STEP 2: Paid categorization (only top 14 keywords)
            categorized = self._categorize_with_openai(keywords_list[:14])

            logger.info(f"✅ KeyBERT extracted {len(keywords_list)} candidates, GPT categorized top 14")

        else:
            # Fallback: OpenAI generates all 50
            categorized = self._generate_with_openai(idea_context, n_keywords)

        return {
            "keywords": categorized,
            "method": "keybert_hybrid" if self.use_keybert else "openai_only",
            "cost_savings": "70%" if self.use_keybert else "0%",
            "_audit_trail": {
                "extraction_model": "all-MiniLM-L6-v2" if self.use_keybert else "gpt-4o-mini",
                "categorization_model": "gpt-4o-mini",
                "keywords_sent_to_gpt": 14 if self.use_keybert else n_keywords
            }
        }
```

**Cost Impact:**
- Before: 50 keywords to GPT = $0.10/request
- After: 14 keywords to GPT = $0.03/request (70% savings)

---

### Pattern 3: Semantic Search (Pure HuggingFace)

**Use HuggingFace for tasks that don't need reasoning.**

```python
# ✅ GOOD - Pure HuggingFace for semantic search
class EvidenceSearcher:
    def __init__(self, data_path: str):
        from sentence_transformers import SentenceTransformer, util
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.df = pd.read_csv(data_path)

        # Cache embeddings for performance
        cache_path = "data/cache/embeddings.pt"
        if Path(cache_path).exists():
            self.embeddings = torch.load(cache_path)
        else:
            self.embeddings = self.model.encode(
                self.df['text_excerpt'].tolist(),
                convert_to_tensor=True,
                show_progress_bar=True
            )
            torch.save(self.embeddings, cache_path)

    def search(self, query: str, top_k: int = 5) -> Dict:
        """Semantic search - NO OpenAI needed."""

        # Encode query
        query_emb = self.model.encode(query, convert_to_tensor=True)

        # Compute cosine similarity
        scores = util.cos_sim(query_emb, self.embeddings)[0]
        top_results = torch.topk(scores, k=top_k)

        results = []
        for idx, score in zip(top_results.indices, top_results.values):
            results.append({
                "post_id": int(idx),
                "text": self.df.iloc[idx]['text_excerpt'],
                "similarity_score": float(score),
                "industry": self.df.iloc[idx].get('industry', 'unknown'),
                "urgency": self.df.iloc[idx].get('urgency', 'unknown')
            })

        return {
            "query": query,
            "results": results,
            "model": "all-MiniLM-L6-v2",
            "cost": "$0 (local)",
            "cached": True,
            "_audit_trail": {
                "total_posts_searched": len(self.df),
                "embedding_model": "all-MiniLM-L6-v2",
                "search_method": "cosine_similarity"
            }
        }
```

**Cost Impact:**
- Before: Not possible (or $0.05+ per search with OpenAI)
- After: $0 (local, instant after caching)

---

### Pattern 4: Graceful Degradation (REQUIRED)

**ALWAYS provide fallback to OpenAI if HuggingFace unavailable.**

```python
# ✅ GOOD - Graceful degradation
class SentimentAnalyzer:
    def __init__(self):
        self.use_local = self._init_local_model()

    def _init_local_model(self) -> bool:
        """Try to initialize local model, fallback if unavailable."""
        try:
            from transformers import pipeline
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment"
            )
            logger.info("✅ Local sentiment model loaded (HuggingFace)")
            return True
        except Exception as e:
            logger.warning(f"⚠️ HuggingFace unavailable: {e}")
            logger.warning("Falling back to OpenAI sentiment analysis")
            return False

    def analyze(self, text: str) -> Dict:
        """Analyze sentiment with graceful degradation."""

        if self.use_local:
            result = self.sentiment_pipeline(text)[0]
            method = "huggingface"
            cost = "$0"
        else:
            result = self._openai_sentiment(text)
            method = "openai_fallback"
            cost = "$0.01"

        return {
            "sentiment": result['label'],
            "confidence": result['score'],
            "method": method,
            "cost": cost,
            "_audit_trail": {
                "model": "cardiffnlp/twitter-roberta-base-sentiment" if self.use_local else "gpt-4o-mini",
                "fallback_used": not self.use_local
            }
        }

# ❌ BAD - Hard dependency
def analyze_sentiment(text):
    from transformers import pipeline  # Crashes if not installed
    pipe = pipeline("sentiment-analysis")
    return pipe(text)
```

**Key Points:**
- System ALWAYS works (even without optional dependencies)
- User informed of fallback via logging
- Cost tracked in audit trail
- No breaking changes for users without HuggingFace

---

### Installation Instructions

**Document optional dependencies clearly:**

```python
# requirements.txt (REQUIRED)
openai>=1.0.0
pandas>=2.0.0
requests>=2.28.0

# requirements-optional.txt (COST SAVINGS)
transformers>=4.30.0  # T5 Grammar ($15-30/mo savings)
keybert>=0.8.0        # KeyBERT Keywords ($30-50/mo savings)
sentence-transformers>=2.2.0  # Semantic search (new capability)
torch>=2.0.0          # Required for above
```

**In documentation:**
```markdown
### Cost Optimization (Optional)

Install these dependencies for 66-75% cost reduction:

```bash
pip install transformers keybert sentence-transformers torch
```

**Savings:**
- T5 Grammar: $15-30/month
- KeyBERT Keywords: $30-50/month
- Semantic Search: FREE (new capability)

**Total:** $50-100/month savings

**Note:** System works WITHOUT these (falls back to OpenAI).
```

---

### Transparency Requirements

**Hybrid usage MUST be transparent in outputs:**

```python
# ✅ GOOD - User knows what was used
{
    "analysis": {...},
    "_audit_trail": {
        "grammar_correction": "t5-base (local, $0)",
        "keyword_extraction": "keybert (local, $0)",
        "keyword_categorization": "gpt-4o-mini (api, $0.03)",
        "total_cost": "$0.03",
        "cost_savings_vs_openai_only": "$0.07 (70%)",
        "models_used": {
            "local": ["vennify/t5-base-grammar-correction", "all-MiniLM-L6-v2"],
            "api": ["gpt-4o-mini"]
        },
        "fallback_occurred": False
    }
}
```

**Benefits:**
- Rob knows exactly which models were used
- Cost tracking is explicit
- Can verify savings
- Audit trail maintained

---

### Testing Hybrid Implementations

**Test BOTH paths:**

```python
# test_hybrid_keyword_generator.py

def test_keybert_available():
    """Test with KeyBERT installed."""
    gen = KeywordGenerator()
    assert gen.use_keybert == True
    result = gen.generate_keywords("AI receptionist for dentists")
    assert result['method'] == "keybert_hybrid"
    assert result['cost_savings'] == "70%"

def test_keybert_unavailable(monkeypatch):
    """Test fallback when KeyBERT not installed."""
    def mock_import_error(*args, **kwargs):
        raise ImportError("KeyBERT not found")

    monkeypatch.setattr("builtins.__import__", mock_import_error)

    gen = KeywordGenerator()
    assert gen.use_keybert == False
    result = gen.generate_keywords("AI receptionist for dentists")
    assert result['method'] == "openai_only"
    assert result['cost_savings'] == "0%"
```

---

### Summary: Hybrid AI Checklist

Before implementing any AI feature, ask:

- [ ] Is this a commoditized NLP task? → Try HuggingFace first
- [ ] Does this need complex reasoning? → Use OpenAI
- [ ] Can I split into preprocessing + reasoning? → Use hybrid approach
- [ ] Is there a fallback if HuggingFace unavailable? → REQUIRED
- [ ] Is model usage transparent in output? → REQUIRED
- [ ] Is cost savings tracked and reported? → REQUIRED
- [ ] Are optional dependencies clearly documented? → REQUIRED
- [ ] Have I tested both HuggingFace and fallback paths? → REQUIRED

**Goal:** Minimize cost while maintaining transparency, quality, and reliability.

---

## 🚫 Anti-Patterns (DO NOT DO THIS)

### Anti-Pattern 1: Black Box Scoring

```python
# ❌ BAD
def validate_idea(self):
    score = self._magic_algorithm()
    return {"score": 76, "verdict": "PROCEED"}
```

**Why Bad:** No transparency, no audit trail, no way to verify.

### Anti-Pattern 2: Auto-Execution

```python
# ❌ BAD
def finalize_strategy(self):
    best_icp = self._calculate_best_icp()
    self.workflow.next_step = "market_sizing"
    self.workflow.target_customer = best_icp
    return "Strategy finalized"
```

**Why Bad:** Removes human control, no decision prompt.

### Anti-Pattern 3: Hard-Coded Assumptions

```python
# ❌ BAD
if urgency_critical_pct > 60:  # Magic number
    return "HIGH_PRIORITY"
```

**Why Bad:** Not configurable, hidden assumption.

### Anti-Pattern 4: Lossy Summaries

```python
# ❌ BAD
def summarize_posts(self):
    return {"average_sentiment": 0.65}
```

**Why Bad:** Raw data is lost, can't verify source.

---

## 📚 Required Reading Hierarchy

1. **PRINCIPLES.md** - System-wide rules (read first)
2. **CLAUDE.md** (this file) - Implementation guidance
3. **AUDIT_CHECKLIST.md** - Feature verification
4. **ARCHITECTURE.md** - Technical architecture

**Workflow:**
```
New Feature Request
  ↓
Read PRINCIPLES.md (understand WHY)
  ↓
Read this file (understand HOW)
  ↓
Implement with transparency patterns
  ↓
Verify with AUDIT_CHECKLIST.md
  ↓
Update ARCHITECTURE.md if needed
```

---

## ✅ Example: Full Implementation

Here's a complete example following all principles:

```python
# src/analysis/feature_analyzer.py

import json
import pandas as pd
from datetime import datetime
from typing import Dict, List

class FeatureAnalyzer:
    """
    Analyzes feature requests with full transparency.

    Follows PRINCIPLES.md requirements for:
    - Transparency (source references)
    - Human-in-the-loop (no auto-decisions)
    - Auditability (audit trails)
    - Configurability (external config)
    """

    def __init__(self, data_path: str, config_path: str = "config/transparency_config.json"):
        self.df = pd.read_csv(data_path)
        self.config = json.load(open(config_path))
        self.feature_patterns = {
            "booking": r"\b(book|appointment|scheduling|calendar)\b",
            "sms": r"\b(sms|text|message)\b",
            # ... more patterns
        }

    def analyze_features(self) -> Dict:
        """Analyze feature requests with full transparency."""

        features = []

        for feature_name, pattern in self.feature_patterns.items():
            matching_posts = self.df[
                self.df['text_excerpt'].str.contains(pattern, case=False, na=False, regex=True)
            ]

            if len(matching_posts) > 0:
                features.append({
                    "feature": feature_name.replace("_", " ").title(),
                    "mentions": len(matching_posts),
                    "percentage": round(len(matching_posts) / len(self.df) * 100, 1),
                    "source_posts": matching_posts.index.tolist(),
                    "example_quotes": matching_posts['text_excerpt'].head(3).tolist(),
                    "avg_urgency_weight": self._calculate_urgency_weight(matching_posts),
                    "confidence": self._assess_confidence(len(matching_posts)),
                    "signal_strength": self._assess_signal_strength(matching_posts)
                })

        # Sort by signal strength
        features.sort(key=lambda x: x['mentions'] * x['avg_urgency_weight'], reverse=True)

        return {
            "features": features,
            "summary": {
                "total_features_detected": len(features),
                "high_confidence_features": len([f for f in features if f['confidence'] == 'high'])
            },
            "_audit_trail": {
                "generated_at": datetime.now().isoformat(),
                "total_posts_analyzed": len(self.df),
                "detection_patterns": self.feature_patterns,
                "version": "v2.0",
                "config_file": "config/transparency_config.json"
            }
        }

    def _calculate_urgency_weight(self, posts: pd.DataFrame) -> float:
        """Calculate weighted urgency score."""
        urgency_weights = {"critical": 3, "high": 2, "medium": 1, "low": 0.5}
        weights = posts['urgency'].map(urgency_weights)
        return round(weights.mean(), 2)

    def _assess_confidence(self, n_mentions: int) -> str:
        """Assess confidence based on sample size."""
        if n_mentions >= 10:
            return "high"
        elif n_mentions >= 5:
            return "medium"
        else:
            return "low"

    def _assess_signal_strength(self, posts: pd.DataFrame) -> str:
        """Assess overall signal strength."""
        # High: many mentions + high urgency + high engagement
        score = len(posts) * posts['upvotes'].mean() * self._calculate_urgency_weight(posts)
        if score >= 100:
            return "high"
        elif score >= 50:
            return "medium"
        else:
            return "low"

    def export_results(self, results: Dict, format: str = "json", output_path: str = None):
        """Export results in multiple formats."""
        if format == "json":
            with open(output_path or "feature_analysis.json", 'w') as f:
                json.dump(results, f, indent=2)
        elif format == "markdown":
            self._export_markdown(results, output_path or "feature_analysis.md")
        # ... more formats
```

---

## 🎯 Success Metrics

You're following these guidelines when:

1. **Rob can verify every claim**
   - "Show me the 4 dental posts" → System shows all 4 immediately

2. **Rob can export and analyze independently**
   - Downloads CSV, opens in Excel, verifies calculations

3. **Rob can adjust assumptions**
   - Changes urgency weight from 20 to 30, sees score update

4. **Rob can audit 6 months later**
   - Finds exact data, config, and analysis that led to decision

---

## 📞 When Uncertain

If you're unsure whether a feature follows these principles, ask:

1. Can Rob see the source data?
2. Can Rob override the recommendation?
3. Is there an audit trail?
4. Is configuration external?
5. Can this be reproduced later?

**If any answer is unclear, err on the side of MORE transparency.**

---

## Version History

- **v1.0** (2025-10-25): Initial AI assistant guidelines established

---

**Remember: You assist with evidence. Rob decides with judgment.**
