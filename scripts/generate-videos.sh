#!/bin/bash

# Video generation script for 9 survey screens
# Usage: ./generate-videos.sh [screen-id]
# Examples:
#   ./generate-videos.sh              # Generate all 9 videos
#   ./generate-videos.sh cold-open    # Generate single video

set -e

# Configuration
MODEL="falai/wan-2-5-i2v"
OUTPUT_DIR="./public/videos"
SETS_DIR="./public/sets"
FFMPEG_OPTS="-y -i input.mp4 -vcodec libx264 -crf 23 -vf scale=1280:720 -movflags +faststart -an output.mp4"
SIZE_BUDGET_MB=1.5
STYLE_SUFFIX="TV game show production, saturated studio lighting, 16:9 broadcast, shallow depth of field, cinematic color grade"

# Screen definitions: screen_id|image_file|prompt
declare -a SCREENS=(
  "cold-open|cold-open-glitch.webp|wide shot, slow zoom in, glitchy game show stage powering on, lights flickering to life, board illuminating"
  "welcome|morning-desk.webp|medium shot, slow pan right, morning show desk, studio lights warming up, subtle camera drift"
  "feud-top3|feud-board.webp|wide shot, static then slow dolly in, Family Feud board center stage, answer slots visible, stage lights sweep"
  "bachelor-roses|bachelor-mansion.webp|wide shot, low angle, slow crane up, mansion interior, candelabras, rose petals catching light"
  "bachelor-limo|limo-interior.webp|wide shot interior, slow continuous tracking, left third features host speaking, right two-thirds empty dark leather seating"
  "shark-invest|shark-warehouse.webp|wide master shot, industrial pitch warehouse, far left third features billionaire investor, entire right side shadowed negative space void"
  "survivor|tribal-council.webp|medium shot, slow push in, tribal council, torches flickering, jungle ambiance, intimate confessional"
  "maury|maury-studio.webp|brightly lit talk show studio, left third features energetic talk show host looking into lens, right two-thirds vast empty studio space"
  "credits|credits-bg.webp|wide shot, slow pull out, empty studio, lights dimming one by one, wrap-up energy"
)

# Helper: Log with timestamp
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Helper: Generate single video
generate_video() {
  local screen_id="$1"
  local image_file="$2"
  local prompt="$3"

  local image_path="${SETS_DIR}/${image_file}"
  local output_file="${OUTPUT_DIR}/${screen_id}.mp4"
  local temp_raw="${OUTPUT_DIR}/.${screen_id}_raw.mp4"

  # Validate input file exists
  if [[ ! -f "$image_path" ]]; then
    log "ERROR: Image not found: $image_path"
    return 1
  fi

  # Append style suffix to prompt
  local full_prompt="${prompt}, ${STYLE_SUFFIX}"

  log "Generating: $screen_id"
  log "  Image: $image_file"
  log "  Prompt: $full_prompt"

  # Call infsh CLI for image-to-video
  if ! /mnt/c/Users/nikhi/.local/bin/infsh.exe i2v \
    --model "$MODEL" \
    --image "$image_path" \
    --prompt "$full_prompt" \
    --output "$temp_raw"; then
    log "ERROR: infsh i2v failed for $screen_id"
    return 1
  fi

  # Compress with ffmpeg
  if ! ffmpeg $FFMPEG_OPTS \
    -i "$temp_raw" \
    "$output_file" 2>&1 | grep -E "frame=|error"; then
    log "ERROR: ffmpeg compression failed for $screen_id"
    rm -f "$temp_raw" "$output_file"
    return 1
  fi

  # Clean up temp file
  rm -f "$temp_raw"

  # Report file size
  if [[ -f "$output_file" ]]; then
    local size_bytes=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    local size_mb=$(echo "scale=2; $size_bytes / 1024 / 1024" | bc)

    log "DONE: $screen_id -> $output_file ($size_mb MB)"

    if (( $(echo "$size_mb > $SIZE_BUDGET_MB" | bc -l) )); then
      log "WARNING: File size ${size_mb}MB exceeds budget of ${SIZE_BUDGET_MB}MB"
    fi
  else
    log "ERROR: Output file not created: $output_file"
    return 1
  fi

  return 0
}

# Main
main() {
  mkdir -p "$OUTPUT_DIR"

  if [[ $# -eq 0 ]]; then
    # Generate all screens
    log "Generating all 9 videos..."
    local failed=0

    for screen_def in "${SCREENS[@]}"; do
      IFS='|' read -r screen_id image_file prompt <<< "$screen_def"
      if ! generate_video "$screen_id" "$image_file" "$prompt"; then
        ((failed++))
      fi
    done

    log "========================================="
    log "Batch complete: $((${#SCREENS[@]} - failed))/${#SCREENS[@]} succeeded"
    if [[ $failed -gt 0 ]]; then
      log "Failed: $failed"
      exit 1
    fi
  else
    # Generate single screen
    local target_id="$1"
    local found=0

    for screen_def in "${SCREENS[@]}"; do
      IFS='|' read -r screen_id image_file prompt <<< "$screen_def"
      if [[ "$screen_id" == "$target_id" ]]; then
        found=1
        if ! generate_video "$screen_id" "$image_file" "$prompt"; then
          exit 1
        fi
        break
      fi
    done

    if [[ $found -eq 0 ]]; then
      log "ERROR: Unknown screen ID: $target_id"
      log "Valid IDs: $(printf '%s ' "${SCREENS[@]}" | grep -oE '^[^|]*' | tr '\n' ', ' | sed 's/,$//')"
      exit 1
    fi
  fi
}

main "$@"
