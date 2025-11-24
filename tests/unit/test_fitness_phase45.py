"""
Unit Tests for Phase 4.5 Fitness Enhanced
==========================================
Tests for user profile, assessment, equipment, goals, and workout controls.
"""

import pytest
from datetime import date, timedelta
import time

# Import modules to test
from assistant.modules.fitness.user_profile import (
    calculate_bmi,
    calculate_waist_to_height_ratio,
    save_user_profile,
    get_user_profile,
    update_weight,
    delete_user_profile,
    get_bmi_interpretation,
)
from assistant.modules.fitness.assessment import (
    classify_fitness_level,
    save_assessment,
    get_latest_assessment,
    get_assessment_history,
    compare_assessments,
    get_test_instructions,
)
from assistant.modules.fitness.equipment import (
    get_equipment_types,
    add_equipment,
    remove_equipment,
    get_user_equipment,
    set_equipment_list,
    get_exercises_for_equipment,
)
from assistant.modules.fitness.goals import (
    GOAL_TYPES,
    calculate_progress,
    estimate_completion_date,
    create_goal,
    update_goal_progress,
    get_goal,
    get_active_goals,
    abandon_goal,
    pause_goal,
    resume_goal,
)
from assistant.modules.fitness.workout_session import (
    start_workout_session,
    pause_workout_session,
    resume_workout_session,
    restart_workout_session,
    get_session_status,
    cancel_workout_session,
)
from assistant.modules.fitness.exercise_seeds import (
    seed_exercises,
    get_exercises_by_equipment,
    get_exercises_by_movement_pattern,
    get_exercise_coaching,
)


class TestUserProfile:
    """Tests for user profile functionality."""

    def setup_method(self):
        """Clean up before each test."""
        delete_user_profile()

    def teardown_method(self):
        """Clean up after each test."""
        delete_user_profile()

    def test_calculate_bmi_normal(self):
        """Test BMI calculation for normal weight."""
        bmi, category = calculate_bmi(70, 175)
        assert 22 < bmi < 24
        assert category == "normal"

    def test_calculate_bmi_underweight(self):
        """Test BMI calculation for underweight."""
        bmi, category = calculate_bmi(50, 175)
        assert bmi < 18.5
        assert category == "underweight"

    def test_calculate_bmi_overweight(self):
        """Test BMI calculation for overweight."""
        bmi, category = calculate_bmi(85, 170)
        assert 25 < bmi < 30
        assert category == "overweight"

    def test_calculate_bmi_obese(self):
        """Test BMI calculation for obese."""
        bmi, category = calculate_bmi(100, 165)
        assert bmi >= 30
        assert category.startswith("obese")

    def test_calculate_bmi_invalid_input(self):
        """Test BMI calculation with invalid input."""
        with pytest.raises(ValueError):
            calculate_bmi(70, 0)
        with pytest.raises(ValueError):
            calculate_bmi(0, 175)

    def test_waist_to_height_ratio(self):
        """Test waist-to-height ratio calculation."""
        ratio = calculate_waist_to_height_ratio(80, 175)
        assert 0.4 < ratio < 0.5

    def test_save_and_get_profile(self):
        """Test saving and retrieving user profile."""
        profile_id = save_user_profile(
            height_cm=175,
            weight_kg=70,
            age=30,
            gender="male",
            activity_level="moderate",
            experience_level="intermediate",
        )
        assert profile_id > 0

        profile = get_user_profile()
        assert profile is not None
        assert profile["height_cm"] == 175
        assert profile["weight_kg"] == 70
        assert profile["age"] == 30
        assert profile["bmi"] is not None
        assert profile["bmi_category"] == "normal"

    def test_update_profile_is_singleton(self):
        """Test that profile updates existing record."""
        id1 = save_user_profile(height_cm=175, weight_kg=70)
        id2 = save_user_profile(height_cm=180, weight_kg=75)
        assert id1 == id2

        profile = get_user_profile()
        assert profile["height_cm"] == 180
        assert profile["weight_kg"] == 75

    def test_update_weight(self):
        """Test quick weight update."""
        save_user_profile(height_cm=175, weight_kg=70)
        result = update_weight(72)
        assert result is True

        profile = get_user_profile()
        assert profile["weight_kg"] == 72

    def test_bmi_interpretation(self):
        """Test BMI interpretation strings."""
        interp = get_bmi_interpretation(22.5, "normal")
        assert "healthy" in interp.lower()


class TestFitnessAssessment:
    """Tests for fitness assessment functionality."""

    def test_classify_fitness_beginner(self):
        """Test fitness classification for beginner."""
        level, score = classify_fitness_level(
            push_ups=5, plank_sec=20, squat_60s=15, wall_sit_sec=20, resting_hr=85
        )
        assert level == "beginner"
        assert score < 40

    def test_classify_fitness_intermediate(self):
        """Test fitness classification for intermediate."""
        level, score = classify_fitness_level(
            push_ups=20, plank_sec=45, squat_60s=28, wall_sit_sec=45, resting_hr=65
        )
        assert level == "intermediate"
        assert 40 <= score < 70

    def test_classify_fitness_advanced(self):
        """Test fitness classification for advanced."""
        level, score = classify_fitness_level(
            push_ups=35, plank_sec=90, squat_60s=42, wall_sit_sec=90, resting_hr=50
        )
        assert level == "advanced"
        assert score >= 70

    def test_classify_fitness_partial_tests(self):
        """Test classification with partial tests."""
        level, score = classify_fitness_level(push_ups=25, plank_sec=60)
        assert level in ["beginner", "intermediate", "advanced"]
        assert 0 <= score <= 100

    def test_save_and_get_assessment(self):
        """Test saving and retrieving assessment."""
        assessment_id = save_assessment(
            push_up_max=20, plank_hold_seconds=45, squat_60s_count=25, notes="Test assessment"
        )
        assert assessment_id > 0

        latest = get_latest_assessment()
        assert latest is not None
        assert latest["push_up_max"] == 20
        assert latest["plank_hold_seconds"] == 45

    def test_get_test_instructions(self):
        """Test getting test instructions."""
        instructions = get_test_instructions("push_up_max")
        assert "name" in instructions
        assert "instructions" in instructions
        assert "tips" in instructions


class TestEquipment:
    """Tests for equipment management."""

    def test_get_equipment_types(self):
        """Test getting all equipment types."""
        types = get_equipment_types()
        assert "bodyweight" in types
        assert "kettlebell" in types
        assert "pull_up_bar" in types
        assert "dumbbell" in types

    def test_add_and_get_equipment(self):
        """Test adding equipment."""
        eq_id = add_equipment("kettlebell", details="16kg, 24kg")
        assert eq_id > 0

        equipment = get_user_equipment()
        kettlebell = next((e for e in equipment if e["equipment_type"] == "kettlebell"), None)
        assert kettlebell is not None
        assert kettlebell["details"] == "16kg, 24kg"

    def test_set_equipment_list(self):
        """Test setting complete equipment list."""
        count = set_equipment_list(["kettlebell", "pull_up_bar", "dumbbell"])
        assert count == 4  # Includes bodyweight

        equipment = get_user_equipment()
        types = [e["equipment_type"] for e in equipment]
        assert "bodyweight" in types
        assert "kettlebell" in types
        assert "pull_up_bar" in types

    def test_bodyweight_cannot_be_removed(self):
        """Test that bodyweight cannot be removed."""
        result = remove_equipment("bodyweight")
        assert result is False

    def test_invalid_equipment_type(self):
        """Test adding invalid equipment type."""
        with pytest.raises(ValueError):
            add_equipment("invalid_type")


class TestFitnessGoals:
    """Tests for fitness goals functionality."""

    def test_goal_types_defined(self):
        """Test that goal types are defined."""
        assert "strength" in GOAL_TYPES
        assert "endurance" in GOAL_TYPES
        assert "consistency" in GOAL_TYPES

    def test_calculate_progress(self):
        """Test progress calculation."""
        # 50% progress
        progress = calculate_progress(0, 5, 10)
        assert progress == 50.0

        # 100% progress
        progress = calculate_progress(0, 10, 10)
        assert progress == 100.0

        # Over 100%
        progress = calculate_progress(0, 15, 10)
        assert progress == 100.0

        # No progress
        progress = calculate_progress(5, 5, 10)
        assert progress == 0.0

    def test_create_and_get_goal(self):
        """Test creating and retrieving a goal."""
        goal_id = create_goal(
            goal_type="strength",
            title="10 pull-ups",
            target_value=10,
            target_unit="reps",
            start_value=3,
            current_value=3,
        )
        assert goal_id > 0

        goal = get_goal(goal_id)
        assert goal is not None
        assert goal["title"] == "10 pull-ups"
        assert goal["target_value"] == 10
        assert goal["progress_pct"] == 0.0

    def test_update_goal_progress(self):
        """Test updating goal progress."""
        goal_id = create_goal(
            goal_type="strength",
            title="Test goal",
            target_value=10,
            target_unit="reps",
            start_value=0,
        )

        result = update_goal_progress(goal_id, 5, notes="Making progress")
        assert result is True

        goal = get_goal(goal_id)
        assert goal["current_value"] == 5
        assert goal["progress_pct"] == 50.0

    def test_goal_achieved_auto_status(self):
        """Test that goal status updates when achieved."""
        goal_id = create_goal(
            goal_type="strength",
            title="Test goal",
            target_value=10,
            target_unit="reps",
        )

        update_goal_progress(goal_id, 10)

        goal = get_goal(goal_id)
        assert goal["status"] == "achieved"
        assert goal["achieved_at"] is not None

    def test_abandon_goal(self):
        """Test abandoning a goal."""
        goal_id = create_goal(
            goal_type="strength", title="Test goal", target_value=10, target_unit="reps"
        )

        result = abandon_goal(goal_id)
        assert result is True

        goal = get_goal(goal_id)
        assert goal["status"] == "abandoned"

    def test_pause_and_resume_goal(self):
        """Test pausing and resuming a goal."""
        goal_id = create_goal(
            goal_type="strength", title="Test goal", target_value=10, target_unit="reps"
        )

        result = pause_goal(goal_id)
        assert result is True
        assert get_goal(goal_id)["status"] == "paused"

        result = resume_goal(goal_id)
        assert result is True
        assert get_goal(goal_id)["status"] == "active"

    def test_invalid_goal_type(self):
        """Test creating goal with invalid type."""
        with pytest.raises(ValueError):
            create_goal(
                goal_type="invalid_type",
                title="Test",
                target_value=10,
                target_unit="reps",
            )


class TestWorkoutControls:
    """Tests for workout pause/resume/restart functionality."""

    def test_pause_active_session(self):
        """Test pausing an active workout session."""
        session_id = start_workout_session()
        result = pause_workout_session(session_id)

        assert result["success"] is True
        assert result["status"] == "paused"

        status = get_session_status(session_id)
        assert status["status"] == "paused"
        assert status["can_resume"] is True
        assert status["can_pause"] is False

    def test_resume_paused_session(self):
        """Test resuming a paused workout session."""
        session_id = start_workout_session()
        pause_workout_session(session_id)

        time.sleep(0.1)  # Small delay to accumulate paused time

        result = resume_workout_session(session_id)
        assert result["success"] is True
        assert result["status"] == "in_progress"

        status = get_session_status(session_id)
        assert status["status"] == "in_progress"
        assert status["can_pause"] is True
        assert status["can_resume"] is False

    def test_cannot_pause_paused_session(self):
        """Test that paused session cannot be paused again."""
        session_id = start_workout_session()
        pause_workout_session(session_id)

        result = pause_workout_session(session_id)
        assert result["success"] is False
        assert "error" in result

    def test_cannot_resume_active_session(self):
        """Test that active session cannot be resumed."""
        session_id = start_workout_session()

        result = resume_workout_session(session_id)
        assert result["success"] is False
        assert "error" in result

    def test_restart_session(self):
        """Test restarting a workout session."""
        session_id = start_workout_session()

        result = restart_workout_session(session_id)
        assert result["success"] is True
        assert result["status"] == "in_progress"

        status = get_session_status(session_id)
        assert status["status"] == "in_progress"

    def test_restart_paused_session(self):
        """Test restarting a paused session."""
        session_id = start_workout_session()
        pause_workout_session(session_id)

        result = restart_workout_session(session_id)
        assert result["success"] is True
        assert result["status"] == "in_progress"

    def test_session_status_elapsed_time(self):
        """Test elapsed time calculation."""
        session_id = start_workout_session()
        time.sleep(0.1)

        status = get_session_status(session_id)
        assert status["elapsed_seconds"] >= 0
        assert status["elapsed_minutes"] >= 0


class TestExerciseSeeds:
    """Tests for exercise coaching content."""

    def setup_method(self):
        """Ensure exercises are seeded."""
        seed_exercises()

    def test_exercises_seeded(self):
        """Test that exercises were seeded."""
        exercises = get_exercises_by_equipment(["bodyweight"])
        assert len(exercises) > 10

    def test_kettlebell_exercises_exist(self):
        """Test kettlebell exercises are available."""
        exercises = get_exercises_by_equipment(["kettlebell"])
        assert len(exercises) >= 8

        names = [e["name"] for e in exercises]
        assert "Kettlebell Swing" in names
        assert "Goblet Squat" in names
        assert "Turkish Get-Up" in names

    def test_pullup_bar_exercises_exist(self):
        """Test pull-up bar exercises are available."""
        exercises = get_exercises_by_equipment(["pull_up_bar"])
        assert len(exercises) >= 5

        names = [e["name"] for e in exercises]
        assert "Pull-ups" in names
        assert "Chin-ups" in names
        assert "Hanging Knee Raises" in names

    def test_exercises_by_movement_pattern(self):
        """Test filtering by movement pattern."""
        push_exercises = get_exercises_by_movement_pattern("push")
        assert len(push_exercises) >= 3

        pull_exercises = get_exercises_by_movement_pattern("pull")
        assert len(pull_exercises) >= 3

        hinge_exercises = get_exercises_by_movement_pattern("hinge")
        assert len(hinge_exercises) >= 3

    def test_exercise_coaching_content(self):
        """Test that exercises have coaching content."""
        exercises = get_exercises_by_equipment(["bodyweight"])
        pushups = next((e for e in exercises if e["name"] == "Push-ups"), None)

        assert pushups is not None
        assert pushups["instructions"] is not None
        assert pushups["form_cues"] is not None
        assert pushups["common_mistakes"] is not None
        assert pushups["movement_pattern"] == "push"
        assert pushups["difficulty_level"] is not None

    def test_get_exercise_coaching(self):
        """Test getting full coaching content for an exercise."""
        exercises = get_exercises_by_equipment(["kettlebell"])
        swing = next((e for e in exercises if e["name"] == "Kettlebell Swing"), None)

        coaching = get_exercise_coaching(swing["id"])
        assert coaching["name"] == "Kettlebell Swing"
        assert "instructions" in coaching
        assert "form_cues" in coaching
        assert "common_mistakes" in coaching
        assert coaching["video_url"] is not None


# =============================================================================
# PHASE 4.5+ TESTS: Training Intelligence, Calendar, Workout Generator
# =============================================================================

from assistant.modules.fitness.training_intelligence import (
    detect_goal_category,
    get_training_requirements,
    get_all_goal_categories,
    create_goal_with_intelligence,
    get_goal_milestones,
    check_milestone_achievements,
    get_periodization_state,
    initialize_periodization,
    advance_periodization_week,
    add_recurring_activity,
    get_recurring_activities,
    get_training_adjustment_for_day,
    delete_external_activity,
)
from assistant.modules.fitness.workout_generator import (
    generate_workout,
    generate_weekly_plan,
)
from assistant.modules.fitness.workout_justification import (
    generate_workout_justification,
    get_training_science_article,
    list_available_topics,
)


class TestGoalIntelligence:
    """Tests for intelligent goal category detection and requirements."""

    def test_detect_vertical_jump_goal(self):
        """Test detection of vertical jump goal."""
        category = detect_goal_category("increase vertical jump to dunk")
        assert category == "vertical_jump"

    def test_detect_5k_goal(self):
        """Test detection of 5K running goal."""
        category = detect_goal_category("run 5k in 25 minutes")
        assert category == "5k_time"

    def test_detect_pullup_skill_goal(self):
        """Test detection of skill acquisition goal."""
        category = detect_goal_category("achieve 10 pull-ups")
        assert category == "skill_acquisition"

    def test_detect_mobility_goal(self):
        """Test detection of mobility goal."""
        category = detect_goal_category("improve flexibility and mobility")
        assert category == "mobility"

    def test_detect_weight_loss_goal(self):
        """Test detection of weight loss goal."""
        category = detect_goal_category("lose 5kg of body fat")
        assert category == "weight_loss"

    def test_detect_unknown_defaults_to_custom(self):
        """Test that unclear goals default to custom."""
        category = detect_goal_category("be better at stuff")
        assert category in ["custom", "general_fitness"]

    def test_get_training_requirements_vertical_jump(self):
        """Test getting training requirements for vertical jump."""
        reqs = get_training_requirements("vertical_jump")
        assert "plyometrics" in reqs["training_methods"]
        assert "posterior_chain" in reqs["training_methods"]
        assert reqs["periodization_style"] == "power_focus"

    def test_get_training_requirements_5k(self):
        """Test getting training requirements for 5K."""
        reqs = get_training_requirements("5k_time")
        assert "aerobic_base" in reqs["training_methods"]
        assert "tempo_runs" in reqs["training_methods"]
        assert reqs["periodization_style"] == "endurance_focus"

    def test_get_all_goal_categories(self):
        """Test retrieving all goal categories."""
        categories = get_all_goal_categories()
        assert len(categories) >= 10
        cat_names = [c["goal_category"] for c in categories]
        assert "vertical_jump" in cat_names
        assert "5k_time" in cat_names
        assert "custom" in cat_names


class TestGoalMilestones:
    """Tests for goal milestones functionality."""

    def test_create_goal_with_milestones(self):
        """Test creating goal with auto-generated milestones."""
        result = create_goal_with_intelligence(
            goal_type="strength",
            title="Increase vertical jump",
            target_value=36,  # inches
            target_unit="inches",
            start_value=28,
            auto_milestones=True,
        )

        assert result["goal_id"] > 0
        assert result["detected_category"] == "vertical_jump"
        assert len(result["milestones"]) >= 4

        # Check milestone values progress
        values = [m["value"] for m in result["milestones"]]
        assert values == sorted(values)  # Should be increasing

    def test_milestone_achievement_detection(self):
        """Test detecting when milestones are achieved."""
        result = create_goal_with_intelligence(
            goal_type="strength",
            title="10 pull-ups",
            target_value=10,
            target_unit="reps",
            start_value=0,
            auto_milestones=True,
        )

        goal_id = result["goal_id"]

        # Check 5 reps - should achieve some milestones
        achieved = check_milestone_achievements(goal_id, 5)
        assert len(achieved) >= 1

        # Get all milestones
        milestones = get_goal_milestones(goal_id)
        achieved_count = sum(1 for m in milestones if m["status"] == "achieved")
        assert achieved_count >= 1


class TestPeriodization:
    """Tests for periodization state management."""

    def test_initialize_periodization(self):
        """Test initializing periodization."""
        state = initialize_periodization("accumulation")

        assert state is not None
        assert state["current_phase"] == "accumulation"
        assert state["current_week"] == 1
        assert state["phase_info"]["volume"] == "high"

    def test_advance_periodization_week(self):
        """Test advancing periodization by one week."""
        initialize_periodization("accumulation")

        # Advance one week
        state = advance_periodization_week()
        assert state["current_week"] == 2
        assert state["current_phase"] == "accumulation"

    def test_phase_transition(self):
        """Test transitioning between phases."""
        initialize_periodization("accumulation")

        # Advance through accumulation (3 weeks)
        for _ in range(3):
            state = advance_periodization_week()

        # Should be in transmutation now
        assert state["current_phase"] == "transmutation"
        assert state["current_week"] == 1


class TestExternalActivities:
    """Tests for external activity / calendar integration."""

    def setup_method(self):
        """Clean up activities before each test."""
        # Get and delete existing recurring activities
        for activity in get_recurring_activities():
            delete_external_activity(activity["id"])

    def test_add_recurring_activity(self):
        """Test adding a recurring activity."""
        activity_id = add_recurring_activity(
            activity_type="5_a_side",
            day_of_week=3,  # Thursday
            activity_name="Thursday Football",
            intensity="high",
        )

        assert activity_id > 0

        recurring = get_recurring_activities()
        assert len(recurring) >= 1

        football = next((r for r in recurring if r["name"] == "Thursday Football"), None)
        assert football is not None
        assert football["day_of_week"] == 3
        assert football["load_score"] == 8  # High intensity 5-a-side

    def test_training_adjustment_with_activity(self):
        """Test training adjustments based on external activity."""
        # Add a high-intensity activity for today
        from datetime import date

        add_recurring_activity(
            activity_type="jiu_jitsu",
            day_of_week=date.today().weekday(),
            intensity="high",
        )

        adjustment = get_training_adjustment_for_day(date.today())

        # Should recommend rest or reduced training
        assert adjustment["volume_multiplier"] < 1.0
        assert adjustment["workout_type"] in ["rest", "mobility", "recovery_focus"]

    def test_day_before_activity_adjustment(self):
        """Test adjustments for day before high-intensity activity."""
        from datetime import date, timedelta

        # Add activity for tomorrow
        tomorrow = date.today() + timedelta(days=1)
        add_recurring_activity(
            activity_type="5_a_side",
            day_of_week=tomorrow.weekday(),
            intensity="high",
        )

        adjustment = get_training_adjustment_for_day(date.today())

        # Should have reduced volume
        assert adjustment["volume_multiplier"] <= 0.7


class TestWorkoutGenerator:
    """Tests for workout generation."""

    def test_generate_basic_workout(self):
        """Test generating a basic workout."""
        workout = generate_workout()

        assert workout is not None
        assert "workout_type" in workout
        assert "date" in workout
        assert "generated_at" in workout

    def test_workout_has_justification(self):
        """Test that generated workouts include justification."""
        workout = generate_workout()

        assert "brief_justification" in workout
        assert len(workout["brief_justification"]) > 0

    def test_generate_weekly_plan(self):
        """Test generating a weekly plan."""
        plan = generate_weekly_plan()

        assert "week_start" in plan
        assert "daily_workouts" in plan
        assert "summary" in plan

        # Should have 7 days
        assert len(plan["daily_workouts"]) == 7

        # Should have some training days
        assert plan["summary"]["training_sessions"] >= 0

    def test_workout_respects_calendar(self):
        """Test that workouts respect calendar activities."""
        from datetime import date

        # Clean up and add high-intensity activity for today
        for activity in get_recurring_activities():
            delete_external_activity(activity["id"])

        add_recurring_activity(
            activity_type="martial_arts",
            day_of_week=date.today().weekday(),
            intensity="high",
        )

        workout = generate_workout()

        # Should be rest or mobility due to high external load
        assert workout["workout_type"] in ["rest", "mobility", "recovery_focus"]


class TestWorkoutJustification:
    """Tests for workout justification system."""

    def test_list_training_topics(self):
        """Test listing available training science topics."""
        topics = list_available_topics()

        assert len(topics) >= 10
        assert "plyometrics" in topics
        assert "progressive_overload" in topics
        assert "deload" in topics

    def test_get_training_article(self):
        """Test getting a training science article."""
        article = get_training_science_article("plyometrics")

        assert article is not None
        assert "brief" in article
        assert "detail" in article
        assert "expected_timeline" in article
        assert "power" in article["brief"].lower()

    def test_generate_justification(self):
        """Test generating workout justification."""
        from datetime import date

        workout = {
            "date": date.today().isoformat(),
            "workout_type": "normal",
            "exercises": [
                {"name": "Squats", "movement_pattern": "squat"},
                {"name": "Push-ups", "movement_pattern": "push"},
            ],
        }
        goals = [{"id": 1, "title": "Get stronger", "goal_category": "strength"}]
        calendar = {"recommendations": ["Normal training day"], "volume_multiplier": 1.0}

        justification = generate_workout_justification(workout, goals, calendar)

        assert "brief_text" in justification
        assert "detailed_text" in justification
        assert len(justification["brief_text"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
