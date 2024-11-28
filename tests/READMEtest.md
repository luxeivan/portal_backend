1) Установка k6:
Windows (Chocolatey): choco install k6
Linux (Debian/Ubuntu): sudo apt install k6

2) затем переходим к cd tests



3) k6 run loadTest.js --summary-export=summary.json

4) после того как закончит

node processResults.js        