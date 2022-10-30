# Memo - Spaced Repetition for Roam

Memorize anything with this simple spaced repetition plugin for Roam. Similar to [Anki](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html), it uses a modified version of the [SuperMemo 2](https://super-memory.com/english/ol/sm2.htm) (SM2) Algorithm under the hood.

![Demo Preview](https://user-images.githubusercontent.com/1279335/189250105-656e6ba3-7703-46e6-bc71-ee8c5f3e39ab.gif)

## What is "Spaced Repetition"

It's like studying with flashcards but much more efficiently. One way study flashcards is to djust review every card in order from front to back over and over. This works but it's highly inefficient because there are obviously some cards that you remember better than others. So spaced repetition is a technique of deciding "when" you should review a card next.

You decide when to review again based on how hard/easy a card was to remember. The algorithm calculates the amount of time (or "space") you can have before you need to review it again (ideally right before you forget). So if you imagine a deck of flash cards you're reviewing.. Cards that were easy to remember you move further back in the deck. Cards that were harder you move somewhere in the middle. Cards you forgot you move back 1 or two cards so you'll review them again soon.

This Memo plugin let's you tag blocks that you never want to forget #[[🐘 Review]] and over time you'll review it and progressively move it from short ➞ long term memory.

## Installation

Just install through Roam Depot, then go to settings and configure the page tags you want to use for reviews (default is `#memo`) and that's it. Enjoy.

## Features

- Multi Tag Support (aka decks)
- Text Masking (or cloze deletion)
  > To mask a part of text just highlight it `^^hide me^^` or wrap it in single brackets `{hide me too}`
- Keyboard shortcuts
- Toggle Breadcrumbs Hints
- Sidepanel Widget
- Next Interval Previews
- Skip controls

## Coming Soon

- Old RoamSr Migration Tool
- Daily Limit Controls
- History Explorer

## Bug Reports and Feature Requests

Please just create issues [here](https://github.com/digitalmaster/roam-memo/issues) and I'll get to them as soon as I can.

I build this primarily for my own personal use but I hope you find it useful too 🤓
