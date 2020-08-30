# ApiServer


* 백그라운드 실행
forever start tssql.js -w -o log/out.log -e log/err.log

* Max Connection 수정
mysql> set global max_connections=500;
mysql> set wait_timeout=60;
