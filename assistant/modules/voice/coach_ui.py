"""
Prompt Coach UI Components
==========================
Streamlit UI for the prompt coaching flow.
"""

import streamlit as st
from typing import Optional

# Import from prompt_coach module
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from assistant.modules.prompt_coach.extractor import extract_template
from assistant.modules.prompt_coach.interrogator import generate_questions
from assistant.modules.prompt_coach.critic import generate_critique
from assistant.modules.prompt_coach.database import save_session, get_saved_sessions
from assistant.modules.prompt_coach.models import SectionStatus


def render_coach_tab():
    """Main entry point for the Coach tab"""
    st.subheader("🎓 Prompt Coach")
    st.caption("Transform messy prompts into well-structured ones")

    # Initialize session state for coach
    if "coach_stage" not in st.session_state:
        st.session_state.coach_stage = "input"
    if "coach_template" not in st.session_state:
        st.session_state.coach_template = None
    if "coach_questions" not in st.session_state:
        st.session_state.coach_questions = []
    if "coach_original" not in st.session_state:
        st.session_state.coach_original = ""
    if "coach_critique" not in st.session_state:
        st.session_state.coach_critique = None

    # Render based on current stage
    stage = st.session_state.coach_stage

    if stage == "input":
        _render_input_stage()
    elif stage == "questions":
        _render_questions_stage()
    elif stage == "result":
        _render_result_stage()

    # Show saved prompts in expander
    with st.expander("📚 Saved Prompts", expanded=False):
        _render_saved_prompts()


def _render_input_stage():
    """Stage 1: User enters brain-dump prompt"""
    st.markdown("**Paste your messy prompt below:**")

    brain_dump = st.text_area(
        "Your prompt",
        height=150,
        placeholder="e.g., help me write code for a thing that does stuff with files...",
        key="coach_input",
    )

    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🚀 Analyze", type="primary", disabled=not brain_dump):
            with st.spinner("Analyzing your prompt..."):
                # Extract template
                template = extract_template(brain_dump)
                st.session_state.coach_template = template
                st.session_state.coach_original = brain_dump

                # Generate questions
                questions = generate_questions(template)
                st.session_state.coach_questions = questions

                if questions:
                    st.session_state.coach_stage = "questions"
                else:
                    # No questions needed, go straight to result
                    critique = generate_critique(brain_dump, template)
                    st.session_state.coach_critique = critique
                    st.session_state.coach_stage = "result"

                st.rerun()


def _render_questions_stage():
    """Stage 2: Ask clarifying questions"""
    template = st.session_state.coach_template
    questions = st.session_state.coach_questions

    # Show current template status
    st.markdown("**Template Status:**")
    _render_template_status(template)

    st.divider()

    # Show questions
    st.markdown(f"**I have {len(questions)} questions to fill the gaps:**")

    answers = {}
    for q in questions:
        section_label = q.section.replace("_", " ").title()
        answers[q.id] = st.text_input(
            f"[{section_label}] {q.question}",
            key=f"coach_answer_{q.id}",
        )

    col1, col2, col3 = st.columns([1, 1, 3])
    with col1:
        if st.button("✅ Submit Answers", type="primary"):
            # Combine original with answers
            combined = st.session_state.coach_original + "\n\nAdditional context:\n"
            for q in questions:
                if answers.get(q.id):
                    combined += f"Q: {q.question}\nA: {answers[q.id]}\n\n"

            with st.spinner("Processing your answers..."):
                # Re-extract with new context
                template = extract_template(combined)
                st.session_state.coach_template = template

                # Check for more questions
                new_questions = generate_questions(template)

                if new_questions and len(new_questions) > 0:
                    st.session_state.coach_questions = new_questions
                else:
                    # Generate critique and finish
                    critique = generate_critique(st.session_state.coach_original, template)
                    st.session_state.coach_critique = critique
                    st.session_state.coach_stage = "result"

                st.rerun()

    with col2:
        if st.button("⏭️ Skip & Finish"):
            with st.spinner("Generating critique..."):
                critique = generate_critique(st.session_state.coach_original, template)
                st.session_state.coach_critique = critique
                st.session_state.coach_stage = "result"
                st.rerun()


def _render_result_stage():
    """Stage 3: Show final prompt and critique"""
    template = st.session_state.coach_template
    critique = st.session_state.coach_critique
    original = st.session_state.coach_original

    # Build final prompt
    final_prompt = _build_final_prompt(template)

    # Score display
    score = critique.overall_score if critique else 5
    score_color = "🟢" if score >= 7 else "🟡" if score >= 4 else "🔴"
    st.markdown(f"### {score_color} Score: {score}/10")

    # Tabs for different views
    tab1, tab2, tab3 = st.tabs(["📝 Final Prompt", "📊 Critique", "📚 Lessons"])

    with tab1:
        st.markdown("**Your improved prompt:**")
        st.code(final_prompt, language="markdown")

        if st.button("📋 Copy to Clipboard"):
            st.write("```\n" + final_prompt + "\n```")
            st.success("Copied! (Use Cmd+C on the code block above)")

    with tab2:
        if critique:
            st.markdown("**Strengths:**")
            for s in critique.strengths:
                st.markdown(f"✅ {s}")

            st.markdown("**Weaknesses:**")
            for w in critique.weaknesses:
                st.markdown(f"⚠️ {w}")

    with tab3:
        if critique and critique.lessons:
            for lesson in critique.lessons:
                with st.expander(f"📖 {lesson.title}"):
                    st.markdown(lesson.explanation)
                    if lesson.example_before:
                        st.markdown("**Before:**")
                        st.code(lesson.example_before)
                    if lesson.example_after:
                        st.markdown("**After:**")
                        st.code(lesson.example_after)

    st.divider()

    # Actions
    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        template_name = st.text_input("Name (optional)", placeholder="e.g., Code Review Prompt")

    with col2:
        st.write("")  # Spacer
        st.write("")
        if st.button("💾 Save to Library"):
            lessons = [l.title for l in critique.lessons] if critique else []
            save_session(
                original_prompt=original,
                final_prompt=final_prompt,
                overall_score=score,
                lessons=lessons,
                template_name=template_name if template_name else None,
            )
            st.success("✅ Saved!")

    with col3:
        st.write("")
        st.write("")
        if st.button("🔄 Start New"):
            _reset_coach_state()
            st.rerun()


def _render_template_status(template):
    """Show template sections with status indicators"""
    sections = [
        ("Context", template.context),
        ("Constraints", template.constraints),
        ("Inputs", template.inputs),
        ("Task", template.task),
        ("Evaluation", template.evaluation),
        ("Output Format", template.output_format),
    ]

    cols = st.columns(6)
    for i, (name, section) in enumerate(sections):
        with cols[i]:
            if section.status == SectionStatus.FILLED:
                st.markdown(f"✅ {name}")
            elif section.status == SectionStatus.UNCLEAR:
                st.markdown(f"🟡 {name}")
            else:
                st.markdown(f"❌ {name}")


def _render_saved_prompts():
    """Show previously saved prompts"""
    sessions = get_saved_sessions(limit=10)

    if not sessions:
        st.info("No saved prompts yet. Complete a coaching session to save one!")
        return

    for session in sessions:
        name = session.get("template_name") or "Unnamed"
        score = session.get("overall_score", "?")
        created = str(session.get("created_at", ""))[:10]

        with st.expander(f"📄 {name} ({score}/10) - {created}"):
            st.markdown("**Final Prompt:**")
            st.code(session.get("final_prompt", ""), language="markdown")

            if session.get("lessons"):
                st.markdown("**Lessons:**")
                for lesson in session["lessons"]:
                    st.markdown(f"- {lesson}")


def _build_final_prompt(template) -> str:
    """Build the final prompt string from template sections"""
    sections = []

    if template.context.content:
        sections.append(f"## CONTEXT\n{template.context.content}")
    if template.constraints.content:
        sections.append(f"## CONSTRAINTS\n{template.constraints.content}")
    if template.inputs.content:
        sections.append(f"## INPUTS\n{template.inputs.content}")
    if template.task.content:
        sections.append(f"## TASK\n{template.task.content}")
    if template.evaluation.content:
        sections.append(f"## EVALUATION\n{template.evaluation.content}")
    if template.output_format.content:
        sections.append(f"## OUTPUT FORMAT\n{template.output_format.content}")

    return "\n\n".join(sections) if sections else "No content extracted"


def _reset_coach_state():
    """Reset all coach session state"""
    st.session_state.coach_stage = "input"
    st.session_state.coach_template = None
    st.session_state.coach_questions = []
    st.session_state.coach_original = ""
    st.session_state.coach_critique = None
