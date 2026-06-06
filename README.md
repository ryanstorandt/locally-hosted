# Locally Hosted — AI Video Episodes

> **AI-generated video episodes with transcripts. Running entirely on local hardware.**

## Live Demo

Visit the site: [ryanstorandt.github.io/locally-hosted](https://ryanstorandt.github.io/locally-hosted/)

## What It Does

Submit a tech article (arXiv paper, GitHub repo, blog post, Hacker News) and the pipeline transforms it into a two-host podcast video — generated entirely on local hardware (NVIDIA DGX Spark).

### Pipeline Steps

1. **Fetches & parses** the article content
2. **Generates scene prompts** via local LLM (Ollama/Qwen3) — cinematic descriptions
3. **Generates a 2-host podcast script** (host + expert dialogue) with intro/outro branding
4. **Generates video clips** via CogVideoX (2B, 5B, or 1.5-5B) — 6 sec per scene
5. **Generates podcast audio** via Microsoft VibeVoice (local neural TTS with voice cloning) + broadcast mastering (-16 LUFS)
6. **Generates closed captions** (SRT) with per-speaker timestamps
7. **Merges** everything into a YouTube-ready episode with thumbnail, metadata, and shorts clip

## Features

- **AI Agent** — In-browser AI assistant powered by WebLLM with model picker (SmolLM2, TinyLlama, Gemma3, Llama 3.2)
- **Voice dictation** — Speak your question with the mic button (Web Speech API, fully in-browser)
- **Spoken replies** — Optional text-to-speech read-aloud of agent answers (`speechSynthesis`), with a voice picker that prefers the most natural voice your browser offers (Edge neural / Google) and lets you switch; toggle on/off or replay any message
- **Model Picker** — Defaults to the lightweight **SmolLM2 135M (0.3GB)** so it loads fast and runs reliably on phones; pick a larger model anytime (SmolLM2 360M, TinyLlama 1.1B, Gemma3 1B, Llama 3.2 1B)
- **WebGPU-accelerated** — Runs entirely in your browser, no API keys needed
- **Works offline** after first model download
- **Podcast Wiki** — Browse episodes with table/cards view, suggest topics via GitHub Discussions

Requires Chrome 113+ or Edge 113+ with WebGPU support. If your browser supports WebGPU, simply open the site and click **Start Chatting** to download and use the AI model.

## Tech Stack

- **Web App**: Static GitHub Pages (HTML/CSS/JS)
- **In-browser AI**: [WebLLM](https://github.com/mlc-ai/web-llm) + model picker (SmolLM2, TinyLlama, Gemma3, Llama 3.2)
- **Video Pipeline**: [ai-video-pipeline](https://github.com/ryanstorandt/ai-video-pipeline) — NVIDIA DGX Spark
- **AI Video Generation**: [CogVideoX](https://github.com/THUDM/CogVideo) (2B, 5B, or 1.5-5B) — local Docker container
- **Voice Synthesis**: [Microsoft VibeVoice](https://github.com/microsoft/VibeVoice) (local neural TTS with voice cloning) + broadcast mastering (-16 LUFS)
- **LLM**: [Ollama](https://github.com/ollama/ollama) / [Qwen3](https://github.com/QwenLM/Qwen) — local prompt generation for scene descriptions and scripts
- **Episode List**: [episodes.json](episodes.json)

## Adding episodes

Episode metadata lives in [episodes.json](episodes.json). You don't write it by
hand — generate a record straight from the YouTube link with the included script
(no API key, no dependencies; it scrapes the public watch page for title,
description, tags, and publish date, then cleans them the same way the catalog
was built):

```bash
# Append a new episode (prepended newest-first, id auto-incremented)
node scripts/add-episode.mjs "https://www.youtube.com/watch?v=VIDEO_ID" \
  --short "https://www.youtube.com/shorts/SHORT_ID"   # optional Shorts link

# Preview the record without writing the file
node scripts/add-episode.mjs "https://youtu.be/VIDEO_ID" --dry
```

Options: `--short <url>`, `--spotify <url>`, `--source <url>` (override the
auto-detected source link), `--dry` (print only), `--json <path>`.

**Or fully hands-off:** run the **Add episode** GitHub Action
(Actions tab → *Add episode* → *Run workflow*), paste the YouTube URL, and it
appends to `episodes.json` and commits for you — GitHub Pages redeploys with the
new episode. See [.github/workflows/add-episode.yml](.github/workflows/add-episode.yml).

## Browser Models

Models are stored **in your browser**, not on this machine:

### Clear downloaded models

**Chrome DevTools (verified):**
1. Open DevTools (F12) → Application → Storage → **Clear site data** → Confirm

**Chrome address bar (verified):**
1. Click the 🔒/ℹ icon left of the address bar
2. **Cookies and site data** → **Manage / Delete** → Delete for `ryanstorandt.github.io`

This wipes all cached models for this site instantly. No restart needed.

To free disk space, use the model picker in the hero to download smaller models (SmolLM2 135M = 0.3GB).

## Contributing

- **Add an episode**: Run `node scripts/add-episode.mjs <youtube_url>` (see [Adding episodes](#adding-episodes)) → submit a pull request
- **Suggest a topic**: Open a [GitHub Discussion](https://github.com/ryanstorandt/locally-hosted/discussions)
