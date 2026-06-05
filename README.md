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
5. **Generates podcast audio** via edge-tts with broadcast-standard mastering (-16 LUFS)
6. **Generates closed captions** (SRT) with per-speaker timestamps
7. **Merges** everything into a YouTube-ready episode with thumbnail, metadata, and shorts clip

## Features

- **AI Agent** — In-browser AI assistant powered by WebLLM with model picker (SmolLM2, TinyLlama, Gemma3, Llama 3.2)
- **Model Picker** — Choose from 5 models under 1GB VRAM (SmolLM2 135M/360M, TinyLlama 1.1B, Gemma3 1B, Llama 3.2 1B)
- **WebGPU-accelerated** — Runs entirely in your browser, no API keys needed
- **Works offline** after first model download
- **Podcast Wiki** — Browse episodes with table/cards view, suggest topics via GitHub Discussions

Requires Chrome 113+ or Edge 113+ with WebGPU support. If your browser supports WebGPU, simply open the site and start chatting — the model downloads in the background.

## Tech Stack

- **Web App**: Static GitHub Pages (HTML/CSS/JS)
- **In-browser AI**: [WebLLM](https://github.com/mlc-ai/web-llm) + model picker (SmolLM2, TinyLlama, Gemma3, Llama 3.2)
- **Video Pipeline**: [ai-video-pipeline](https://github.com/ryanstorandt/ai-video-pipeline) — NVIDIA DGX Spark
- **AI Video Generation**: CogVideoX (2B, 5B, or 1.5-5B) — local Docker container
- **Voice Synthesis**: edge-tts with broadcast mastering + podcast audio generation
- **LLM**: Ollama/Qwen3 — local prompt generation for scene descriptions and scripts
- **Episode List**: [episodes.json](episodes.json)

## Contributing

- **Add an episode**: Edit [episodes.json](episodes.json) → submit a pull request
- **Suggest a topic**: Open a [GitHub Discussion](https://github.com/ryanstorandt/locally-hosted/discussions)
