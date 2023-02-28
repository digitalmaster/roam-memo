# Memo - Spaced Repetition for Roam

Memorize anything with this simple spaced repetition plugin for Roam. Similar to [Anki](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html), it uses a modified version of the [SuperMemo 2](https://super-memory.com/english/ol/sm2.htm) (SM2) Algorithm under the hood.

![Demo Preview](https://user-images.githubusercontent.com/1279335/189250105-656e6ba3-7703-46e6-bc71-ee8c5f3e39ab.gif)

## What is "Spaced Repetition"

Spaced repetition is a technique for studying where you review flashcards based on how well you remember them. Instead of reviewing every card in order, you review cards that were harder to remember more often, and cards that were easier to remember less often. This helps you review the cards that you need to work on more, and avoid wasting time reviewing cards that you already know well.

This plugin allows you to tag important information with a special tag, and over time it will help you move the information from short term memory to long term memory.

## Installation

Just install through Roam Depot, then go to settings and configure the page tags you want to use for reviews (default is `#memo`) and that's it. Enjoy.

## Usage

To use the Memo plugin for studying flashcards:

1. Create a new page and add the #memo tag to it.
2. Open the plugin from the side panel.
3. Begin reviewing the flashcards.

> If the block nested blocks they will be treated as answers and initially hidden. Click the "Show Answer" button to reveal them.

## Features

### Multi Tag Support (aka decks)

To create separate decs just got to our plugin settings page, find the "Tag Pages" field and add a comma separated list of all the pages you want to use as decks. For example, if you want to create a deck for "Spanish" and another for "French" you would add `Spanish, French` to the field.

> To use tags that have commas in them just wrap them in quotes. For example, "Page, with Comma".

### Text Masking

Text Masking or Cloze Deletion is a technique where you hide or mask a part of the text to test your understanding or to make it harder to memorize. To mask a part of text, you can use two different methods:

- Highlighting the text and adding ^^ on both sides of the text you want to mask. Example: ^^hide me^^
- Wrapping the text with single brackets { }. Example: {hide me too}.

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

If you see any errors, please create an issue [here](https://github.com/digitalmaster/roam-memo/issues);

## Bug Reports and Feature Requests

Please just create issues [here](https://github.com/digitalmaster/roam-memo/issues) and I'll get to them as soon as I can.

I build this primarily for my own personal use but I hope you find it useful too 🤓
