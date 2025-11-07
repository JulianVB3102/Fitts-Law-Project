-- Drop and recreate for a clean start
DROP TABLE IF EXISTS trials;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS participants;

CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age INTEGER,
    gender TEXT,
    handedness TEXT,
    arthritis TEXT,
    vision TEXT,
    avg_weekly_computer_usage TEXT,
    plays_fps_pc_games TEXT,
    mouse_or_trackpad_user TEXT,
    dpi_feeling TEXT,
    avg_weekly_exercise TEXT
);

CREATE TABLE blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER REFERENCES participants(id),
    started_at REAL,
    finished_at REAL
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diameter INTEGER,
    distance INTEGER,
    direction TEXT
);
--added block and task for data integrity (makes sure everything added points to an existing block and task)
CREATE TABLE trials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER REFERENCES blocks(id),
    task_id INTEGER REFERENCES tasks(id),
    started_at REAL,
    finished_at REAL,
    distance_travelled REAL,
    errors INTEGER
);
--added rows to bring it from 12 to 32 in accordance with professor's instructions
-- 32 tasks total = 4 widths × 4 distances × 2 directions
-- widths (diameters): 24, 36, 48, 72
-- distances: 150, 250, 350, 450
-- directions: left / right

INSERT INTO tasks (diameter, distance, direction) VALUES
-- 24 px
(24,150,'left'), (24,150,'right'),
(24,250,'left'), (24,250,'right'),
(24,350,'left'), (24,350,'right'),
(24,450,'left'), (24,450,'right'),

-- 36 px
(36,150,'left'), (36,150,'right'),
(36,250,'left'), (36,250,'right'),
(36,350,'left'), (36,350,'right'),
(36,450,'left'), (36,450,'right'),

-- 48 px
(48,150,'left'), (48,150,'right'),
(48,250,'left'), (48,250,'right'),
(48,350,'left'), (48,350,'right'),
(48,450,'left'), (48,450,'right'),

-- 72 px
(72,150,'left'), (72,150,'right'),
(72,250,'left'), (72,250,'right'),
(72,350,'left'), (72,350,'right'),
(72,450,'left'), (72,450,'right');
