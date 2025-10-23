#!/bin/bash
# Startup script for Phusion Passenger

cd "$(dirname "$0")"
npm install
node server.js

