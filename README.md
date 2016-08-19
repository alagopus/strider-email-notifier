# strider-email-notifier
[![Build Status](https://travis-ci.org/Strider-CD/strider-email-notifier.svg?branch=master)](https://travis-ci.org/Strider-CD/strider-email-notifier)

This plugin enables email notifications to be sent on build success or failure.

[![NPM](https://nodei.co/npm/strider-email-notifier.png?downloads=true&stars=true)](https://nodei.co/npm/strider-email-notifier/)

## Configuration Options

By default, email notifications will only be sent when the status of the build changes. i.e when it moves from a successful to a failed state or from a failed to a successful state.

You can change this by selecting "Always send notification emails" within the plugin options.
