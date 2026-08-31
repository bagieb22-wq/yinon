@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo מתניע את השרת של הסימולטור...
start http://localhost:3000
node server.js
pause
