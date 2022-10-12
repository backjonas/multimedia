#!/bin/bash
for i in {1..100}
do
    response=$(curl cse4260storage.blob.core.windows.net/cse4260blob/currenttime.txt)
    echo "$i: $response"
    sleep 10
done
