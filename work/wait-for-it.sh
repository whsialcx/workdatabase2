#!/usr/bin/env bash
# wait-for-it.sh

set -e

host="$1"
shift
port="$1"
shift
cmd="$@"

while ! nc -z "$host" "$port"; do
  >&2 echo "Waiting for $host:$port..."
  sleep 2
done

>&2 echo "$host:$port is available - executing command"
exec $cmd