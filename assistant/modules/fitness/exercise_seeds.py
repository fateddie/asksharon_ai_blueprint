"""
Exercise Coaching Content Seeds (Phase 4.5)
===========================================
Comprehensive exercise data with coaching content.

Includes:
- Bodyweight exercises
- Kettlebell exercises
- Pull-up bar exercises
- Dumbbell exercises
"""

from sqlalchemy import create_engine, text
from typing import Dict, Any, List

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")

# Complete exercise definitions with coaching content
EXERCISES: List[Dict[str, Any]] = [
    # ============================================
    # BODYWEIGHT EXERCISES
    # ============================================
    {
        "name": "Push-ups",
        "category": "strength",
        "muscle_group": "chest",
        "equipment": "bodyweight",
        "description": "Classic upper body pushing exercise",
        "instructions": """1. Start in a high plank position with hands slightly wider than shoulder-width
2. Keep your body in a straight line from head to heels
3. Lower your chest toward the floor by bending your elbows
4. Stop when chest is about an inch from the ground
5. Push back up to starting position
6. Keep core engaged throughout""",
        "form_cues": "Elbows at 45 degrees, not flared out. Squeeze glutes. Look slightly ahead, not down.",
        "common_mistakes": "Sagging hips, flared elbows, incomplete range of motion, head dropping",
        "muscles_primary": "chest, triceps",
        "muscles_secondary": "anterior deltoids, core",
        "difficulty_level": 2,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    },
    {
        "name": "Squats",
        "category": "strength",
        "muscle_group": "legs",
        "equipment": "bodyweight",
        "description": "Fundamental lower body compound movement",
        "instructions": """1. Stand with feet shoulder-width apart, toes slightly turned out
2. Brace your core and keep chest up
3. Push hips back and bend knees to lower down
4. Descend until thighs are at least parallel to floor
5. Drive through heels to stand back up
6. Squeeze glutes at the top""",
        "form_cues": "Knees track over toes. Weight in heels. Chest stays up. Depth matters.",
        "common_mistakes": "Knees caving in, heels lifting, rounding lower back, partial depth",
        "muscles_primary": "quadriceps, glutes",
        "muscles_secondary": "hamstrings, core, calves",
        "difficulty_level": 1,
        "movement_pattern": "squat",
        "video_url": "https://www.youtube.com/watch?v=aclHkVaku9U",
    },
    {
        "name": "Lunges",
        "category": "strength",
        "muscle_group": "legs",
        "equipment": "bodyweight",
        "description": "Unilateral leg exercise for strength and balance",
        "instructions": """1. Stand tall with feet hip-width apart
2. Take a large step forward with one leg
3. Lower your body until both knees are at 90 degrees
4. Back knee should hover just above the floor
5. Push through front heel to return to standing
6. Alternate legs or complete all reps on one side""",
        "form_cues": "Front knee over ankle. Torso upright. Step far enough. Control the descent.",
        "common_mistakes": "Front knee past toes, leaning forward, short steps, wobbling",
        "muscles_primary": "quadriceps, glutes",
        "muscles_secondary": "hamstrings, calves, core",
        "difficulty_level": 2,
        "movement_pattern": "squat",
        "video_url": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    },
    {
        "name": "Plank",
        "category": "core",
        "muscle_group": "abs",
        "equipment": "bodyweight",
        "description": "Isometric core stabilization exercise",
        "instructions": """1. Start on forearms and toes, elbows under shoulders
2. Create a straight line from head to heels
3. Squeeze glutes and engage core
4. Keep neck neutral, looking at the floor
5. Breathe steadily while holding
6. Maintain position for target time""",
        "form_cues": "Flat back, no sagging or piking. Squeeze everything. Breathe normally.",
        "common_mistakes": "Hips too high or low, holding breath, looking up, shoulders shrugging",
        "muscles_primary": "rectus abdominis, transverse abdominis",
        "muscles_secondary": "obliques, lower back, shoulders, glutes",
        "difficulty_level": 1,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    },
    {
        "name": "Burpees",
        "category": "cardio",
        "muscle_group": "full_body",
        "equipment": "bodyweight",
        "description": "Full body conditioning exercise",
        "instructions": """1. Stand with feet shoulder-width apart
2. Squat down and place hands on floor
3. Jump feet back to plank position
4. Perform a push-up (optional)
5. Jump feet forward to hands
6. Explosively jump up with arms overhead
7. Land softly and repeat""",
        "form_cues": "Land soft. Keep core tight in plank. Full extension on jump.",
        "common_mistakes": "Sagging in plank, hard landing, incomplete jump, rushing form",
        "muscles_primary": "full body",
        "muscles_secondary": "cardiorespiratory system",
        "difficulty_level": 3,
        "movement_pattern": "full_body",
        "video_url": "https://www.youtube.com/watch?v=dZgVxmf6jkA",
    },
    {
        "name": "Mountain Climbers",
        "category": "cardio",
        "muscle_group": "core",
        "equipment": "bodyweight",
        "description": "Dynamic core and cardio exercise",
        "instructions": """1. Start in high plank position
2. Drive one knee toward chest
3. Quickly switch legs, extending back leg while bringing other knee in
4. Keep hips low and core engaged
5. Maintain a steady rhythm
6. Continue alternating for target time or reps""",
        "form_cues": "Hips stay level. Shoulders over wrists. Quick but controlled.",
        "common_mistakes": "Hips bouncing up, hands moving forward, holding breath",
        "muscles_primary": "core, hip flexors",
        "muscles_secondary": "shoulders, quadriceps, chest",
        "difficulty_level": 2,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=nmwgirgXLYM",
    },
    {
        "name": "Jumping Jacks",
        "category": "cardio",
        "muscle_group": "full_body",
        "equipment": "bodyweight",
        "description": "Classic cardiovascular warm-up exercise",
        "instructions": """1. Stand with feet together, arms at sides
2. Jump feet out wide while raising arms overhead
3. Arms and legs move simultaneously
4. Jump feet back together, lowering arms
5. Land softly on balls of feet
6. Maintain steady rhythm""",
        "form_cues": "Light on feet. Full arm extension. Consistent tempo.",
        "common_mistakes": "Flat-footed landing, arms not reaching full extension, irregular rhythm",
        "muscles_primary": "calves, shoulders",
        "muscles_secondary": "core, hip abductors",
        "difficulty_level": 1,
        "movement_pattern": "full_body",
        "video_url": "https://www.youtube.com/watch?v=c4DAnQ6DtF8",
    },
    {
        "name": "Tricep Dips",
        "category": "strength",
        "muscle_group": "arms",
        "equipment": "bodyweight",
        "description": "Upper body pushing exercise targeting triceps",
        "instructions": """1. Sit on edge of sturdy chair or bench
2. Place hands next to hips, fingers forward
3. Slide hips off edge, supporting weight on hands
4. Lower body by bending elbows to 90 degrees
5. Keep elbows pointing back, not out
6. Push back up to starting position""",
        "form_cues": "Elbows back, not flared. Stay close to bench. Control the descent.",
        "common_mistakes": "Elbows flaring out, going too low, shoulders shrugging, feet too far",
        "muscles_primary": "triceps",
        "muscles_secondary": "chest, anterior deltoids",
        "difficulty_level": 2,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=6kALZikXxLc",
    },
    {
        "name": "Glute Bridges",
        "category": "strength",
        "muscle_group": "glutes",
        "equipment": "bodyweight",
        "description": "Hip extension exercise targeting glutes",
        "instructions": """1. Lie on back with knees bent, feet flat on floor
2. Feet hip-width apart, arms at sides
3. Press through heels and squeeze glutes
4. Lift hips until body forms straight line from knees to shoulders
5. Hold briefly at top, squeeze glutes
6. Lower with control""",
        "form_cues": "Drive through heels. Squeeze at top. Don't hyperextend back.",
        "common_mistakes": "Pushing through toes, arching lower back, not squeezing glutes",
        "muscles_primary": "glutes",
        "muscles_secondary": "hamstrings, core",
        "difficulty_level": 1,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=wPM8icPu6H8",
    },
    {
        "name": "Superman",
        "category": "strength",
        "muscle_group": "back",
        "equipment": "bodyweight",
        "description": "Back extension exercise for posterior chain",
        "instructions": """1. Lie face down with arms extended overhead
2. Legs straight, toes pointed
3. Simultaneously lift arms, chest, and legs off floor
4. Hold at top for 2-3 seconds
5. Lower with control
6. Keep neck neutral throughout""",
        "form_cues": "Lift from back muscles, not momentum. Keep neck neutral. Squeeze glutes.",
        "common_mistakes": "Jerking up, looking up too far, holding breath, uncontrolled lowering",
        "muscles_primary": "erector spinae, glutes",
        "muscles_secondary": "hamstrings, shoulders",
        "difficulty_level": 1,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=z6PJMT2y8GQ",
    },
    {
        "name": "Crunches",
        "category": "core",
        "muscle_group": "abs",
        "equipment": "bodyweight",
        "description": "Basic abdominal flexion exercise",
        "instructions": """1. Lie on back with knees bent, feet flat
2. Place hands behind head or across chest
3. Engage core and curl shoulders off floor
4. Lift until shoulder blades clear the ground
5. Lower with control
6. Keep lower back pressed to floor""",
        "form_cues": "Don't pull on neck. Exhale on the way up. Control the descent.",
        "common_mistakes": "Pulling neck, using momentum, feet lifting, incomplete range",
        "muscles_primary": "rectus abdominis",
        "muscles_secondary": "obliques",
        "difficulty_level": 1,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=Xyd_fa5zoEU",
    },
    {
        "name": "Leg Raises",
        "category": "core",
        "muscle_group": "abs",
        "equipment": "bodyweight",
        "description": "Lower abdominal exercise",
        "instructions": """1. Lie flat on back, legs straight
2. Place hands under lower back for support or at sides
3. Keep legs together and straight
4. Raise legs until perpendicular to floor
5. Lower slowly with control
6. Don't let feet touch floor between reps""",
        "form_cues": "Lower back stays flat. Control the negative. Keep legs straight.",
        "common_mistakes": "Arching lower back, bending knees, using momentum, going too fast",
        "muscles_primary": "lower abs, hip flexors",
        "muscles_secondary": "rectus abdominis",
        "difficulty_level": 2,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=JB2oyawG9KI",
    },
    {
        "name": "High Knees",
        "category": "cardio",
        "muscle_group": "legs",
        "equipment": "bodyweight",
        "description": "Running in place with high knee drive",
        "instructions": """1. Stand tall with feet hip-width apart
2. Run in place, driving knees up high
3. Aim to get thighs parallel to floor
4. Pump arms in running motion
5. Stay on balls of feet
6. Maintain quick, steady rhythm""",
        "form_cues": "Knees high. Quick turnover. Stay light. Pump arms.",
        "common_mistakes": "Knees not high enough, flat-footed, leaning back, arms not moving",
        "muscles_primary": "hip flexors, quadriceps",
        "muscles_secondary": "calves, core",
        "difficulty_level": 2,
        "movement_pattern": "full_body",
        "video_url": "https://www.youtube.com/watch?v=tx5rgpDAJRI",
    },
    {
        "name": "Wall Sit",
        "category": "strength",
        "muscle_group": "legs",
        "equipment": "bodyweight",
        "description": "Isometric leg hold against wall",
        "instructions": """1. Stand with back against wall
2. Slide down until thighs are parallel to floor
3. Knees at 90 degrees, directly over ankles
4. Press back flat against wall
5. Hold position for target time
6. Keep weight in heels""",
        "form_cues": "Back flat on wall. Knees at 90 degrees. Don't rest hands on thighs.",
        "common_mistakes": "Knees past toes, not deep enough, hands on thighs, sliding up",
        "muscles_primary": "quadriceps",
        "muscles_secondary": "glutes, calves",
        "difficulty_level": 1,
        "movement_pattern": "squat",
        "video_url": "https://www.youtube.com/watch?v=y-wV4Venusw",
    },
    {
        "name": "Side Plank",
        "category": "core",
        "muscle_group": "obliques",
        "equipment": "bodyweight",
        "description": "Lateral core stabilization exercise",
        "instructions": """1. Lie on side with elbow under shoulder
2. Stack feet or stagger for stability
3. Lift hips off floor, creating straight line
4. Keep core tight and hips lifted
5. Hold for target time
6. Repeat on other side""",
        "form_cues": "Hips high. Stack shoulders. Straight line from head to feet.",
        "common_mistakes": "Hips sagging, looking up, shoulder not stacked, holding breath",
        "muscles_primary": "obliques",
        "muscles_secondary": "core, shoulders, glutes",
        "difficulty_level": 2,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=K2VljzCC16g",
    },
    # ============================================
    # PULL-UP BAR EXERCISES
    # ============================================
    {
        "name": "Pull-ups",
        "category": "strength",
        "muscle_group": "back",
        "equipment": "pull_up_bar",
        "description": "Vertical pulling exercise - gold standard for back strength",
        "instructions": """1. Grip bar slightly wider than shoulder-width, palms away
2. Hang with arms fully extended (dead hang)
3. Retract shoulder blades and engage lats
4. Pull until chin clears the bar
5. Lower with control to full extension
6. Avoid swinging or kipping""",
        "form_cues": "Lead with chest. Elbows drive down. Full range of motion. No kipping.",
        "common_mistakes": "Half reps, excessive swinging, chin jutting forward, no dead hang",
        "muscles_primary": "latissimus dorsi, biceps",
        "muscles_secondary": "rear deltoids, forearms, core",
        "difficulty_level": 3,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    },
    {
        "name": "Chin-ups",
        "category": "strength",
        "muscle_group": "back",
        "equipment": "pull_up_bar",
        "description": "Underhand grip vertical pull emphasizing biceps",
        "instructions": """1. Grip bar shoulder-width, palms facing you
2. Hang with arms fully extended
3. Squeeze shoulder blades together
4. Pull until chin clears bar
5. Lower with control
6. Keep core engaged throughout""",
        "form_cues": "Supinated grip. Full extension at bottom. Chest to bar.",
        "common_mistakes": "Partial range of motion, excessive swinging, chin jutting",
        "muscles_primary": "biceps, latissimus dorsi",
        "muscles_secondary": "rear deltoids, forearms",
        "difficulty_level": 3,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=brhRXlOhsAM",
    },
    {
        "name": "Hanging Knee Raises",
        "category": "core",
        "muscle_group": "abs",
        "equipment": "pull_up_bar",
        "description": "Hanging core exercise for lower abs",
        "instructions": """1. Hang from bar with arms straight
2. Engage core and grip firmly
3. Raise knees toward chest
4. Curl pelvis up at top for full contraction
5. Lower with control
6. Minimize swinging""",
        "form_cues": "Control the swing. Curl pelvis. Slow negative.",
        "common_mistakes": "Excessive swinging, not curling pelvis, dropping legs",
        "muscles_primary": "lower abs, hip flexors",
        "muscles_secondary": "forearms, obliques",
        "difficulty_level": 2,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=Pr1ieGZ5atk",
    },
    {
        "name": "Hanging Leg Raises",
        "category": "core",
        "muscle_group": "abs",
        "equipment": "pull_up_bar",
        "description": "Advanced hanging core exercise",
        "instructions": """1. Hang from bar with arms straight
2. Keep legs straight throughout
3. Raise legs until parallel to floor or higher
4. Control the descent
5. Minimize swinging
6. Keep core engaged throughout""",
        "form_cues": "Straight legs. Slow and controlled. Minimize swing.",
        "common_mistakes": "Bending knees, swinging, momentum-based, incomplete range",
        "muscles_primary": "lower abs, hip flexors",
        "muscles_secondary": "forearms, obliques, rectus abdominis",
        "difficulty_level": 3,
        "movement_pattern": "core",
        "video_url": "https://www.youtube.com/watch?v=G0ysNevIv0w",
    },
    {
        "name": "Dead Hang",
        "category": "strength",
        "muscle_group": "forearms",
        "equipment": "pull_up_bar",
        "description": "Grip endurance and shoulder mobility exercise",
        "instructions": """1. Grip bar with overhand grip, shoulder-width
2. Let body hang with arms fully extended
3. Relax shoulders or engage lats (active hang)
4. Keep core lightly engaged
5. Breathe normally
6. Hold for target time""",
        "form_cues": "Relax into the hang. Breathe. Full arm extension.",
        "common_mistakes": "Tensing shoulders, holding breath, gripping too tight",
        "muscles_primary": "forearms, grip",
        "muscles_secondary": "shoulders, lats",
        "difficulty_level": 1,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=RaJUFBTyrlA",
    },
    {
        "name": "Negative Pull-ups",
        "category": "strength",
        "muscle_group": "back",
        "equipment": "pull_up_bar",
        "description": "Eccentric-focused pull-up progression",
        "instructions": """1. Use a box or jump to get chin above bar
2. Start at top position with chin over bar
3. Lower yourself as slowly as possible (5-10 seconds)
4. Control the descent all the way to dead hang
5. Reset and repeat
6. Focus on time under tension""",
        "form_cues": "Slow as possible. Control entire range. 5-10 second descent.",
        "common_mistakes": "Dropping too fast, not full range, skipping bottom portion",
        "muscles_primary": "latissimus dorsi, biceps",
        "muscles_secondary": "rear deltoids, forearms",
        "difficulty_level": 2,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=gbPURTSxQLY",
    },
    # ============================================
    # KETTLEBELL EXERCISES
    # ============================================
    {
        "name": "Kettlebell Swing",
        "category": "strength",
        "muscle_group": "full_body",
        "equipment": "kettlebell",
        "description": "Explosive hip hinge - the king of kettlebell exercises",
        "instructions": """1. Stand with feet shoulder-width apart, KB on floor ahead
2. Hinge at hips, grip KB with both hands
3. Hike KB back between legs like hiking a football
4. Explosively drive hips forward, squeezing glutes
5. Let KB float to chest height (not arm lift)
6. Let gravity bring it down, hinge and repeat""",
        "form_cues": "Hips drive the movement. Snap glutes. Arms are ropes. Neutral spine.",
        "common_mistakes": "Squatting instead of hinging, lifting with arms, rounding back, going too heavy",
        "muscles_primary": "glutes, hamstrings",
        "muscles_secondary": "core, forearms, shoulders, back",
        "difficulty_level": 2,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=YSxHifyI6s8",
    },
    {
        "name": "Goblet Squat",
        "category": "strength",
        "muscle_group": "legs",
        "equipment": "kettlebell",
        "description": "Front-loaded squat teaching proper squat mechanics",
        "instructions": """1. Hold KB by horns at chest level, close to body
2. Stand with feet shoulder-width, toes slightly out
3. Push hips back and squat down
4. Keep chest up and KB close
5. Go as deep as mobility allows (ideally below parallel)
6. Drive through heels to stand""",
        "form_cues": "Chest up. Elbows between knees at bottom. Full depth. KB stays close.",
        "common_mistakes": "Rounding forward, knees caving, heels lifting, partial depth",
        "muscles_primary": "quadriceps, glutes",
        "muscles_secondary": "core, upper back, hamstrings",
        "difficulty_level": 1,
        "movement_pattern": "squat",
        "video_url": "https://www.youtube.com/watch?v=MeIiIdhvXT4",
    },
    {
        "name": "Kettlebell Clean",
        "category": "strength",
        "muscle_group": "full_body",
        "equipment": "kettlebell",
        "description": "Explosive pull from floor to rack position",
        "instructions": """1. Stand with KB on floor between feet
2. Hinge and grip KB with one hand
3. Hike KB back slightly
4. Explosively extend hips
5. Guide KB up close to body
6. Catch in rack position (KB resting on forearm)
7. Lower with control and repeat""",
        "form_cues": "Vertical pull, not swing. Soft catch. Keep KB close. High elbow.",
        "common_mistakes": "KB flopping on forearm, wide arc, using arm to pull, not using hips",
        "muscles_primary": "glutes, hamstrings, forearms",
        "muscles_secondary": "shoulders, core, biceps",
        "difficulty_level": 3,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=0i_L-7a-jh0",
    },
    {
        "name": "Kettlebell Press",
        "category": "strength",
        "muscle_group": "shoulders",
        "equipment": "kettlebell",
        "description": "Single-arm overhead press from rack position",
        "instructions": """1. Start with KB in rack position (elbow tight to body)
2. Brace core and squeeze glutes
3. Press KB straight up, rotating palm forward
4. Lock out arm overhead, bicep near ear
5. Lower with control back to rack
6. Complete reps on one side, then switch""",
        "form_cues": "Straight path up. Lock out fully. Core tight. Don't lean back.",
        "common_mistakes": "Pressing forward instead of up, leaning back, not locking out",
        "muscles_primary": "shoulders, triceps",
        "muscles_secondary": "core, upper back",
        "difficulty_level": 2,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=cKx8xE8jJZs",
    },
    {
        "name": "Turkish Get-Up",
        "category": "strength",
        "muscle_group": "full_body",
        "equipment": "kettlebell",
        "description": "Complex full-body movement from lying to standing",
        "instructions": """1. Lie on back, KB pressed up in right hand
2. Bend right knee, foot flat on floor
3. Roll onto left elbow, then left hand
4. Bridge hips up high
5. Sweep left leg through to kneeling
6. Stand up, keeping KB locked out overhead
7. Reverse each step to return to floor""",
        "form_cues": "Eyes on KB. Locked elbow. Each step is distinct. Go slow.",
        "common_mistakes": "Rushing, bent elbow, losing sight of KB, skipping steps",
        "muscles_primary": "full body, core, shoulders",
        "muscles_secondary": "glutes, hip stabilizers",
        "difficulty_level": 3,
        "movement_pattern": "full_body",
        "video_url": "https://www.youtube.com/watch?v=0bWRPC6gdPg",
    },
    {
        "name": "Kettlebell Row",
        "category": "strength",
        "muscle_group": "back",
        "equipment": "kettlebell",
        "description": "Single-arm horizontal pulling exercise",
        "instructions": """1. Hinge at hips, one hand on bench or knee
2. Hold KB in free hand, arm hanging
3. Retract shoulder blade
4. Row KB to hip, elbow driving back
5. Lower with control
6. Complete all reps, then switch sides""",
        "form_cues": "Pull to hip, not chest. Flat back. Squeeze at top. Control the negative.",
        "common_mistakes": "Rotating torso, pulling to chest, rounding back, using momentum",
        "muscles_primary": "latissimus dorsi, rhomboids",
        "muscles_secondary": "biceps, rear deltoids, core",
        "difficulty_level": 1,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=pYcpY20QaE8",
    },
    {
        "name": "Kettlebell Deadlift",
        "category": "strength",
        "muscle_group": "legs",
        "equipment": "kettlebell",
        "description": "Hip hinge pattern with load",
        "instructions": """1. Stand with feet hip-width, KB between feet
2. Hinge at hips, pushing butt back
3. Grip KB with both hands, flat back
4. Drive through heels, extend hips to stand
5. Squeeze glutes at top
6. Hinge back down with control""",
        "form_cues": "Flat back. Hips drive movement. KB stays close. Squeeze at top.",
        "common_mistakes": "Rounding back, squatting instead of hinging, KB drifting forward",
        "muscles_primary": "glutes, hamstrings",
        "muscles_secondary": "lower back, core, forearms",
        "difficulty_level": 1,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=sP_4vybjVJs",
    },
    {
        "name": "Kettlebell Snatch",
        "category": "strength",
        "muscle_group": "full_body",
        "equipment": "kettlebell",
        "description": "Explosive single-arm movement - advanced kettlebell exercise",
        "instructions": """1. Start like a single-arm swing
2. Explosively extend hips
3. As KB rises, pull elbow high
4. Punch hand through as KB reaches top
5. Catch with straight arm overhead
6. Let KB fall back into swing and repeat""",
        "form_cues": "Explosive hips. High pull. Punch through. Soft catch overhead.",
        "common_mistakes": "KB flopping on wrist, arm pulling too early, no hip drive",
        "muscles_primary": "glutes, hamstrings, shoulders",
        "muscles_secondary": "core, forearms, back",
        "difficulty_level": 3,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=cKx8xE8jJZs",
    },
    {
        "name": "Kettlebell Farmer Carry",
        "category": "strength",
        "muscle_group": "full_body",
        "equipment": "kettlebell",
        "description": "Loaded carry for grip, core, and posture",
        "instructions": """1. Stand between two KBs
2. Deadlift to pick them up
3. Stand tall with shoulders back
4. Walk with controlled steps
5. Keep core braced throughout
6. Walk for distance or time""",
        "form_cues": "Tall posture. Shoulders back. Short controlled steps. Grip hard.",
        "common_mistakes": "Leaning to one side, hunching, too long steps, holding breath",
        "muscles_primary": "grip, core",
        "muscles_secondary": "traps, shoulders, legs",
        "difficulty_level": 1,
        "movement_pattern": "carry",
        "video_url": "https://www.youtube.com/watch?v=m8gfaC6Vcr0",
    },
    {
        "name": "Kettlebell Halo",
        "category": "strength",
        "muscle_group": "shoulders",
        "equipment": "kettlebell",
        "description": "Shoulder mobility and stability exercise",
        "instructions": """1. Hold KB upside down by horns at chest
2. Circle KB around head, keeping it close
3. Go around the back of head
4. Return to front and reverse direction
5. Keep core engaged throughout
6. Alternate directions each rep""",
        "form_cues": "KB close to head. Controlled movement. Core tight. Don't lean.",
        "common_mistakes": "Wide circles, leaning back, going too fast, losing control",
        "muscles_primary": "shoulders",
        "muscles_secondary": "core, triceps",
        "difficulty_level": 1,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=m8gfaC6Vcr0",
    },
    # ============================================
    # DUMBBELL EXERCISES
    # ============================================
    {
        "name": "Dumbbell Romanian Deadlift",
        "category": "strength",
        "muscle_group": "hamstrings",
        "equipment": "dumbbell",
        "description": "Hip hinge targeting posterior chain",
        "instructions": """1. Hold dumbbells in front of thighs, palms facing you
2. Stand with feet hip-width apart
3. Push hips back, sliding DBs down legs
4. Keep slight bend in knees
5. Go until you feel hamstring stretch
6. Drive hips forward to stand""",
        "form_cues": "DBs stay close to legs. Push hips back. Feel the stretch. Neutral spine.",
        "common_mistakes": "Rounding back, bending knees too much, DBs drifting forward",
        "muscles_primary": "hamstrings, glutes",
        "muscles_secondary": "lower back, core",
        "difficulty_level": 2,
        "movement_pattern": "hinge",
        "video_url": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
    },
    {
        "name": "Dumbbell Bench Press",
        "category": "strength",
        "muscle_group": "chest",
        "equipment": "dumbbell",
        "description": "Horizontal pressing for chest development",
        "instructions": """1. Lie on bench, DB in each hand at chest
2. Press DBs up until arms extended
3. Lower with control to chest level
4. Keep feet flat on floor
5. Maintain arch in lower back
6. Press back up and repeat""",
        "form_cues": "Shoulder blades pinched. Controlled descent. Full range. Feet grounded.",
        "common_mistakes": "Bouncing at bottom, flaring elbows, feet up, no arch",
        "muscles_primary": "chest, triceps",
        "muscles_secondary": "anterior deltoids",
        "difficulty_level": 2,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=VmB1G1K7v94",
    },
    {
        "name": "Dumbbell Shoulder Press",
        "category": "strength",
        "muscle_group": "shoulders",
        "equipment": "dumbbell",
        "description": "Overhead pressing for shoulder development",
        "instructions": """1. Sit or stand with DB at shoulder height
2. Palms facing forward
3. Press DBs overhead until arms extended
4. Lower with control to shoulders
5. Keep core braced
6. Avoid excessive back arch""",
        "form_cues": "Straight path up. Lock out overhead. Core tight. No leaning.",
        "common_mistakes": "Leaning back, not locking out, elbows too far forward",
        "muscles_primary": "shoulders, triceps",
        "muscles_secondary": "upper chest, core",
        "difficulty_level": 2,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog",
    },
    {
        "name": "Dumbbell Curl",
        "category": "strength",
        "muscle_group": "arms",
        "equipment": "dumbbell",
        "description": "Isolation exercise for biceps",
        "instructions": """1. Stand with DB in each hand, arms at sides
2. Palms facing forward (supinated)
3. Curl DBs up, keeping elbows stationary
4. Squeeze biceps at top
5. Lower with control
6. Don't swing or use momentum""",
        "form_cues": "Elbows pinned. Full contraction. Controlled negative. No swinging.",
        "common_mistakes": "Swinging body, moving elbows, incomplete range, going too heavy",
        "muscles_primary": "biceps",
        "muscles_secondary": "forearms",
        "difficulty_level": 1,
        "movement_pattern": "pull",
        "video_url": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
    },
    {
        "name": "Dumbbell Lateral Raise",
        "category": "strength",
        "muscle_group": "shoulders",
        "equipment": "dumbbell",
        "description": "Isolation exercise for lateral deltoids",
        "instructions": """1. Stand with DB at sides, slight bend in elbows
2. Raise arms out to sides
3. Lift until arms parallel to floor
4. Lead with elbows, not hands
5. Lower with control
6. Keep slight forward lean""",
        "form_cues": "Lead with elbows. Parallel to floor. Light weight, high reps. Control.",
        "common_mistakes": "Using momentum, going too high, shrugging shoulders, too heavy",
        "muscles_primary": "lateral deltoids",
        "muscles_secondary": "traps",
        "difficulty_level": 1,
        "movement_pattern": "push",
        "video_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
    },
]


def seed_exercises():
    """Seed or update exercises table with coaching content."""
    with engine.begin() as conn:
        for ex in EXERCISES:
            # Try to update existing exercise first
            result = conn.execute(
                text(
                    """
                    UPDATE exercises SET
                        category = :category,
                        muscle_group = :muscle_group,
                        equipment = :equipment,
                        description = :description,
                        instructions = :instructions,
                        form_cues = :form_cues,
                        common_mistakes = :common_mistakes,
                        muscles_primary = :muscles_primary,
                        muscles_secondary = :muscles_secondary,
                        difficulty_level = :difficulty_level,
                        movement_pattern = :movement_pattern,
                        video_url = :video_url
                    WHERE name = :name
                """
                ),
                ex,
            )

            # If no existing row, insert new
            if result.rowcount == 0:
                conn.execute(
                    text(
                        """
                        INSERT INTO exercises (
                            name, category, muscle_group, equipment, description,
                            instructions, form_cues, common_mistakes, muscles_primary,
                            muscles_secondary, difficulty_level, movement_pattern, video_url
                        ) VALUES (
                            :name, :category, :muscle_group, :equipment, :description,
                            :instructions, :form_cues, :common_mistakes, :muscles_primary,
                            :muscles_secondary, :difficulty_level, :movement_pattern, :video_url
                        )
                    """
                    ),
                    ex,
                )

    return len(EXERCISES)


def get_exercises_by_equipment(equipment_types: List[str]) -> List[Dict[str, Any]]:
    """Get all exercises for given equipment types."""
    if not equipment_types:
        equipment_types = ["bodyweight"]

    placeholders = ", ".join([f":eq_{i}" for i in range(len(equipment_types))])
    params = {f"eq_{i}": eq for i, eq in enumerate(equipment_types)}

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                f"""
                SELECT id, name, category, muscle_group, equipment, description,
                       instructions, form_cues, common_mistakes, muscles_primary,
                       muscles_secondary, difficulty_level, movement_pattern, video_url
                FROM exercises
                WHERE equipment IN ({placeholders})
                ORDER BY movement_pattern, name
            """
            ),
            params,
        ).fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "muscle_group": row[3],
            "equipment": row[4],
            "description": row[5],
            "instructions": row[6],
            "form_cues": row[7],
            "common_mistakes": row[8],
            "muscles_primary": row[9],
            "muscles_secondary": row[10],
            "difficulty_level": row[11],
            "movement_pattern": row[12],
            "video_url": row[13],
        }
        for row in rows
    ]


def get_exercises_by_movement_pattern(pattern: str) -> List[Dict[str, Any]]:
    """Get exercises filtered by movement pattern."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, name, category, muscle_group, equipment, description,
                       difficulty_level, movement_pattern
                FROM exercises
                WHERE movement_pattern = :pattern
                ORDER BY difficulty_level, name
            """
            ),
            {"pattern": pattern},
        ).fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "muscle_group": row[3],
            "equipment": row[4],
            "description": row[5],
            "difficulty_level": row[6],
            "movement_pattern": row[7],
        }
        for row in rows
    ]


def get_exercise_coaching(exercise_id: int) -> Dict[str, Any]:
    """Get full coaching content for an exercise."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, name, category, muscle_group, equipment, description,
                       instructions, form_cues, common_mistakes, muscles_primary,
                       muscles_secondary, difficulty_level, movement_pattern, video_url
                FROM exercises
                WHERE id = :id
            """
            ),
            {"id": exercise_id},
        ).fetchone()

    if not row:
        return {"error": "Exercise not found"}

    return {
        "id": row[0],
        "name": row[1],
        "category": row[2],
        "muscle_group": row[3],
        "equipment": row[4],
        "description": row[5],
        "instructions": row[6],
        "form_cues": row[7],
        "common_mistakes": row[8],
        "muscles_primary": row[9],
        "muscles_secondary": row[10],
        "difficulty_level": row[11],
        "movement_pattern": row[12],
        "video_url": row[13],
    }


if __name__ == "__main__":
    count = seed_exercises()
    print(f"Seeded {count} exercises with coaching content")
