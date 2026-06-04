# Locally Hosted

AI-generated video episodes with transcripts. Running entirely on local hardware.

## What is this?

Each episode is a video created from an article or GitHub repo, with:
- **AI-generated video** scenes (CogVideoX on local GPU)
- **Podcast-style narration** (local TTS)
- **Full transcript** for accessibility
- **YouTube embed** when available
- **Audio-only** version for listening on the go

## How it works

1. Articles from [arXiv](https://arxiv.org/), [GitHub Trending](https://github.com/trending), [Hacker News](https://news.ycombinator.com/), etc. are fetched
2. Content is analyzed and broken into video scenes with AI-generated visuals
3. A podcast script is written and converted to speech locally
4. The final video + audio + transcript are published here

## Tech Stack

- **Video generation**: CogVideoX (local NVIDIA GPU)
- **Text-to-speech**: VibeVoice / Edge TTS (local)
- **LLM processing**: Local models for script generation
- **Hosting**: GitHub Pages (this site)

## Source

Built with the [Local Video Pipeline](https://github.com/ryanstorandt/ai-video-pipeline)

---

*All content generated locally. No cloud APIs used for content creation.*
