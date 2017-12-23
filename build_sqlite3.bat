@echo off
cd /d %~dp0
cd /d node_modules\sqlite3
call npm install
call npm run prepublish
call node-gyp configure --module_name=node_sqlite3 --module_path=../lib/binding/node-v47-win32-ia32
call node-gyp rebuild --target=0.36.4 --arch=ia32 --target_platform=win32 --dist-url=https://atom.io/download/atom-shell --module_name=node_sqlite3 --module_path=../lib/binding/node-v47-win32-ia32
cd /d %~dp0
exit /B 0
