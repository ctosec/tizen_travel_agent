#!/bin/bash
# Wrapper for Tizen CLI that bypasses tizen.bat (hangs in Git Bash)
# Usage: ./tizen-cli.sh <command> [args...]

CP=""
for f in "C:/tizen-studio/tools/ide/lib-ncli/"*.jar; do
  CP="$CP;$f"
done
CP="$CP;C:/tizen-studio/library/sdk-utils-core.jar"

"C:/tizen-studio/jdk/bin/java.exe" \
  -Dlog4j.configurationFile="log4j-progress.xml" \
  -Djava.library.path="C:/tizen-studio/tools/ide/lib-ncli/spawner" \
  -cp "C:/tizen-studio/tools/ide/conf-ncli$CP" \
  org.tizen.ncli.ide.shell.Main \
  "$@" \
  --current-workspace-path "$(pwd -W 2>/dev/null || pwd)" 2>&1 | grep -v "^2026-\|DEBUG\|WARN\| INFO \|^\tat \|interpolation\|sys:logger\|sys:installer\|^$"
