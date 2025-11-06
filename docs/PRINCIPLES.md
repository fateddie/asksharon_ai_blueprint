# Core System Principles

## 🎯 Mission

Support humans in making complex business decisions through transparent, auditable intelligence - NOT automated decision-making.

**Philosophy:** This system assists with data collection and analysis, but **you make the final decisions**. Every recommendation must be verifiable, every insight must trace to source data, and every configuration must be under your control.

---

## 🔑 Core Principles

### 1. TRANSPARENCY FIRST

**Rule:** Every insight must trace back to source data.

**Why It Matters:**
Complex business decisions require understanding the *evidence*, not just the conclusion. "4 dental posts" is meaningless without seeing what those 4 dental practice owners actually said.

**Implementation Requirements:**
- ✅ All metrics include `source_ids` or `source_posts` arrays
- ✅ Reports link directly to raw data
- ✅ UI shows "View 23 posts" not just "23 mentions"
- ✅ Example quotes accompany summaries
- ✅ Click-through to full source text

**Anti-patterns (DO NOT DO THIS):**
- ❌ Black-box scores without breakdown
- ❌ Summaries without access to raw data
- ❌ "Trust us" recommendations
- ❌ Aggregates without drill-down capability

**Example:**
```python
# ✅ GOOD
{
  "industry": "dental",
  "count": 4,
  "percentage": 9.3,
  "source_posts": [1, 5, 12, 23],
  "example_quotes": ["I run a dental practice...", "..."],
  "confidence": "medium"
}

# ❌ BAD
{
  "industry": "dental",
  "count": 4
}
```

---

### 2. HUMAN-IN-THE-LOOP

**Rule:** System assists, human decides.

**Why It Matters:**
No algorithm can replace business judgment. The cost of a wrong decision is significant, so the human must retain full decision authority with the system providing evidence and options.

**Implementation Requirements:**
- ✅ Present evidence + confidence level
- ✅ Provide decision checkboxes/ratings (never auto-execute)
- ✅ Allow override of all weights/thresholds
- ✅ Save human decisions alongside AI suggestions
- ✅ Show uncertainty honestly ("Low confidence: only 2 posts")
- ✅ Offer multiple interpretations when ambiguous

**Anti-patterns (DO NOT DO THIS):**
- ❌ Auto-execute decisions
- ❌ Hide uncertainty/confidence
- ❌ Force single "correct" answer
- ❌ Make recommendations without showing alternatives

**Example:**
```markdown
## ICP Recommendation: Target Dental Practices

**Evidence:** 4 posts from dental practice owners (all CRITICAL urgency)

**Confidence:** MEDIUM (small sample size)

**Alternative:** Medical practices also show strong signals (4 posts, mixed urgency)

**YOUR DECISION:**
[ ] High Priority - Target dental first
[ ] Medium Priority - Include in v2
[ ] Low Priority - Focus on medical instead
[ ] Need More Data - Collect 20+ dental posts before deciding

**NOTES:** [Your reasoning here]
```

---

### 3. FULL DATA ACCESSIBILITY

**Rule:** Raw data must always be accessible and exportable.

**Why It Matters:**
You may want to analyze data in Excel, share with stakeholders, or review offline. Data lock-in prevents independent validation and decision-making.

**Implementation Requirements:**
- ✅ Export to CSV/Excel/JSON/Markdown
- ✅ Interactive filtering/search on raw dataset
- ✅ Full-text access to posts/comments (not just excerpts)
- ✅ Annotation/tagging capability
- ✅ No proprietary formats
- ✅ Include metadata in all exports

**Anti-patterns (DO NOT DO THIS):**
- ❌ Summaries-only interfaces
- ❌ Aggregated data without drill-down
- ❌ Proprietary/locked formats
- ❌ Truncated data exports

**Example Exports:**
```bash
# Export full dataset
python export.py --format csv --output all_posts.csv

# Export filtered subset
python export.py --industry dental --urgency critical --output dental_critical.xlsx

# Export with annotations
python export.py --include-annotations --output annotated_posts.json
```

---

### 4. AUDITABILITY

**Rule:** Decision trail must be reproducible 6 months from now.

**Why It Matters:**
Business decisions need justification over time. "Why did we target dental practices?" should be answerable with the exact data and analysis that led to that decision.

**Implementation Requirements:**
- ✅ Timestamp all analyses
- ✅ Version all configurations (scoring weights, thresholds)
- ✅ Log data sources + collection parameters
- ✅ Track human decisions/annotations
- ✅ Save analysis snapshots (not just latest)
- ✅ Include `_audit_trail` in all outputs

**Anti-patterns (DO NOT DO THIS):**
- ❌ Ephemeral results (lost after restart)
- ❌ No version control on configs
- ❌ Lost decision history
- ❌ Overwriting previous analyses

**Audit Trail Structure:**
```json
{
  "_audit_trail": {
    "generated_at": "2025-10-25T22:15:00Z",
    "data_source": "social_posts_enriched.csv",
    "total_posts_analyzed": 43,
    "collection_date_range": "2024-10-25 to 2025-10-25",
    "analysis_version": "v2.0",
    "config_version": "v1.2",
    "scoring_weights": {"signal_volume": 20, "icp_clarity": 20, ...},
    "user_decisions": {
      "target_icp": "dental",
      "rationale": "Strong urgency signals, high upvotes"
    }
  }
}
```

---

### 5. CONFIGURABLE INTELLIGENCE

**Rule:** Human controls weights, thresholds, and assumptions.

**Why It Matters:**
Different businesses have different priorities. What's a "good" urgency threshold (60%? 80%?) depends on your risk tolerance. Hard-coded assumptions remove your control.

**Implementation Requirements:**
- ✅ Expose all scoring weights in `config.json`
- ✅ Allow real-time recalculation with new weights
- ✅ Document default assumptions clearly
- ✅ UI for adjustment without code changes
- ✅ Show impact of weight changes ("If you increase urgency weight to 30%, score becomes 82")

**Anti-patterns (DO NOT DO THIS):**
- ❌ Hard-coded weights/thresholds
- ❌ Hidden assumptions ("magic numbers")
- ❌ Requires code changes to adjust
- ❌ No explanation of defaults

**Configuration Example:**
```json
{
  "scoring_weights": {
    "signal_volume": 20,      // You control this
    "icp_clarity": 20,
    "urgency_profile": 20,
    "competition_signal": 20,
    "feature_demand": 20
  },
  "thresholds": {
    "minimum_posts": 30,      // What's "enough" for YOU?
    "critical_urgency_pct": 60,
    "icp_confidence_pct": 60
  },
  "user_notes": "I increased urgency weight because time-to-market matters more than feature clarity for this idea"
}
```

---

## 📋 Design Checklist

Before implementing ANY new analysis/intelligence feature, verify:

- [ ] Can the user view the raw data that produced this insight?
- [ ] Does every metric include source IDs or post references?
- [ ] Is confidence/uncertainty displayed honestly?
- [ ] Can the user override or disagree with the recommendation?
- [ ] Is the data exportable in multiple formats?
- [ ] Is there an audit trail showing how this was calculated?
- [ ] Are scoring weights/thresholds configurable (not hard-coded)?
- [ ] Can this analysis be reproduced 6 months from now?

**If ANY answer is "NO", the feature is incomplete.**

---

## 🎯 Success Criteria

A feature follows these principles when:

1. **A skeptical user can verify every claim**
   "Show me the 4 dental posts" → System shows all 4 with full text

2. **The user can disagree and override**
   "I don't think dental is the right target" → User can annotate, adjust, decide differently

3. **Decisions are defensible over time**
   6 months later: "Here's the exact data and analysis that led to our dental focus"

4. **The system is honest about uncertainty**
   "Low confidence (only 4 posts)" vs pretending high confidence

5. **Configuration matches user's priorities**
   User can say "urgency matters more than volume" and system recalculates

---

## 🚨 When In Doubt

Ask yourself:

> **"If I had to defend this business decision to investors 6 months from now, could I show them the evidence trail and reproduce the analysis?"**

If not, add more transparency.

---

## Version History

- **v1.0** (2025-10-25): Initial principles established
  - Transparency, Human-in-the-loop, Data Access, Auditability, Configurability

---

**These principles are not optional. They are the foundation of trustworthy decision support.**
