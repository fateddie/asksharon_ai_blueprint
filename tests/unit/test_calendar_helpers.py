"""
Unit tests for calendar helper functions (Pure functions)

Tests the pure functions in assistant/modules/calendar/helpers.py
These functions have no I/O, so tests are fast and reliable.

Run: pytest tests/unit/test_calendar_helpers.py -v
"""

import pytest
from datetime import date, datetime
from assistant.modules.calendar.helpers import (
    parse_recurring_days,
    generate_event_dates,
    format_time_for_calendar,
    validate_calendar_config
)


class TestParseRecurringDays:
    """Test parse_recurring_days() function"""

    def test_full_day_names(self):
        """Should parse full day names"""
        result = parse_recurring_days("every monday and wednesday")
        assert result == ["mon", "wed"]

    def test_abbreviated_day_names(self):
        """Should parse abbreviated day names"""
        result = parse_recurring_days("mon/wed/fri")
        assert result == ["mon", "wed", "fri"]

    def test_comma_separated(self):
        """Should parse comma-separated days"""
        result = parse_recurring_days("monday, wednesday, friday")
        assert result == ["mon", "wed", "fri"]

    def test_weekdays_keyword(self):
        """Should recognize 'weekdays' keyword"""
        result = parse_recurring_days("weekdays")
        assert result == ["mon", "tue", "wed", "thu", "fri"]

    def test_every_day_keyword(self):
        """Should recognize 'every day' keyword"""
        result = parse_recurring_days("every day")
        assert result == ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    def test_daily_keyword(self):
        """Should recognize 'daily' keyword"""
        result = parse_recurring_days("daily")
        assert result == ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    def test_weekend_keyword(self):
        """Should recognize 'weekend' keyword"""
        result = parse_recurring_days("weekend")
        assert result == ["sat", "sun"]

    def test_mixed_case(self):
        """Should handle mixed case"""
        result = parse_recurring_days("Monday, WEDNESDAY, friday")
        assert result == ["mon", "wed", "fri"]

    def test_empty_string(self):
        """Should return empty list for empty string"""
        result = parse_recurring_days("")
        assert result == []

    def test_none_input(self):
        """Should return empty list for None"""
        result = parse_recurring_days(None)
        assert result == []

    def test_no_days_found(self):
        """Should return empty list when no days found"""
        result = parse_recurring_days("some random text")
        assert result == []

    def test_duplicate_days(self):
        """Should not include duplicates"""
        result = parse_recurring_days("monday and monday")
        assert result == ["mon"]

    def test_ordering(self):
        """Should order days mon->sun regardless of input order"""
        result = parse_recurring_days("friday, monday, wednesday")
        assert result == ["mon", "wed", "fri"]


class TestGenerateEventDates:
    """Test generate_event_dates() function"""

    def test_single_day_single_week(self):
        """Should generate dates for single day, single week"""
        start = date(2025, 1, 6)  # Monday, Jan 6, 2025
        result = generate_event_dates(start, ["mon"], num_weeks=1)
        assert result == [date(2025, 1, 6)]

    def test_multiple_days_two_weeks(self):
        """Should generate dates for multiple days, two weeks"""
        start = date(2025, 1, 6)  # Monday, Jan 6, 2025
        result = generate_event_dates(start, ["mon", "wed"], num_weeks=2)
        expected = [
            date(2025, 1, 6),   # Mon
            date(2025, 1, 8),   # Wed
            date(2025, 1, 13),  # Mon
            date(2025, 1, 15),  # Wed
        ]
        assert result == expected

    def test_four_weeks_default(self):
        """Should default to 4 weeks if not specified"""
        start = date(2025, 1, 6)  # Monday
        result = generate_event_dates(start, ["mon"], num_weeks=4)
        assert len(result) == 4  # 4 Mondays in 4 weeks

    def test_weekdays_four_weeks(self):
        """Should generate all weekdays for 4 weeks"""
        start = date(2025, 1, 6)  # Monday
        result = generate_event_dates(
            start,
            ["mon", "tue", "wed", "thu", "fri"],
            num_weeks=4
        )
        # 4 weeks * 5 weekdays = 20 dates
        assert len(result) == 20

    def test_weekend_only(self):
        """Should generate weekend dates only"""
        start = date(2025, 1, 6)  # Monday, Jan 6, 2025
        result = generate_event_dates(start, ["sat", "sun"], num_weeks=2)
        expected = [
            date(2025, 1, 11),  # Sat
            date(2025, 1, 12),  # Sun
            date(2025, 1, 18),  # Sat
            date(2025, 1, 19),  # Sun
        ]
        assert result == expected

    def test_start_date_on_non_target_day(self):
        """Should include dates that fall within the time window"""
        start = date(2025, 1, 7)  # Tuesday
        result = generate_event_dates(start, ["mon"], num_weeks=1)
        # Next Monday is Jan 13, which is within 1 week (7 days) window
        assert result == [date(2025, 1, 13)]

    def test_empty_days_list(self):
        """Should return empty list if no days specified"""
        start = date(2025, 1, 6)
        result = generate_event_dates(start, [], num_weeks=4)
        assert result == []

    def test_invalid_day_abbreviations(self):
        """Should ignore invalid day abbreviations"""
        start = date(2025, 1, 6)
        result = generate_event_dates(start, ["xyz", "mon"], num_weeks=1)
        assert result == [date(2025, 1, 6)]

    def test_zero_weeks(self):
        """Should return empty list for zero weeks"""
        start = date(2025, 1, 6)
        result = generate_event_dates(start, ["mon"], num_weeks=0)
        assert result == []

    def test_negative_weeks(self):
        """Should return empty list for negative weeks"""
        start = date(2025, 1, 6)
        result = generate_event_dates(start, ["mon"], num_weeks=-1)
        assert result == []


class TestFormatTimeForCalendar:
    """Test format_time_for_calendar() function"""

    def test_24_hour_format(self):
        """Should handle 24-hour format"""
        assert format_time_for_calendar("19:30") == "19:30"
        assert format_time_for_calendar("07:30") == "07:30"
        assert format_time_for_calendar("00:00") == "00:00"

    def test_12_hour_with_am(self):
        """Should convert 12-hour AM format"""
        assert format_time_for_calendar("7:30am") == "07:30"
        assert format_time_for_calendar("7:30 AM") == "07:30"
        assert format_time_for_calendar("11:00am") == "11:00"

    def test_12_hour_with_pm(self):
        """Should convert 12-hour PM format"""
        assert format_time_for_calendar("7:30pm") == "19:30"
        assert format_time_for_calendar("7:30 PM") == "19:30"
        assert format_time_for_calendar("11:00pm") == "23:00"

    def test_noon_and_midnight(self):
        """Should handle noon and midnight correctly"""
        assert format_time_for_calendar("12:00pm") == "12:00"  # Noon
        assert format_time_for_calendar("12:00am") == "00:00"  # Midnight

    def test_hour_only_with_meridiem(self):
        """Should handle hour-only format (e.g., '7am')"""
        assert format_time_for_calendar("7am") == "07:00"
        assert format_time_for_calendar("7pm") == "19:00"

    def test_mixed_case(self):
        """Should handle mixed case"""
        assert format_time_for_calendar("7:30AM") == "07:30"
        assert format_time_for_calendar("7:30Pm") == "19:30"

    def test_invalid_formats(self):
        """Should return None for invalid formats"""
        assert format_time_for_calendar("25:00") is None  # Invalid hour
        assert format_time_for_calendar("7:60am") is None  # Invalid minute
        assert format_time_for_calendar("13:00pm") is None  # Invalid 12-hour
        assert format_time_for_calendar("not a time") is None
        assert format_time_for_calendar("") is None
        assert format_time_for_calendar(None) is None


class TestValidateCalendarConfig:
    """Test validate_calendar_config() function"""

    def test_valid_config(self):
        """Should validate correct configuration"""
        result = validate_calendar_config(
            recurring_days="mon, wed, fri",
            session_time_start="7:30am",
            session_time_end="9:00am"
        )
        assert result["valid"] is True
        assert result["parsed_days"] == ["mon", "wed", "fri"]
        assert result["formatted_start"] == "07:30"
        assert result["formatted_end"] == "09:00"

    def test_invalid_days(self):
        """Should reject invalid days"""
        result = validate_calendar_config(
            recurring_days="not valid days",
            session_time_start="7:30am",
            session_time_end="9:00am"
        )
        assert result["valid"] is False
        assert "No valid days" in result["error"]

    def test_invalid_start_time(self):
        """Should reject invalid start time"""
        result = validate_calendar_config(
            recurring_days="monday",
            session_time_start="25:00",
            session_time_end="9:00am"
        )
        assert result["valid"] is False
        assert "Invalid start time" in result["error"]

    def test_invalid_end_time(self):
        """Should reject invalid end time"""
        result = validate_calendar_config(
            recurring_days="monday",
            session_time_start="7:30am",
            session_time_end="not a time"
        )
        assert result["valid"] is False
        assert "Invalid end time" in result["error"]

    def test_end_time_before_start_time(self):
        """Should reject end time before start time"""
        result = validate_calendar_config(
            recurring_days="monday",
            session_time_start="9:00am",
            session_time_end="7:00am"
        )
        assert result["valid"] is False
        assert "End time must be after start time" in result["error"]

    def test_end_time_equal_to_start_time(self):
        """Should reject end time equal to start time"""
        result = validate_calendar_config(
            recurring_days="monday",
            session_time_start="7:00am",
            session_time_end="7:00am"
        )
        assert result["valid"] is False
        assert "End time must be after start time" in result["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
