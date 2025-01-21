#!/bin/bash

# Your portfolio repository path
REPO_PATH="/path/to/your/portfolio"
# The file where you store the verse
VERSE_FILE="${REPO_PATH}/bible_verse.txt"

# Fetch a random Bible verse using the Bible API
VERSE=$(curl -s "https://bible-api.com/random?translation=kjv" | jq -r '.text')

# Get the current date
DATE=$(date +'%Y-%m-%d')

# Update the file with the new verse and date
echo "Bible Verse for $DATE:" > $VERSE_FILE
echo "$VERSE" >> $VERSE_FILE

# Navigate to the repository
cd $REPO_PATH

# Check if there are any changes
if [[ $(git status --porcelain) ]]; then
  # Stage the changes
  git add $VERSE_FILE

  # Commit the changes with a date-based message
  git commit -m "Update Bible verse for $DATE"

  # Push the changes to GitHub (replace 'main' with your branch name if necessary)
  git push origin main
else
  echo "No changes to commit."
fi
