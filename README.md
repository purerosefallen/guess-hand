# guess-hand

A project guessing starting hand of YGOPro from current timestamp.

## What is this

YGOPro generates starting hands from the current timestamp. This project would generate a set of starting hand each seconds, and you may choose your starting hand by starting the duel at correct time.

As the time duel starts are only controled by the player who won rock-paper-scissors, so if you lose that, this project may not work.

You may also create a custom script to check the starting hand by the system for you.

## Disclaimer

I'm not responsed for what you did with this project. Using this project in tournaments of YGOPro may lead to disqualification.

## How to use

* Make sure `g++` is installed on your system.

* `npm install`

* `npm run install`

* Make a copy of `config.yaml`.

* Make custom scripts if you need.

* Start your match. You have to win the rock-paper-scissors to make this system work, but don't make decision if you go first or next.

* If you wish to go first, just run. If wish to go second, you have to check the opponent's deck count and write it into `config.yaml`.

* `npm run start`

* When your favorite starting hand appears, start your duel.

* That's it!
