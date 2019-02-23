#!/usr/bin/env bash

if [ -z "$1" ] 
  then
    echo "Usage ./pay-cycle.sh cycle"
    exit 1
fi
cycle=$1
transactions_file=./cycle-$cycle

echo "Generating transactions file"
./tzscan-parse-rewards.js $cycle > $transactions_file
## check if backerei returns ok
parseReturnVal=$?
if [ $parseReturnVal -ne 0 ]; then
    echo "Error while running parse"
    cat $transactions_file
    exit $parseReturnVal
fi


echo "Running payment script"
./pay.sh --use bakepay --transactions-file $transactions_file