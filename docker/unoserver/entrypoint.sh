#!/bin/bash
# Entrypoint for the Stirling-PDF unoserver image.
#
# Responsibilities:
#  - Start Xvfb (LibreOffice Impress/Draw need a display).
#  - Start unoserver with a unique LibreOffice user profile so concurrent
#    instances on the same host don't fight over profile lock files.
#  - Pass through --conversion-timeout so a stuck conversion exits unoserver
#    instead of pegging a CPU forever.
#  - Optionally recycle (restart) unoserver every N successful conversions to
#    bound LibreOffice's memory growth.
set -eu

PORT="${UNOSERVER_PORT:-2003}"
UNO_PORT="${UNOSERVER_UNO_PORT:-2002}"
INTERFACE="${UNOSERVER_INTERFACE:-0.0.0.0}"
CONVERSION_TIMEOUT="${UNOSERVER_CONVERSION_TIMEOUT:-1800}"
# Wall-clock period (seconds) between forced unoserver restarts to bound
# LibreOffice's memory growth. 0 disables the supervisor and unoserver runs
# until it exits on its own. Values below the floor (60s) are clamped to
# avoid restart-thrash from a misconfiguration.
RECYCLE_INTERVAL_SECONDS="${UNOSERVER_RECYCLE_INTERVAL_SECONDS:-0}"
RECYCLE_INTERVAL_FLOOR=60
PROFILE_DIR="${UNOSERVER_PROFILE_DIR:-/var/lib/unoserver/profile}"

log() { printf '%s %s\n' "[unoserver-entrypoint]" "$*" >&2; }

# Validate numeric inputs early so a typo doesn't get baked into the unoserver
# command line where it would surface as a confusing Python traceback.
case "$PORT" in ''|*[!0-9]*) log "Invalid UNOSERVER_PORT='$PORT'"; exit 64 ;; esac
case "$UNO_PORT" in ''|*[!0-9]*) log "Invalid UNOSERVER_UNO_PORT='$UNO_PORT'"; exit 64 ;; esac
case "$CONVERSION_TIMEOUT" in ''|*[!0-9]*) log "Invalid UNOSERVER_CONVERSION_TIMEOUT='$CONVERSION_TIMEOUT'"; exit 64 ;; esac
case "$RECYCLE_INTERVAL_SECONDS" in ''|*[!0-9]*) log "Invalid UNOSERVER_RECYCLE_INTERVAL_SECONDS='$RECYCLE_INTERVAL_SECONDS'"; exit 64 ;; esac

mkdir -p "$PROFILE_DIR"

start_xvfb() {
  if command -v Xvfb >/dev/null 2>&1 && [ -z "${DISPLAY:-}" ]; then
    Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset >/dev/null 2>&1 &
    XVFB_PID=$!
    export DISPLAY=:99
    sleep 1
    log "Xvfb started (pid $XVFB_PID, DISPLAY=$DISPLAY)"
  fi
}

cleanup() {
  trap '' TERM INT EXIT
  if [ -n "${UNOSERVER_PID:-}" ] && kill -0 "$UNOSERVER_PID" 2>/dev/null; then
    log "Stopping unoserver (pid $UNOSERVER_PID)"
    pkill -TERM -P "$UNOSERVER_PID" 2>/dev/null || true
    kill -TERM "$UNOSERVER_PID" 2>/dev/null || true
    wait "$UNOSERVER_PID" 2>/dev/null || true
  fi
  if [ -n "${XVFB_PID:-}" ] && kill -0 "$XVFB_PID" 2>/dev/null; then
    kill -TERM "$XVFB_PID" 2>/dev/null || true
  fi
}
trap cleanup TERM INT EXIT

start_unoserver() {
  log "Starting unoserver on ${INTERFACE}:${PORT} (uno-port ${UNO_PORT}, timeout ${CONVERSION_TIMEOUT}s, profile ${PROFILE_DIR})"
  # NOTE: unoserver expects a plain filesystem path here (it wraps it as a
  # file:// URI internally via pathlib). Passing a pre-wrapped file:// URI
  # makes unoserver 3.6 crash with "relative path can't be expressed as a
  # file URI" because Path('file://...') is parsed as a relative path.
  unoserver \
    --interface "$INTERFACE" \
    --port "$PORT" \
    --uno-port "$UNO_PORT" \
    --user-installation "${PROFILE_DIR}" \
    --conversion-timeout "$CONVERSION_TIMEOUT" \
    2> >(grep --line-buffered -v "POST /RPC2" >&2) \
    &
  UNOSERVER_PID=$!
}

# Recycle supervisor: when RECYCLE_INTERVAL_SECONDS > 0, periodically restart
# unoserver so memory growth in long-lived soffice.bin processes can't
# accumulate. unoserver doesn't expose a request counter externally so this
# is wall-clock based — pick an interval that matches your traffic.
recycle_supervisor() {
  if [ "$RECYCLE_INTERVAL_SECONDS" -le 0 ]; then
    log "Recycle disabled (UNOSERVER_RECYCLE_INTERVAL_SECONDS=0)"
    wait "$UNOSERVER_PID"
    return $?
  fi
  local interval="$RECYCLE_INTERVAL_SECONDS"
  if [ "$interval" -lt "$RECYCLE_INTERVAL_FLOOR" ]; then
    log "Clamping recycle interval ${interval}s up to floor ${RECYCLE_INTERVAL_FLOOR}s"
    interval="$RECYCLE_INTERVAL_FLOOR"
  fi
  log "Recycle enabled: restart every ${interval}s"
  while true; do
    # Poll-based wait. `wait -n` is unreliable here because the unoserver
    # job is wrapped in a `2> >(grep ...)` process substitution which bash
    # sometimes counts as the "next" terminating background job, causing
    # wait -n to return immediately and the recycle to fire instantly.
    # 1s polling drift is fine — recycle intervals are >=60s.
    local elapsed=0
    while [ "$elapsed" -lt "$interval" ]; do
      if ! kill -0 "$UNOSERVER_PID" 2>/dev/null; then
        log "unoserver exited on its own; not recycling"
        wait "$UNOSERVER_PID" 2>/dev/null || true
        return 0
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    log "Recycling unoserver (pid ${UNOSERVER_PID})"
    pkill -TERM -P "$UNOSERVER_PID" 2>/dev/null || true
    kill  -TERM "$UNOSERVER_PID" 2>/dev/null || true
    # Give it 5s to drop, then SIGKILL anything still around.
    for _ in 1 2 3 4 5; do
      kill -0 "$UNOSERVER_PID" 2>/dev/null || break
      sleep 1
    done
    pkill -KILL -P "$UNOSERVER_PID" 2>/dev/null || true
    kill  -KILL "$UNOSERVER_PID" 2>/dev/null || true
    wait "$UNOSERVER_PID" 2>/dev/null || true
    # Reset the LibreOffice profile so a single corrupted state can't survive
    # a restart and re-poison the new instance.
    rm -rf "${PROFILE_DIR:?}"/* 2>/dev/null || true
    start_unoserver
    log "unoserver restarted (pid ${UNOSERVER_PID})"
  done
}

start_xvfb
start_unoserver
recycle_supervisor
