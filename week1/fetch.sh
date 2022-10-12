#!/bin/bash
for i in {1..100}
do
    response=$(curl cse4260.trafficmanager.net/currenttime.txt)
    echo "$i: $response"
    sleep 10
done
