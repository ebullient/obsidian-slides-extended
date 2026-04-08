---
theme: beige.css
enableAudioSlideshow: true
---

# Media Test

---

## Video (remote URL)

![Big Buck Bunny](https://www.w3schools.com/html/mov_bbb.mp4)

---

## Video with controls disabled, custom size

![Big Buck Bunny|400x300](https://www.w3schools.com/html/mov_bbb.mp4) <!-- element controls="false" data-autoplay -->

---

## Audio (remote URL)

![Horse](https://www.w3schools.com/html/horse.ogg)

---

## Audio with autoplay

![Horse](https://www.w3schools.com/html/horse.ogg) <!-- element data-autoplay -->

---

## Audio, controls disabled

![Horse](https://www.w3schools.com/html/horse.ogg) <!-- element controls="false" -->

---

## Audio Slideshow: slide with attached audio
<!-- slide data-audio-src="https://www.w3schools.com/html/horse.ogg" -->

The audio-slideshow plugin attaches audio to this slide via `data-audio-src`.
Hover the bottom bar to reveal the player and press play.
Note: the player bar appears on every slide when `enableAudioSlideshow` is on.

---

## Audio Slideshow: fragment with attached audio

This text is visible immediately.

Hover the bottom bar to play the audio attached to this fragment. <!-- element class="fragment" data-audio-src="https://www.w3schools.com/html/horse.ogg" -->
