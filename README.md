# Locally Hosted

AI-generated video episodes with transcripts. Running entirely on local hardware.

## Try It Live

🌐 **[ryanstorandt.github.io/locally-hosted/](https://ryanstorandt.github.io/locally-hosted/)** — Browse episodes and chat with the AI assistant.

## AI Agent (In-Browser)

This site ships with a **fully browser-native AI assistant** powered by [WebLLM](https://github.com/mlc-ai/web-llm).

- **No API keys** — everything runs in your browser using your GPU
- **No cloud** — your conversations never leave your device
- **WebGPU-accelerated** — uses Phi-3.5-mini-instruct (~2GB, downloads once)
- **Privacy-first** — zero telemetry, zero external API calls
- **Works offline** after first model download

Requires Chrome 113+ or Edge 113+ with WebGPU support. If your browser supports WebGPU, simply open the site and start chatting — the model downloads in the background.

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
- **In-browser AI**: [WebLLM](https://github.com/mlc-ai/web-llm) + Phi-3.5-mini-instruct (WebGPU)
- **Hosting**: GitHub Pages

## Source

Built with the [Local Video Pipeline](https://github.com/ryanstorandt/ai-video-pipeline)

---

*All content generated locally. No cloud APIs used for content creation.*
