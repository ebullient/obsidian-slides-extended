# reveal.js Elapsed-Time-Bar Plugin

A [reveal.js](https://github.com/hakimel/reveal.js) plugin adding progress bar of elapsed time,
inspired by [rabbit](https://github.com/rabbit-shocker/rabbit).

Keeping to time in presentations!

[Check out the live demo](https://tkrkt.github.com/reveal.js-elapsed-time-bar/)

## Installation 

Copy the folder ``plugin/elapsed-time-bar`` into plugin folder of your reveal.js project.

Add the plugins to the dependencies and set ``allottedTime`` property, like this:

```js
Reveal.initialize({
  // ...
  
  // your allotted time for presentation
  allottedTime: 3 * 60 * 1000, // 3 minutes
  
  dependencies: [
    // ...

    { src: 'plugin/elapsed-time-bar/elapsed-time-bar.js'}
  ]
});
```


## Configurations

```js
Reveal.initialize({
  // ...

  // - (required) your allotted time for presentation
  allottedTime: 3 * 60 * 1000, // 3 minutes

  // - (optional) height of page/time progress bar
  progressBarHeight: 3,

  // - (optional) bar color
  barColor: 'rgb(200,0,0)',

  // - (optional) bar color when timer is paused
  pausedBarColor: 'rgba(200,0,0,.6)',
});
```


## API

You can use APIs from global ``ElapsedTimeBar`` object.

|property|description|
|---|---|
|isPaused|true if timer is paused|
|isFinished|true when you run out of your allotted time|
|start(allottedTime [,elapsedTime=0])|start timer with new allotted time|
|reset()|reset timer|
|pause()|pause timer|
|resume()|resume timer|


## Keyboard binding example

```js
Reveal.initialize({
  // ...

  keyboard: {
    // pause/resume time when Enter is pressed
    13: () => {
      ElapsedTimeBar.isPaused ? ElapsedTimeBar.resume() : ElapsedTimeBar.pause();
    },
    // reset timer when 'r' is pressed
    82: () => {
      ElapsedTimeBar.reset();
    }
  }
});
```


# License

MIT