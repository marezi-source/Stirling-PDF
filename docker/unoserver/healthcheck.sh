#!/bin/bash
# Healthcheck for the Stirling-PDF unoserver image.
# Real RPC ping (unoping) — beats a bare TCP listening-socket check because
# the LibreOffice backend can wedge while the XML-RPC server is still bound.
set -eu

PORT="${UNOSERVER_PORT:-2003}"

if command -v unoping >/dev/null 2>&1; then
  unoping --host 127.0.0.1 --port "$PORT" >/dev/null 2>&1
  exit $?
fi

# Fall back to a raw TCP probe if unoping is somehow missing.
exec timeout 2 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/${PORT}"
