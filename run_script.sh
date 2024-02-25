#!/bin/bash
directory="logs"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Check if the directory exists
if [ ! -d "$directory" ]; then
    # Create the directory if it does not exist
    mkdir -p "$directory"
    echo "Directory created: $directory"
else
    echo "Directory already exists: $directory"
fi

# Execute commands with the current date in the log filenames
npm run start | tee "logs/checkData-${DATE}.log"
node checkNoti.js | tee "logs/checkNoti-${DATE}.log"
