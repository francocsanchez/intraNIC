@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\reset-backend.ps1" %*
