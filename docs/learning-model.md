# Learning model

## Daily journey

- **Reviews:** every word whose FSRS `due` time has passed.
- **New words:** a configurable daily limit (default 10), taken from the learning path starting at your chosen level.
- Order: reviews first, then new words in groups of five. You first meet the five words, then recall them in shuffled order.

## Question types

| Type | Used for | Description |
| --- | --- | --- |
| Meaning | New or weak words | See the English word, pick the Vietnamese meaning; distractors share the part of speech |
| Picture cloze | New or weak words | Illustration plus an example with a gap; pick the English word; distractors are spelled similarly |
| Listening | All stages | Hear the pronunciation only and pick the word |
| Spelling | Words with higher stability | Spell from the picture and meaning; letter hints are available (a hinted answer counts as Hard at best) |

## Grading and FSRS

Within a session only the **first answer** to each word updates its memory state (ts-fsrs, FSRS-6, default target retention 90%):

- wrong → Again
- right but slow, or with a hint → Hard
- right → Good; fast and correct spelling → Easy

A missed word comes back a few questions later with a different question type (at most twice). Retries are not graded and do not affect accuracy.

"Mastered" means the card is in the FSRS review state with a stability of at least 21 days.

## Typing studio

Typing practice trains output only and never changes the memory state. WPM counts one word per five correct characters.

## Leaderboard

The leaderboard (Vietnamese edition) ranks the study group by answers in the last seven days, words mastered, words learned or current streak. It reads the public summary each device uploads with its progress; see [`src/store/stats.ts`](../src/store/stats.ts).
