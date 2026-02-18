#!/usr/bin/env bash
set -euo pipefail

yarn build
rclone sync dist/ r2:receipt-horse --progress
