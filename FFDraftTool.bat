@echo off
REM === CHANGE THIS TO YOUR PROJECT FOLDER ===
cd /d "C:\Users\jdori\Documents\jdorigo10-Repos\FantasyWarRoom"

REM === Start the dev server in a new window ===
start cmd /k npm run dev

REM === Give the server a moment to start ===
timeout /t 3 >nul

REM === Open browser ===
start http://localhost:5000/