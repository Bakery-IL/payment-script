#!/usr/bin/env bash

if [ -z "$1" ] 
  then
    echo "Usage ./pay-cycle.sh cycle"
    exit 1
fi
cycle=$1
# backerei_output=./cycle-$cycle

# command -v backerei >/dev/null 2>&1 || { echo >&2 "I require backerei but it's not installed.  Aborting."; exit 1; }

backerei payouts

## check if backerei returns ok
backereiReturnVal=$?
if [ $backereiReturnVal -ne 0 ]; then
    echo "Error while running backerei"
    exit $backereiReturnVal
fi


./generate_pay_input $cycle ~/.backerei.json > $backerei_output

## check if backerei returns ok
generateReturnVal=$?
if [ $generateReturnVal -ne 0 ]; then
    echo "Error while running generate"
    cat $backerei_output
    exit $backereiReturnVal
fi


./pay.sh --use bakepay --transactions-file $backerei_output