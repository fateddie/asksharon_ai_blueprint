"""
Fitness UI (Phase 4.5+)
=======================
Streamlit UI for intelligent workout generation, goal tracking, and progress.

5-Tab Structure:
1. Dashboard - Weekly plan, goal progress, calendar preview
2. Today's Workout - Generated workout with justification
3. Goals - Add/edit goals, milestones, progress tracking
4. Assessment - Monthly fitness tests, progress vs targets
5. Setup - Profile, equipment, focus areas, external activities
"""

import streamlit as st
from datetime import datetime, date, timedelta
import time

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from assistant.modules.fitness.workout_session import (
    get_exercises,
    get_exercise_by_name,
    get_workout_templates,
    get_workout_template,
    start_workout_session,
    end_workout_session,
    cancel_workout_session,
    log_exercise_set,
    get_session_logs,
    get_active_session,
    get_recent_sessions,
    get_weekly_stats,
    suggest_adjustment,
    RPE_GUIDELINES,
    pause_workout_session,
    resume_workout_session,
)

# Phase 4.5+ imports
from assistant.modules.fitness.workout_generator import (
    generate_workout,
    generate_weekly_plan,
    get_todays_workout,
)
from assistant.modules.fitness.workout_justification import (
    get_training_science_article,
    list_available_topics,
)
from assistant.modules.fitness.training_intelligence import (
    get_all_goal_categories,
    create_goal_with_intelligence,
    get_goal_milestones,
    get_periodization_state,
    initialize_periodization,
    add_recurring_activity,
    get_recurring_activities,
    delete_external_activity,
    get_training_adjustment_for_day,
    ACTIVITY_LOAD_SCORES,
)
from assistant.modules.fitness.goals import (
    get_active_goals,
    get_goal,
    update_goal_progress,
    pause_goal,
    resume_goal,
    abandon_goal,
)
from assistant.modules.fitness.user_profile import (
    get_user_profile,
    save_user_profile,
    update_weight,
)
from assistant.modules.fitness.assessment import (
    save_assessment,
    get_latest_assessment,
    get_assessment_history,
    get_test_instructions,
)
from assistant.modules.fitness.equipment import (
    get_equipment_types,
    get_user_equipment,
    set_equipment_list,
)

# Custom CSS
FITNESS_CSS = """
<style>
.fitness-header {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    padding: 1.5rem;
    border-radius: 10px;
    color: white;
    margin-bottom: 1rem;
}
.workout-card {
    background: #fff7ed;
    border: 1px solid #fdba74;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    color: #1f2937;
}
.exercise-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    color: #1f2937;
}
.exercise-active {
    background: #fef3c7;
    border-color: #fcd34d;
}
.timer-display {
    font-size: 3rem;
    font-weight: bold;
    font-family: monospace;
    text-align: center;
    padding: 1rem;
    background: #1f2937;
    color: #22c55e;
    border-radius: 8px;
    margin: 1rem 0;
}
.timer-rest {
    background: #065f46;
    color: #a7f3d0;
}
.stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: #1f2937;
}
.stat-number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f97316;
}
.rpe-scale {
    display: flex;
    gap: 0.25rem;
    margin: 0.5rem 0;
}
.rpe-item {
    flex: 1;
    text-align: center;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
}
.set-log {
    background: #f0fdf4;
    border-left: 3px solid #22c55e;
    padding: 0.5rem;
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #1f2937;
}
</style>
"""


def render_fitness_tab():
    """Main entry point for fitness tab with 5-tab structure."""
    st.markdown(FITNESS_CSS, unsafe_allow_html=True)

    # Header
    st.markdown(
        """<div class="fitness-header">
        <h2 style="margin:0;">Intelligent Fitness Coach</h2>
        <p style="margin:0.5rem 0 0 0; opacity:0.9;">Personalized, science-backed training</p>
        </div>""",
        unsafe_allow_html=True,
    )

    # Check for active session - show continue button
    active = get_active_session()
    if active:
        st.info(f"🏋️ Workout in progress: {active['template_name'] or 'Custom'}")
        if st.button("Continue Workout", type="primary", use_container_width=True):
            st.session_state.fitness_view = "workout"

    # 5-Tab Navigation
    tab1, tab2, tab3, tab4, tab5 = st.tabs(
        ["📊 Dashboard", "💪 Today's Workout", "🎯 Goals", "📈 Assessment", "⚙️ Setup"]
    )

    with tab1:
        _render_dashboard_tab()

    with tab2:
        _render_todays_workout_tab()

    with tab3:
        _render_goals_tab()

    with tab4:
        _render_assessment_tab()

    with tab5:
        _render_setup_tab()


def _render_dashboard_tab():
    """Render dashboard with weekly plan, goal progress, calendar preview."""
    st.subheader("This Week's Training")

    # Periodization status
    period_state = get_periodization_state()
    if period_state:
        phase = period_state["current_phase"]
        week = period_state["current_week"]
        phase_info = period_state.get("phase_info", {})
        st.markdown(
            f"""<div class="workout-card">
            <strong>📅 {phase.title()} Phase</strong> - Week {week}<br>
            <small>{phase_info.get('description', '')}</small><br>
            <small>Volume: {phase_info.get('volume', 'normal')} | Intensity: {phase_info.get('intensity', 'moderate')}</small>
            </div>""",
            unsafe_allow_html=True,
        )
    else:
        if st.button("Initialize Training Plan"):
            initialize_periodization()
            st.rerun()

    # Weekly stats
    stats = get_weekly_stats()
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Workouts", stats["sessions"])
    with col2:
        st.metric("Minutes", stats["total_minutes"])
    with col3:
        st.metric("Sets", stats["total_sets"])
    with col4:
        st.metric("Avg RPE", stats["avg_rpe"] or "-")

    # Goal progress summary
    st.markdown("---")
    st.subheader("Goal Progress")
    goals = get_active_goals()
    if goals:
        for goal in goals[:3]:
            progress = goal.get("progress_pct", 0)
            st.markdown(f"**{goal['title']}**")
            st.progress(min(progress / 100, 1.0))
            st.caption(f"{progress:.0f}% complete")
    else:
        st.info("No active goals. Add some in the Goals tab!")

    # External activities preview
    st.markdown("---")
    st.subheader("This Week's Activities")
    recurring = get_recurring_activities()
    if recurring:
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for activity in recurring:
            day = days[activity["day_of_week"]] if activity["day_of_week"] is not None else "?"
            st.markdown(f"• **{day}**: {activity['name']} (load: {activity['load_score']})")
    else:
        st.caption("No external activities configured. Add them in Setup.")

    # Recent workouts
    st.markdown("---")
    st.subheader("Recent Workouts")
    sessions = get_recent_sessions(5)
    if sessions:
        for session in sessions[:3]:
            status_emoji = {"completed": "✅", "cancelled": "❌", "in_progress": "🏃"}.get(
                session["status"], "📝"
            )
            st.markdown(
                f"""<div class="workout-card">
                {status_emoji} <strong>{session['template_name'] or 'Custom'}</strong><br>
                <small>{session['started_at'][:10]} • {session['duration_minutes'] or '?'} min</small>
                </div>""",
                unsafe_allow_html=True,
            )
    else:
        st.info("No recent workouts yet.")


def _render_dashboard():
    """Render fitness dashboard with stats."""
    st.subheader("This Week's Progress")

    stats = get_weekly_stats()

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            f"""<div class="stat-card">
            <div class="stat-number">{stats['sessions']}</div>
            <div>Workouts</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""<div class="stat-card">
            <div class="stat-number">{stats['total_minutes']}</div>
            <div>Minutes</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""<div class="stat-card">
            <div class="stat-number">{stats['total_sets']}</div>
            <div>Sets</div>
            </div>""",
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            f"""<div class="stat-card">
            <div class="stat-number">{stats['avg_rpe'] or '-'}</div>
            <div>Avg RPE</div>
            </div>""",
            unsafe_allow_html=True,
        )

    if stats["top_muscle_group"]:
        st.markdown(f"**Most trained:** {stats['top_muscle_group'].replace('_', ' ').title()}")

    # Recent sessions
    st.markdown("---")
    st.subheader("Recent Workouts")

    sessions = get_recent_sessions(7)
    if sessions:
        for session in sessions[:5]:
            status_emoji = {"completed": "", "cancelled": "", "in_progress": ""}.get(
                session["status"], ""
            )
            st.markdown(
                f"""<div class="workout-card">
                <strong>{status_emoji} {session['template_name']}</strong><br>
                <small>{session['started_at'][:10]} • {session['duration_minutes'] or '?'} min
                {f" • RPE {session['overall_rpe']}" if session['overall_rpe'] else ""}</small>
                </div>""",
                unsafe_allow_html=True,
            )
    else:
        st.info("No recent workouts. Start your first one!")


def _render_start_workout():
    """Render workout template selection."""
    st.subheader("Start a Workout")

    templates = get_workout_templates()

    if templates:
        st.markdown("**Choose a template:**")
        for template in templates:
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(
                    f"""<div class="workout-card">
                    <strong>{template['name']}</strong><br>
                    <small>{template['description']}</small><br>
                    <small>{template['duration_minutes']} min • {template['difficulty']}</small>
                    </div>""",
                    unsafe_allow_html=True,
                )
            with col2:
                if st.button("Start", key=f"start_{template['id']}", use_container_width=True):
                    session_id = start_workout_session(template["id"])
                    st.session_state.active_session_id = session_id
                    st.session_state.current_exercise_idx = 0
                    st.session_state.current_set = 1
                    st.session_state.fitness_view = "workout"
                    st.rerun()

    st.markdown("---")
    st.markdown("**Or start a custom workout:**")
    if st.button("Start Custom Workout", use_container_width=True):
        session_id = start_workout_session()
        st.session_state.active_session_id = session_id
        st.session_state.fitness_view = "workout"
        st.rerun()


def _render_active_workout():
    """Render active workout session."""
    active = get_active_session()

    if not active:
        st.warning("No active workout session.")
        st.session_state.fitness_view = "dashboard"
        st.rerun()
        return

    session_id = active["id"]
    template = None
    exercises_plan = []

    if active["template_id"]:
        template = get_workout_template(active["template_id"])
        if template:
            exercises_plan = template.get("exercises", [])

    # Session header
    st.markdown(f"### {active['template_name'] or 'Custom Workout'}")
    st.markdown(f"**Elapsed:** {active['elapsed_minutes']:.0f} minutes")

    # Get logged sets
    logs = get_session_logs(session_id)

    # Guided workout view
    if exercises_plan:
        _render_guided_workout(session_id, exercises_plan, logs)
    else:
        _render_free_workout(session_id, logs)

    # End/Cancel buttons
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("End Workout", type="primary", use_container_width=True):
            st.session_state.show_end_form = True
    with col2:
        if st.button("Cancel Workout", use_container_width=True):
            cancel_workout_session(session_id)
            st.session_state.fitness_view = "dashboard"
            st.rerun()

    # End workout form
    if st.session_state.get("show_end_form"):
        with st.form("end_workout_form"):
            st.markdown("**Rate your workout:**")
            rpe = st.slider("Overall RPE (1-10)", 1, 10, 7)
            st.caption(RPE_GUIDELINES.get(rpe, ""))
            notes = st.text_area("Notes (optional)", height=80)

            if st.form_submit_button("Complete Workout"):
                end_workout_session(session_id, rpe, notes)
                suggestion = suggest_adjustment(rpe)
                st.success(f"Workout complete! {suggestion}")
                st.session_state.show_end_form = False
                st.session_state.fitness_view = "dashboard"
                time.sleep(2)
                st.rerun()


def _render_guided_workout(session_id: int, exercises_plan: list, logs: list):
    """Render guided workout with exercise list and timer."""

    # Initialize state
    if "current_exercise_idx" not in st.session_state:
        st.session_state.current_exercise_idx = 0
    if "current_set" not in st.session_state:
        st.session_state.current_set = 1

    # Current exercise
    idx = st.session_state.current_exercise_idx
    if idx >= len(exercises_plan):
        st.success("All exercises complete!")
        return

    current = exercises_plan[idx]
    exercise_data = get_exercise_by_name(current["exercise"])

    # Progress indicator
    st.progress((idx + 1) / len(exercises_plan))
    st.markdown(f"**Exercise {idx + 1} of {len(exercises_plan)}**")

    # Current exercise display
    st.markdown(
        f"""<div class="exercise-card exercise-active">
        <h3 style="margin:0;">{current['exercise']}</h3>
        <p style="margin:0.5rem 0;">
            {"Sets: " + str(current.get('sets', 1)) + " • " if current.get('sets') else ""}
            {"Reps: " + str(current.get('reps')) if current.get('reps') else ""}
            {"Duration: " + str(current.get('duration')) + "s" if current.get('duration') else ""}
        </p>
        <small>Rest: {current.get('rest', 30)}s between sets</small>
        </div>""",
        unsafe_allow_html=True,
    )

    # Set tracker
    total_sets = current.get("sets", 1)
    current_set = st.session_state.current_set

    st.markdown(f"**Set {current_set} of {total_sets}**")

    # Log set form
    with st.form(f"log_set_{idx}_{current_set}"):
        col1, col2 = st.columns(2)
        with col1:
            if current.get("reps"):
                reps = st.number_input("Reps completed", min_value=0, value=current.get("reps", 10))
            else:
                reps = None
        with col2:
            rpe = st.slider("RPE", 1, 10, 7)

        if st.form_submit_button("Log Set", use_container_width=True):
            if exercise_data:
                log_exercise_set(
                    session_id=session_id,
                    exercise_id=exercise_data["id"],
                    set_number=current_set,
                    reps=reps,
                    duration_seconds=current.get("duration"),
                    rpe=rpe,
                )

                if current_set >= total_sets:
                    st.session_state.current_exercise_idx += 1
                    st.session_state.current_set = 1
                else:
                    st.session_state.current_set += 1

                st.rerun()

    # Show completed sets
    exercise_logs = [
        log for log in logs if exercise_data and log["exercise_id"] == exercise_data["id"]
    ]
    if exercise_logs:
        st.markdown("**Completed sets:**")
        for log in exercise_logs:
            st.markdown(
                f"""<div class="set-log">
                Set {log['set_number']}: {log['reps'] or '-'} reps @ RPE {log['rpe'] or '-'}
                </div>""",
                unsafe_allow_html=True,
            )


def _render_free_workout(session_id: int, logs: list):
    """Render free-form workout logging."""
    st.subheader("Log Your Exercises")

    exercises = get_exercises()
    exercise_options = {ex["name"]: ex["id"] for ex in exercises}

    with st.form("log_exercise"):
        exercise_name = st.selectbox("Exercise", options=list(exercise_options.keys()))
        col1, col2, col3 = st.columns(3)
        with col1:
            set_number = st.number_input("Set #", min_value=1, value=1)
        with col2:
            reps = st.number_input("Reps", min_value=0, value=10)
        with col3:
            rpe = st.slider("RPE", 1, 10, 7)

        if st.form_submit_button("Log Set"):
            exercise_id = exercise_options[exercise_name]
            log_exercise_set(
                session_id=session_id,
                exercise_id=exercise_id,
                set_number=set_number,
                reps=reps,
                rpe=rpe,
            )
            st.success("Set logged!")
            st.rerun()

    # Show logged exercises
    if logs:
        st.markdown("---")
        st.markdown("**Logged sets:**")
        for log in logs:
            st.markdown(
                f"""<div class="set-log">
                {log['exercise_name']} - Set {log['set_number']}: {log['reps'] or '-'} reps @ RPE {log['rpe'] or '-'}
                </div>""",
                unsafe_allow_html=True,
            )


def _render_exercises():
    """Render exercise library."""
    st.subheader("Exercise Library")

    exercises = get_exercises()

    # Group by category
    categories = {}
    for ex in exercises:
        cat = ex["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(ex)

    for category, exs in sorted(categories.items()):
        with st.expander(f"{category.title()} ({len(exs)} exercises)"):
            for ex in exs:
                st.markdown(
                    f"""<div class="exercise-card">
                    <strong>{ex['name']}</strong><br>
                    <small>{ex['muscle_group'].replace('_', ' ').title()} • {ex['equipment']}</small><br>
                    <small style="color:#6b7280;">{ex['description']}</small>
                    </div>""",
                    unsafe_allow_html=True,
                )


# =============================================================================
# PHASE 4.5+ TAB RENDERS
# =============================================================================


def _render_todays_workout_tab():
    """Render today's generated workout with justification."""
    st.subheader("Today's Workout")

    # Get training adjustment for today
    adjustment = get_training_adjustment_for_day(date.today())

    # Show workout type recommendation
    workout_type = adjustment["workout_type"]
    if workout_type == "rest":
        st.warning("🛋️ **Rest Day Recommended**")
        for rec in adjustment["recommendations"]:
            st.markdown(f"• {rec}")
        st.markdown("---")
        st.markdown("**Recovery Tips:**")
        st.markdown("• Focus on sleep (7-9 hours)")
        st.markdown("• Light walking is fine")
        st.markdown("• Foam rolling or stretching optional")
        return

    if workout_type == "mobility":
        st.info("🧘 **Mobility Focus Today**")
        for rec in adjustment["recommendations"]:
            st.markdown(f"• {rec}")

    # Generate or get workout
    workout = get_todays_workout()

    if not workout:
        if st.button("Generate Today's Workout", type="primary"):
            workout = generate_workout()
            st.rerun()
        return

    # Display workout
    st.markdown(
        f"""<div class="workout-card">
        <strong>📋 {workout.get('workout_type', 'Training').title()} Session</strong><br>
        <small>Est. {workout.get('estimated_duration_min', 30)} min • {workout.get('total_sets', 0)} sets</small>
        </div>""",
        unsafe_allow_html=True,
    )

    # Brief justification (always shown)
    st.markdown(f"**Why this workout:** {workout.get('brief_justification', 'Balanced training')}")

    # Detailed justification (expandable)
    with st.expander("📚 Learn More - Training Science"):
        topics = list_available_topics()
        for topic in topics[:5]:
            article = get_training_science_article(topic)
            if article:
                st.markdown(f"**{topic.replace('_', ' ').title()}**")
                st.markdown(article.get("brief", ""))
                st.caption(f"Timeline: {article.get('expected_timeline', 'Varies')}")
                st.markdown("---")

    # Exercise list
    st.markdown("---")
    st.subheader("Exercises")

    exercises = workout.get("exercises", [])
    if exercises:
        for i, ex in enumerate(exercises, 1):
            st.markdown(
                f"""<div class="exercise-card">
                <strong>{i}. {ex.get('name', 'Exercise')}</strong><br>
                <small>{ex.get('sets', 3)} sets × {ex.get('reps', '8-12')} reps • Rest {ex.get('rest_sec', 60)}s</small><br>
                <small style="color:#6b7280;">{ex.get('movement_pattern', '').replace('_', ' ').title()}</small>
                </div>""",
                unsafe_allow_html=True,
            )
    else:
        st.info("Rest day or mobility focus - no structured exercises.")

    # Start workout button
    st.markdown("---")
    if st.button("Start This Workout", type="primary", use_container_width=True):
        session_id = start_workout_session()
        st.session_state.active_session_id = session_id
        st.session_state.fitness_view = "workout"
        st.success("Workout started!")


def _render_goals_tab():
    """Render goals management with intelligent features."""
    st.subheader("Your Fitness Goals")

    # Add new goal
    with st.expander("➕ Add New Goal", expanded=False):
        with st.form("new_goal_form"):
            title = st.text_input("Goal Title", placeholder="e.g., Increase vertical jump to dunk")
            description = st.text_area("Description (optional)", height=60)

            col1, col2 = st.columns(2)
            with col1:
                target_value = st.number_input("Target Value", min_value=1, value=10)
            with col2:
                target_unit = st.text_input("Unit", value="reps")

            col3, col4 = st.columns(2)
            with col3:
                start_value = st.number_input("Starting Value", min_value=0, value=0)
            with col4:
                deadline = st.date_input("Target Date", value=date.today() + timedelta(days=90))

            # Goal type selection
            categories = get_all_goal_categories()
            goal_type = st.selectbox(
                "Goal Type",
                options=["strength", "endurance", "consistency", "skill", "body_composition"],
            )

            auto_milestones = st.checkbox("Auto-generate milestones", value=True)

            if st.form_submit_button("Create Goal"):
                result = create_goal_with_intelligence(
                    goal_type=goal_type,
                    title=title,
                    target_value=target_value,
                    target_unit=target_unit,
                    start_value=start_value,
                    description=description,
                    deadline=deadline,
                    auto_milestones=auto_milestones,
                )
                st.success(f"Goal created! Category detected: {result['detected_category']}")
                if result.get("milestones"):
                    st.info(f"Generated {len(result['milestones'])} milestones")
                st.rerun()

    # Display active goals
    goals = get_active_goals()

    if goals:
        for goal in goals:
            progress = goal.get("progress_pct", 0)

            with st.expander(f"🎯 {goal['title']} ({progress:.0f}%)", expanded=True):
                st.progress(min(progress / 100, 1.0))

                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric(
                        "Current", f"{goal.get('current_value', 0)} {goal.get('target_unit', '')}"
                    )
                with col2:
                    st.metric(
                        "Target", f"{goal.get('target_value', 0)} {goal.get('target_unit', '')}"
                    )
                with col3:
                    if goal.get("deadline"):
                        days_left = (
                            datetime.fromisoformat(goal["deadline"]).date() - date.today()
                        ).days
                        st.metric("Days Left", days_left)

                # Milestones
                milestones = get_goal_milestones(goal["id"])
                if milestones:
                    st.markdown("**Milestones:**")
                    for m in milestones:
                        status_icon = "✅" if m["status"] == "achieved" else "⏳"
                        st.markdown(f"{status_icon} {m['description']} ({m['value']})")

                # Update progress
                st.markdown("---")
                col1, col2 = st.columns([2, 1])
                with col1:
                    new_value = st.number_input(
                        "Update Progress",
                        min_value=0.0,
                        value=float(goal.get("current_value", 0)),
                        key=f"progress_{goal['id']}",
                    )
                with col2:
                    if st.button("Update", key=f"update_{goal['id']}"):
                        update_goal_progress(goal["id"], new_value)
                        st.success("Progress updated!")
                        st.rerun()

                # Goal actions
                col1, col2, col3 = st.columns(3)
                with col1:
                    if goal["status"] == "active":
                        if st.button("Pause", key=f"pause_{goal['id']}"):
                            pause_goal(goal["id"])
                            st.rerun()
                    else:
                        if st.button("Resume", key=f"resume_{goal['id']}"):
                            resume_goal(goal["id"])
                            st.rerun()
                with col3:
                    if st.button("Abandon", key=f"abandon_{goal['id']}"):
                        abandon_goal(goal["id"])
                        st.rerun()
    else:
        st.info("No active goals. Create one above to get personalized training!")


def _render_assessment_tab():
    """Render fitness assessment and progress tracking."""
    st.subheader("Fitness Assessment")

    # Latest assessment
    latest = get_latest_assessment()

    if latest:
        st.markdown(
            f"""<div class="workout-card">
            <strong>Latest Assessment:</strong> {latest.get('assessment_date', 'N/A')}<br>
            <small>Fitness Level: {latest.get('fitness_level', 'N/A').title()}</small>
            </div>""",
            unsafe_allow_html=True,
        )

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Push-ups", latest.get("push_up_max", "-"))
        with col2:
            st.metric("Plank (sec)", latest.get("plank_hold_seconds", "-"))
        with col3:
            st.metric("Squats (60s)", latest.get("squat_60s_count", "-"))

    # New assessment
    st.markdown("---")
    with st.expander("📝 Record New Assessment", expanded=not latest):
        st.markdown("Complete these tests to track your fitness progress:")

        # Test instructions
        for test in ["push_up_max", "plank_hold_seconds", "squat_60s_count"]:
            instructions = get_test_instructions(test)
            with st.expander(f"📖 {instructions.get('name', test)} - How to Test"):
                st.markdown(instructions.get("instructions", ""))
                if instructions.get("tips"):
                    st.caption(f"Tips: {instructions['tips']}")

        with st.form("assessment_form"):
            col1, col2 = st.columns(2)
            with col1:
                push_ups = st.number_input("Push-up Max", min_value=0, value=0)
                plank = st.number_input("Plank Hold (seconds)", min_value=0, value=0)
            with col2:
                squats = st.number_input("Squats in 60s", min_value=0, value=0)
                wall_sit = st.number_input("Wall Sit (seconds)", min_value=0, value=0)

            resting_hr = st.number_input("Resting Heart Rate (optional)", min_value=0, value=0)
            notes = st.text_area("Notes", height=60)

            if st.form_submit_button("Save Assessment"):
                save_assessment(
                    push_up_max=push_ups if push_ups > 0 else None,
                    plank_hold_seconds=plank if plank > 0 else None,
                    squat_60s_count=squats if squats > 0 else None,
                    wall_sit_seconds=wall_sit if wall_sit > 0 else None,
                    resting_heart_rate=resting_hr if resting_hr > 0 else None,
                    notes=notes if notes else None,
                )
                st.success("Assessment saved!")
                st.rerun()

    # History
    st.markdown("---")
    st.subheader("Assessment History")
    history = get_assessment_history(5)
    if history:
        for assessment in history:
            st.markdown(
                f"""<div class="exercise-card">
                <strong>{assessment.get('assessment_date', 'N/A')}</strong> -
                {assessment.get('fitness_level', 'N/A').title()}<br>
                <small>Push-ups: {assessment.get('push_up_max', '-')} |
                Plank: {assessment.get('plank_hold_seconds', '-')}s |
                Squats: {assessment.get('squat_60s_count', '-')}</small>
                </div>""",
                unsafe_allow_html=True,
            )
    else:
        st.info("No assessment history yet.")


def _render_setup_tab():
    """Render setup for profile, equipment, and external activities."""
    st.subheader("Setup & Configuration")

    # Profile section
    with st.expander("👤 Profile", expanded=True):
        profile = get_user_profile()

        with st.form("profile_form"):
            col1, col2 = st.columns(2)
            with col1:
                height = st.number_input(
                    "Height (cm)",
                    min_value=100,
                    max_value=250,
                    value=profile.get("height_cm", 170) if profile else 170,
                )
                weight = st.number_input(
                    "Weight (kg)",
                    min_value=30.0,
                    max_value=300.0,
                    value=float(profile.get("weight_kg", 70)) if profile else 70.0,
                )
            with col2:
                age = st.number_input(
                    "Age",
                    min_value=10,
                    max_value=100,
                    value=profile.get("age", 30) if profile else 30,
                )
                gender = st.selectbox(
                    "Gender",
                    options=["male", "female", "other"],
                    index=(
                        ["male", "female", "other"].index(profile.get("gender", "male"))
                        if profile
                        else 0
                    ),
                )

            experience = st.selectbox(
                "Experience Level",
                options=["beginner", "intermediate", "advanced"],
                index=(
                    ["beginner", "intermediate", "advanced"].index(
                        profile.get("experience_level", "intermediate")
                    )
                    if profile
                    else 1
                ),
            )

            if st.form_submit_button("Save Profile"):
                save_user_profile(
                    height_cm=height,
                    weight_kg=weight,
                    age=age,
                    gender=gender,
                    experience_level=experience,
                )
                st.success("Profile saved!")
                st.rerun()

    # Equipment section
    with st.expander("🏋️ Equipment", expanded=False):
        current_equipment = get_user_equipment()
        current_types = [e["equipment_type"] for e in current_equipment]
        all_types = get_equipment_types()

        st.markdown("Select the equipment you have access to:")

        selected = st.multiselect(
            "Available Equipment",
            options=all_types,
            default=current_types,
        )

        if st.button("Update Equipment"):
            set_equipment_list(selected)
            st.success("Equipment updated!")
            st.rerun()

    # External activities section
    with st.expander("📅 External Activities", expanded=False):
        st.markdown("Add recurring activities that affect your training (games, classes, etc.)")

        # Show current activities
        recurring = get_recurring_activities()
        if recurring:
            st.markdown("**Current Activities:**")
            for activity in recurring:
                col1, col2 = st.columns([3, 1])
                with col1:
                    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    day = (
                        days[activity["day_of_week"]]
                        if activity["day_of_week"] is not None
                        else "?"
                    )
                    st.markdown(
                        f"• **{day}**: {activity['name']} ({activity['intensity']}, load: {activity['load_score']})"
                    )
                with col2:
                    if st.button("🗑️", key=f"del_{activity['id']}"):
                        delete_external_activity(activity["id"])
                        st.rerun()

        # Add new activity
        st.markdown("---")
        with st.form("new_activity_form"):
            col1, col2 = st.columns(2)
            with col1:
                activity_type = st.selectbox(
                    "Activity Type",
                    options=list(ACTIVITY_LOAD_SCORES.keys()),
                )
                activity_name = st.text_input(
                    "Activity Name", placeholder="e.g., Thursday Football"
                )
            with col2:
                day_of_week = st.selectbox(
                    "Day of Week",
                    options=[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                    ],
                )
                intensity = st.selectbox("Intensity", options=["low", "medium", "high"])

            if st.form_submit_button("Add Activity"):
                day_map = {
                    "Monday": 0,
                    "Tuesday": 1,
                    "Wednesday": 2,
                    "Thursday": 3,
                    "Friday": 4,
                    "Saturday": 5,
                    "Sunday": 6,
                }
                add_recurring_activity(
                    activity_type=activity_type,
                    day_of_week=day_map[day_of_week],
                    activity_name=activity_name or None,
                    intensity=intensity,
                )
                st.success("Activity added!")
                st.rerun()
