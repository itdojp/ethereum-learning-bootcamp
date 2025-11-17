#!/usr/bin/env bash
jq -r '[.network,.txHash,.gasUsed,.feeEth,.latencyMs] | @csv'
