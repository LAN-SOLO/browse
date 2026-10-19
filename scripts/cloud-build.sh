#!/usr/bin/env bash
# On-demand Chromium build on Hetzner Cloud (decision: docs/BUILD-RUNNER.md).
# Lifecycle: create CCX63 → fetch/patch/build browse (Linux x64) → download
# artifact → destroy server. Optionally snapshots the checkout as a cache so
# later runs skip the multi-hour initial sync.
#
# Prerequisites:
#   - hcloud CLI (brew install hcloud) and HCLOUD_TOKEN (or an active
#     `hcloud context`) for the browse Hetzner Cloud project
#   - an SSH public key at ~/.ssh/id_ed25519.pub (uploaded automatically)
#
# Usage:
#   cloud-build.sh [--yes] [--keep] [--snapshot]
#     --yes       skip the cost confirmation prompt
#     --keep      leave the server running afterwards (debugging)
#     --snapshot  after a successful build, snapshot the server as
#                 checkout cache for future runs (~200 GB, few €/month)
#
# NOTE: first run is expected to be supervised — initial fetch + build take
# several hours (server cost ~€1.37/h, i.e. a full first run ≈ €5-8).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="browse-builder-$$"
TYPE="ccx63"
BASE_IMAGE="ubuntu-24.04"
CACHE_SELECTOR="browse=builder-cache"
SSH_KEY_NAME="browse-builder"
REPO_URL="https://github.com/LAN-SOLO/browse.git"
ARTIFACTS="$ROOT/artifacts"
# The server builds exactly the local HEAD commit. It must be pushed — the
# server clones from GitHub and refuses to build anything else (before, it
# silently built whatever origin/main happened to be).
REV="$(git -C "$ROOT" rev-parse HEAD)"

YES=0; KEEP=0; SNAPSHOT=0
for arg in "$@"; do
  case "$arg" in
    --yes) YES=1 ;;
    --keep) KEEP=1 ;;
    --snapshot) SNAPSHOT=1 ;;
    *) echo "usage: cloud-build.sh [--yes] [--keep] [--snapshot]" >&2; exit 1 ;;
  esac
done

command -v hcloud >/dev/null || { echo "cloud-build: hcloud CLI missing (brew install hcloud)" >&2; exit 1; }
hcloud server list >/dev/null || { echo "cloud-build: hcloud not authenticated (HCLOUD_TOKEN / hcloud context)" >&2; exit 1; }

# ssh key
if ! hcloud ssh-key describe "$SSH_KEY_NAME" >/dev/null 2>&1; then
  PUB="$HOME/.ssh/id_ed25519.pub"
  [[ -f "$PUB" ]] || { echo "cloud-build: no $PUB — create one (ssh-keygen -t ed25519)" >&2; exit 1; }
  hcloud ssh-key create --name "$SSH_KEY_NAME" --public-key-from-file "$PUB" >/dev/null
  echo "cloud-build: uploaded ssh key as '$SSH_KEY_NAME'"
fi

# cached checkout snapshot?
IMAGE="$BASE_IMAGE"
FRESH=1
CACHE_ID="$(hcloud image list --type snapshot --selector "$CACHE_SELECTOR" -o noheader -o columns=id | head -1 || true)"
if [[ -n "$CACHE_ID" ]]; then
  IMAGE="$CACHE_ID"
  FRESH=0
  echo "cloud-build: using checkout-cache snapshot $CACHE_ID"
fi

if [[ "$YES" -ne 1 ]]; then
  echo "cloud-build: about to create a $TYPE (~€1.37/h) from image '$IMAGE'."
  read -r -p "cloud-build: proceed? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "aborted"; exit 1; }
fi

git -C "$ROOT" branch -r --contains "$REV" 2>/dev/null | grep -q . \
  || echo "cloud-build: WARNING — $REV is not on any remote branch you fetched; push it first or the remote checkout fails" >&2

# Fresh known_hosts per run: Hetzner recycles IPs, so a stale entry for a
# previous server on the same IP made StrictHostKeyChecking abort the run, and
# the user's own ~/.ssh/known_hosts filled up with throwaway servers.
KNOWN_HOSTS="$(mktemp "${TMPDIR:-/tmp}/browse-cloud-known_hosts.XXXXXX")"
IP=""
cleanup() {
  rm -f "$KNOWN_HOSTS"
  # also runs when create/ip failed half-way: never leave a billed server behind
  hcloud server describe "$NAME" >/dev/null 2>&1 || return 0
  if [[ "$KEEP" -eq 1 ]]; then
    echo "cloud-build: --keep set, server $NAME (${IP:-?}) stays up — DELETE IT YOURSELF (hcloud server delete $NAME)"
  else
    echo "cloud-build: deleting server $NAME"
    hcloud server delete "$NAME" >/dev/null || echo "cloud-build: WARNING — delete failed, remove $NAME manually!" >&2
  fi
}
# installed BEFORE the server exists, so a failing `server ip` cannot leak it
trap cleanup EXIT

echo "cloud-build: creating server $NAME"
hcloud server create --name "$NAME" --type "$TYPE" --image "$IMAGE" \
  --ssh-key "$SSH_KEY_NAME" --label browse=builder >/dev/null
IP="$(hcloud server ip "$NAME")"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o "UserKnownHostsFile=$KNOWN_HOSTS" -o ConnectTimeout=10)
SSH=(ssh "${SSH_OPTS[@]}" "root@$IP")
echo "cloud-build: waiting for ssh on $IP"
for _ in $(seq 1 30); do "${SSH[@]}" true 2>/dev/null && break; sleep 5; done
"${SSH[@]}" true || { echo "cloud-build: ssh never came up" >&2; exit 1; }

echo "cloud-build: starting remote build (this takes hours — log streams below)"
"${SSH[@]}" bash -s -- "$FRESH" "$REPO_URL" "$REV" <<'REMOTE'
set -euo pipefail
FRESH="$1"; REPO_URL="$2"; REV="$3"
export DEBIAN_FRONTEND=noninteractive
if [[ "$FRESH" -eq 1 ]]; then
  apt-get update -q && apt-get install -y -q git curl python3 pkg-config unzip file lsb-release sudo
  git clone "$REPO_URL" /opt/browse
else
  git -C /opt/browse fetch origin
fi
git -C /opt/browse checkout -q --detach "$REV"
echo "remote: building browse at $(git -C /opt/browse log -1 --format='%h %s')"
cd /opt/browse
./scripts/fetch-chromium.sh
if [[ "$FRESH" -eq 1 ]]; then
  # Chromium's own dependency installer (first run only)
  ./chromium/src/build/install-build-deps.sh --no-prompt || ./chromium/src/build/install-build-deps.sh
fi
./scripts/apply-patches.sh
./scripts/build.sh linux
OUT=chromium/src/out/browse-linux
"$OUT/chrome" --version || true
tar czf /tmp/browse-linux.tar.gz -C "$OUT" \
  chrome chrome_sandbox chrome_crashpad_handler icudtl.dat snapshot_blob.bin \
  v8_context_snapshot.bin resources.pak chrome_100_percent.pak chrome_200_percent.pak locales
echo "remote: artifact ready at /tmp/browse-linux.tar.gz"
REMOTE

mkdir -p "$ARTIFACTS"
scp "${SSH_OPTS[@]}" "root@$IP:/tmp/browse-linux.tar.gz" \
  "$ARTIFACTS/browse-linux-$(tr -d '[:space:]' < "$ROOT/chromium_version.txt").tar.gz"
echo "cloud-build: artifact downloaded to $ARTIFACTS/"

if [[ "$SNAPSHOT" -eq 1 ]]; then
  echo "cloud-build: creating checkout-cache snapshot (takes a while)"
  hcloud server poweroff "$NAME" >/dev/null
  hcloud server create-image --type snapshot --description "browse builder cache" \
    --label "$CACHE_SELECTOR" "$NAME" >/dev/null
  echo "cloud-build: snapshot created (old ones: clean up manually to save storage cost)"
fi

echo "cloud-build: done"
