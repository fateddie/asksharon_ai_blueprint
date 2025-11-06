# Phase 2, Week 1: Real Email Integration

**Dates:** November 7-13, 2025
**Status:** In Progress
**Goal:** Connect to Gmail and provide AI-powered email summaries

---

## 🎯 Objectives

By end of this week, AskSharon.ai will:
1. Connect to real Gmail account via IMAP
2. Fetch last 100 emails
3. Parse email structure (subject, sender, body, date)
4. Use OpenAI to generate intelligent summaries
5. Detect and categorize priority levels (high/medium/low)
6. Store emails in database for future reference
7. Provide rich email summaries in chat UI

---

## 📋 Implementation Tasks

### Task 1: Gmail IMAP Setup (1-2 hours)
**Priority:** HIGH
**Dependencies:** None

**Steps:**
1. Update `.env.example` with Gmail configuration
2. Add Gmail IMAP credentials structure
3. Document how to get Gmail app password
4. Add configuration validation
5. Test IMAP connection

**Deliverables:**
- [ ] `.env.example` updated with Gmail settings
- [ ] `docs/GMAIL_SETUP.md` guide created
- [ ] Connection test script

**Acceptance Criteria:**
- Can connect to Gmail IMAP server
- Can authenticate with app password
- Error messages are helpful

---

### Task 2: Email Fetching Module (2-3 hours)
**Priority:** HIGH
**Dependencies:** Task 1

**Steps:**
1. Enhance `assistant/modules/email/main.py`
2. Add IMAP client initialization
3. Implement email fetching (last N emails)
4. Parse email structure:
   - Subject
   - From (sender name + email)
   - To
   - Date
   - Body (text + HTML)
   - Attachments count
5. Store in database
6. Add caching to avoid re-fetching

**Deliverables:**
- [ ] Enhanced email module
- [ ] Email parsing logic
- [ ] Database storage working
- [ ] Fetch function with error handling

**Acceptance Criteria:**
- Can fetch 100 emails in <5 seconds
- All fields parsed correctly
- Handles HTML and text emails
- Graceful error handling (no credentials, network issues)

---

### Task 3: OpenAI Integration (2-3 hours)
**Priority:** HIGH
**Dependencies:** Task 2

**Steps:**
1. Add `openai` configuration to .env
2. Create summarization service:
   - Individual email summarization
   - Batch summarization (multiple emails)
   - Key points extraction
   - Action items detection
3. Implement caching (don't re-summarize)
4. Add rate limiting
5. Handle API errors gracefully

**Deliverables:**
- [ ] OpenAI client configured
- [ ] Summarization functions
- [ ] Caching layer
- [ ] Cost tracking (optional)

**Acceptance Criteria:**
- Summaries are concise (2-3 sentences)
- Captures key information
- Identifies action items
- Handles errors (no API key, rate limits)

---

### Task 4: Priority Detection (1-2 hours)
**Priority:** MEDIUM
**Dependencies:** Task 2, Task 3

**Steps:**
1. Create priority scoring algorithm:
   - Sender importance (known contacts = higher)
   - Subject keywords (urgent, deadline, ASAP)
   - Action words (review, approve, sign)
   - Recency (today > yesterday > older)
2. Categorize into HIGH/MEDIUM/LOW
3. Store priority in database
4. Allow manual override

**Deliverables:**
- [ ] Priority scoring function
- [ ] Category assignment
- [ ] Database field for priority
- [ ] Manual override endpoint

**Acceptance Criteria:**
- Work emails marked as higher priority
- Marketing emails marked as low
- Urgent keywords detected
- At least 80% accuracy

---

### Task 5: Enhanced API Endpoint (1 hour)
**Priority:** MEDIUM
**Dependencies:** Tasks 2, 3, 4

**Steps:**
1. Update `/emails/summarise` endpoint
2. Add parameters:
   - `limit` (number of emails, default 10)
   - `priority` (filter by priority)
   - `since` (date filter)
3. Return rich summary:
   - Total emails
   - By priority (high/medium/low counts)
   - Individual email summaries
   - Action items list
4. Add pagination

**Deliverables:**
- [ ] Enhanced endpoint
- [ ] Rich response format
- [ ] Filtering options
- [ ] API documentation

**Acceptance Criteria:**
- Returns structured data
- Filters work correctly
- Response time < 2 seconds
- Well documented

---

### Task 6: UI Integration (1-2 hours)
**Priority:** MEDIUM
**Dependencies:** Task 5

**Steps:**
1. Update Streamlit UI to display rich summaries
2. Show email breakdown:
   - Priority categories
   - Individual summaries
   - Action items
   - Quick actions (mark read, archive)
3. Add refresh button
4. Show last sync time

**Deliverables:**
- [ ] Enhanced email display in UI
- [ ] Priority color coding
- [ ] Action items highlighted
- [ ] Refresh functionality

**Acceptance Criteria:**
- Easy to read summaries
- Clear priority indicators
- Action items stand out
- Works on mobile browsers

---

### Task 7: Testing & Documentation (1-2 hours)
**Priority:** HIGH
**Dependencies:** All above

**Steps:**
1. Create email integration tests
2. Test with various email types:
   - HTML emails
   - Plain text
   - With attachments
   - From important contacts
   - Marketing emails
3. Document setup process
4. Add troubleshooting guide
5. Update PROGRESS.md

**Deliverables:**
- [ ] Test suite for emails
- [ ] Gmail setup guide
- [ ] Troubleshooting docs
- [ ] Progress updated

**Acceptance Criteria:**
- All tests passing
- Setup guide is clear
- Common issues documented
- Progress reflects completion

---

## 🔧 Technical Specifications

### Gmail IMAP Configuration
```python
# .env additions
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
GMAIL_IMAP_SERVER=imap.gmail.com
GMAIL_IMAP_PORT=993
GMAIL_FETCH_LIMIT=100
```

### OpenAI Configuration
```python
# .env additions
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini  # Cost-effective for summaries
OPENAI_MAX_TOKENS=150  # Per email summary
```

### Email Data Structure
```python
@dataclass
class Email:
    id: str
    subject: str
    from_name: str
    from_email: str
    to: str
    date: datetime
    body_text: str
    body_html: str
    attachments_count: int
    priority: str  # HIGH, MEDIUM, LOW
    summary: str
    action_items: List[str]
    is_read: bool
    folder: str  # INBOX, SENT, etc.
```

### Priority Scoring Algorithm
```python
def calculate_priority(email: Email) -> str:
    score = 0

    # Sender importance (0-40 points)
    if is_known_contact(email.from_email):
        score += 20
    if is_vip(email.from_email):
        score += 40

    # Subject keywords (0-30 points)
    urgent_keywords = ["urgent", "asap", "deadline", "important"]
    for keyword in urgent_keywords:
        if keyword in email.subject.lower():
            score += 30
            break

    # Action words (0-20 points)
    action_words = ["review", "approve", "sign", "respond", "action required"]
    for word in action_words:
        if word in email.subject.lower() or word in email.body_text.lower():
            score += 20
            break

    # Recency (0-10 points)
    if email.date > datetime.now() - timedelta(hours=24):
        score += 10
    elif email.date > datetime.now() - timedelta(days=3):
        score += 5

    # Categorize
    if score >= 50:
        return "HIGH"
    elif score >= 25:
        return "MEDIUM"
    else:
        return "LOW"
```

---

## 📊 Success Metrics

### Performance Targets
- Email fetch time: < 5 seconds for 100 emails
- Summarization time: < 2 seconds per email
- API response time: < 3 seconds total
- Priority accuracy: > 80%

### Quality Targets
- Summary captures key information: 95%
- Action items detected: 90%
- No critical errors: 100%
- User satisfaction: Positive feedback

---

## 🚧 Risks & Mitigations

### Risk 1: Gmail Rate Limiting
**Impact:** HIGH
**Probability:** MEDIUM
**Mitigation:**
- Cache fetched emails
- Implement exponential backoff
- Fetch only new emails after initial load
- Document rate limits

### Risk 2: OpenAI API Costs
**Impact:** MEDIUM
**Probability:** HIGH
**Mitigation:**
- Use gpt-4o-mini (cheaper)
- Limit summary length (150 tokens max)
- Cache summaries
- Add cost tracking
- Allow disabling AI summaries

### Risk 3: Gmail App Password Setup
**Impact:** LOW
**Probability:** HIGH (users struggle with setup)
**Mitigation:**
- Detailed setup guide with screenshots
- Common issues documented
- Test with various Gmail accounts
- Provide example .env

### Risk 4: Email Parsing Failures
**Impact:** MEDIUM
**Probability:** MEDIUM
**Mitigation:**
- Handle HTML/text gracefully
- Catch parsing errors
- Log failures for debugging
- Fallback to raw content

---

## 📝 Testing Plan

### Unit Tests
- [ ] IMAP connection
- [ ] Email parsing (HTML)
- [ ] Email parsing (text)
- [ ] Priority calculation
- [ ] OpenAI summarization
- [ ] Database storage

### Integration Tests
- [ ] Fetch → Parse → Store flow
- [ ] Fetch → Summarize → Display flow
- [ ] Priority detection accuracy
- [ ] API endpoint responses

### Manual Tests
- [ ] Connect to real Gmail
- [ ] Fetch 100 emails
- [ ] Review summaries for accuracy
- [ ] Test with different email types
- [ ] Test UI display

---

## 📚 Documentation Updates

### New Documents
- [ ] `docs/GMAIL_SETUP.md` - Gmail configuration guide
- [ ] `docs/EMAIL_INTEGRATION.md` - Technical details
- [ ] `planning/phase_2_behaviour/WEEK1_COMPLETE.md` - Completion report

### Updated Documents
- [ ] `PROGRESS.md` - Week 1 status
- [ ] `README.md` - Email features
- [ ] `.env.example` - Gmail/OpenAI config
- [ ] `requirements.txt` - Any new dependencies

---

## 🎯 End-of-Week Demo

**Demo Script:**
```
1. Start system: ./scripts/start.sh

2. Open chat UI: http://localhost:8501

3. Say: "Check my email"

4. Sharon responds:
   📧 Email Summary (Last 24 hours)

   HIGH PRIORITY (2):
   • Sarah Chen - Q4 Budget Review
     Summary: Sarah needs your approval on Q4 budget by Friday.
     Action: Review budget document

   • IT Security - Password Reset Required
     Summary: Security policy requires password update within 24 hours.
     Action: Reset password

   MEDIUM (5):
   • Team Standup Notes - Daily sync summary
   • Project Update - John's weekly progress
   ...

   LOW (8):
   • LinkedIn - New connection requests
   • Amazon - Order shipped
   ...

5. Say: "Show high priority emails only"

6. Sharon shows just the 2 critical emails with full summaries

7. Demo complete! 🎉
```

---

## ⏱️ Time Estimate

**Total:** 10-13 hours

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Gmail IMAP Setup | 1-2 hours | HIGH |
| Email Fetching | 2-3 hours | HIGH |
| OpenAI Integration | 2-3 hours | HIGH |
| Priority Detection | 1-2 hours | MEDIUM |
| Enhanced API | 1 hour | MEDIUM |
| UI Integration | 1-2 hours | MEDIUM |
| Testing & Docs | 1-2 hours | HIGH |

**Realistic Schedule:** 2-3 days if working focused time

---

## 📅 Daily Breakdown

### Day 1 (Nov 7)
- Morning: Tasks 1-2 (Gmail setup + Fetching)
- Afternoon: Task 3 (OpenAI integration)
- Evening: Test basic flow

### Day 2 (Nov 8)
- Morning: Task 4 (Priority detection)
- Afternoon: Task 5 (Enhanced API)
- Evening: Task 6 (UI integration)

### Day 3 (Nov 9)
- Morning: Task 7 (Testing)
- Afternoon: Documentation
- Evening: Demo preparation & celebration!

---

## ✅ Definition of Done

Week 1 is complete when:
- [ ] Can connect to Gmail IMAP
- [ ] Can fetch 100 emails
- [ ] OpenAI summarizes emails accurately
- [ ] Priority detection works (80%+ accuracy)
- [ ] Enhanced API endpoint working
- [ ] UI displays rich summaries
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Demo successful

---

**Let's build real email intelligence!** 🚀
