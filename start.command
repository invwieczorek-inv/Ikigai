#!/bin/bash
cd ~/Desktop/ikigai
node server.cjs &
sleep 3
open -a Safari http://localhost:3000
