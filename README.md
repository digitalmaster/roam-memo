# Memo - Spaced Repetition for Roam

Memorize anything with this simple spaced repetition plugin for Roam. Similar to [Anki](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html), it uses a modified version of the [SuperMemo 2](https://super-memory.com/english/ol/sm2.htm) (SM2) Algorithm under the hood.

![Demo Preview](https://user-images.githubusercontent.com/1279335/189250105-656e6ba3-7703-46e6-bc71-ee8c5f3e39ab.gif)

## What is "Spaced Repetition"?

Spaced repetition is a study technique where you review information based on how well you remember it. Instead of reviewing all cards equally, you focus more on difficult cards and less on easy ones. This method helps you reinforce material that needs more attention, saving time on reviewing familiar content.

It's the most effective method for transferring a large amount of knowledge from short-term to long-term memory.

## Installation

Just install "Memo" via Roam Depot.

## Getting Started

1. Tag any block you wish to memorize with `#memo` (or any of your configured tags).
2. Launch the app by clicking the "Review" button in the sidebar.
3. Start reviewing the flashcards.

> **Tip:** Child blocks are treated as "answers" and are initially hidden. Click "Show Answer" to reveal them.

## Features

### Multi Deck Support

Create multiple decks by navigating to the plugin settings and entering a comma-separated list of tags in the "Tag Pages" field. For example, use `Spanish, French` to establish decks for each language you're learning.

> **Tip:** For tags names that contain commas, enclose them in quotes, e.g., "Page, with Comma".

### Text Masking

Text masking, or Cloze Deletion, challenges your recall by hiding parts of the text. Apply text masking by:

- Enclosing the desired text with `^^`, e.g., `^^hide me^^`.
- Or, using braces `{}`, e.g., `{hide me too}`.

### Daily Limits

You can set a daily review limit. This is useful if you want to limit the time you spend reviewing cards. We ensure at least ~25% of cards are new cards to keep things balanced.

You can set the daily limit in the plugin settings page.

### Cram Mode

When you're done reviewing all due cards in a deck you can choose to continue in "Cram Mode". This will let you review all the cards in the deck regardless of when they are due. This is useful if you're studying for an exam and can't wait for the cards to become due. Reviewing cards in this mode do not affect spaced reptition scheduling.

### Keyboard Shortcuts

| Action                | Shortcut   |
| --------------------- | ---------- |
| Show answer           | `space`    |
| Skip a card           | `s` or `→` |
| Go back               | `←`        |
| Show breadcrumbs      | `b`        |
| Grade: perfect        | `space`    |
| Grade: forgot it      | `f`        |
| Grade: If it was hard | `h`        |
| Grade: If it was good | `g`        |

### Command Palette Action

You can start a review session from the command palette (`CMD + P`) by typing "Memo: Start Review Session".

### RoamSr Migration Tool

To migrate your data from the old RoamSr plugin follow these steps:
<a href="http://www.youtube.com/watch?feature=player_embedded&v=-vTHVknIdX4" target="_blank">
<img src="https://user-images.githubusercontent.com/1279335/220912625-f4cc5ab7-fbf1-4d86-8934-e635ac85ee7b.png" alt="Watch Video Walkthrough" />
</a>

> Note: To be extra safe, I recommend you make a backup of your #roam/memo page before migrating.

1. Generate an API key with write access by following these instructions [here](https://roamresearch.com/#/app/developer-documentation/page/bmYYKQ4vf).
2. Go to the settings page of the plugin and click on the "Launch" button under the "Migrate Roam/Sr Data" section.
3. Enter API key and press "Fetch Preview Data"
4. Review the data. All your old roam/sr data should be displayed in the table. New records should be merged with old ones.
5. If everything looks good, press "Import"

> If you have a lot of data, it might take a while to sync. So go grab coffee.

## Bug Reports and Feature Requests

Please create issues [here](https://github.com/digitalmaster/roam-memo/issues) and I'll get to them as soon as I can.

---

I built this primarily because I wanted it to exist. That said, it brings me great joy to see so many of you finding it useful too 🤓🥰

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H0YPGK)
