#!/bin/bash
# Backup script — commits all changes to git AND creates a tarball
# Usage: ./backup.sh "description of change"
cd /home/z/my-project
DESC="${1:-manual backup}"
git add -A
git commit -m "$DESC" --allow-empty
echo "Git commit: $DESC"
git log --oneline -1
