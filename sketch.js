/**
 *  @name Note Envelope
 *  @description  <p>An Envelope is a series of fades, defined
 *  as time / value pairs. In this example, the envelope
 * will be used to "play" a note by controlling the output
 *  amplitude of an oscillator.<br/><br/>
 *  The p5.Oscillator sends its output through
 *  an internal Web Audio GainNode (p5.Oscillator.output).
 *  By default, that node has a constant value of 0.5. It can
 *  be reset with the osc.amp() method. Or, in this example, an
 *  Envelope takes control of that node, turning the amplitude
 *  up and down like a volume knob.</p>
 */
let R, inputMode;
let pauseButton, resetButton, clearButton, systemButtonsDiv;
let addNoteButton, deleteNotesButton, editNotesButton, noteButtonList, commandButtonsDiv;
let startNoteInput, pitchClassNoteSelect, octaveNoteInput, durationNoteInput, volumeNoteSlider, startNoteSpan, pitchClassNoteSpan, octaveNoteSpan, durationNoteSpan, volumeNoteSpan, applyNoteButton, NoteInputsDiv;
let tempStart, tempPitch, tempOctave, tempDuration, tempVolume;
let spinner;
const ALPHABET_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
class Note {
  constructor(start, pitchClass, octave, duration, volume) {
    this.start = start;
    this.pitchClass = pitchClass;
    this.octave = octave || 4;
    this.frequency = this.frequencyFromNotation();
    this.duration = duration || 0.25;
    this.volume = volume || 1;
  }
  /*
  * called in constructor
  * NOT YET CALLED FOR UPDATE
  * function complete
  */
  frequencyFromNotation() {
    return midiToFreq((this.octave + 1) * 12 + this.pitchClass);
  }
  /*
   * called in spinner.draw
   * colors probably incorrect
   * function complete
  */
  draw(r, volumeModulator) {
    //this one gonna be interesting
    const colorList = ["violet", "indigo", "blue", "turquoise", "green", "lime green", "yellow", "orange", "red"];
    let baseLength = this.volume * volumeModulator;
    let startAngle = this.start * PI / 2;
    let slices = 4;
    let durationAngle = this.duration * PI / 2;
    let sliceAngle = durationAngle / slices;
    let sliceHeight = r * sin(sliceAngle / 2);
    stroke(colorList[this.octave]);
    fill(colorList[this.octave]);
    for (let i = 0; i < slices; i++) {
      rotate(-(startAngle + sliceAngle * i));
      ellipse(r, 0, baseLength * (1 - i / slices) + 1, sliceHeight);
      rotate(startAngle + sliceAngle * i);
    }
  }
}

class Synth {
  constructor() {
    this.osc = new p5.SinOsc();
    this.osc.amp(0);
    this.osc.start();
    this.envelope = new p5.Envelope();

    // set attackTime, decayTime, sustainRatio, releaseTime
    this.envelope.setADSR(0.001, 0.5, 0.1, 0.5);
    // set attackLevel, releaseLevel
    this.envelope.setRange(1, 0);
  }
  /*
   * called in spinner.draw
   * function complete
   */
  playNote(note, masterVolume) {
    this.envelope.setADSR(0.001, note.duration / 2, 0.1, note.duration / 2);
    this.envelope.setRange(note.volume * masterVolume, 0);
    this.osc.freq(note.frequency);

    this.envelope.play(this.osc, 0, 0.1);
  }
}

class Spinner {
  constructor() {
    this.noteList = [];
    this.play = false;
    this.headTime = 0;
    this.masterVolume = 1;
    this.synth = new Synth();
    this.tempo = 80
  }
  /*
   * called in draw
   * function will need tweaks for sure
   */
  draw(R) {
    const NOTES_r = [];
    background(255);
    fill("black");
    noStroke();
    if (inputMode) {
      text("input mode: " + inputMode, 120, 20);
      text("key code: " + keyCode, 140, 0);
    }
    translate(width / 2, height / 2);
    noFill();
    strokeWeight(1);
    let d = 14;
    let volumeDrawingScale = R / d / 2;
    let rNote;
    for (let i = 1; i <= d; i++) {
      rNote = i * R / d;
      NOTES_r.push(rNote);
      if (i == 1 || i == d) {
        stroke('red');
      } else {
        noStroke();
        fill('black');
        text(ALPHABET_SCALE[i - 2], rNote, 0);
        noFill();
        if (ALPHABET_SCALE[i - 2].length == 1) {
          stroke('black');
        }
      }
      ellipse(0, 0, rNote, rNote);
    }
    let headAngle = this.headTime * PI / 2;
    rotate(headAngle);
    for (let i = 0; i < 4 * 4; i++) {
      let angle = i * PI / 8;
      stroke('black');
      strokeWeight(i % 4 === 0 ? 2 : 1);
      line(cos(angle) * R / d, sin(angle) * R / d, cos(angle) * R, sin(angle) * R);
    }
    for (let note of this.noteList) {
      note.draw(NOTES_r[note.pitchClass+1], volumeDrawingScale);
      if ((Math.round(this.headTime * 10000) / 10000) % 4 === note.start && this.play === true) {
        console.log('should make sound')
        this.synth.playNote(note, this.masterVolume);
      }
    }
    rotate(-headAngle);
    strokeWeight(3);
    stroke('black');
    line(0, 0, R, 0);

    if (this.play === true) {
      this.headTime = (this.headTime + 1 / 4 / this.tempo) % 4;
    }
  }
  applyNote(mode, start, pitchClass, octave, duration, volume) {
    if (mode === "add note") {
      this.addNote(start, pitchClass, octave, duration, volume);
    }
    else if (mode.match(/edit note \d+/)) {
      
    }
    else {console.log('apply note got called with ' + inputMode)}
  }
  addNote(start, pitchClass, octave, duration, volume) {
    this.noteList.push(new Note(start, pitchClass, octave, duration, volume));
  }
  reset() {
    this.play = false;
    this.headTime = 0;
  }
  pause() {
    this.play = !this.play;
  }
  clear() {
    this.noteList = [];
  }
}

function setup() {
  spinner = new Spinner();
  createCanvas(windowWidth, windowHeight);
  R = height < width ? height / 2 : width / 2;
  createDOM(R, spinner);
  ellipseMode(RADIUS);
}

function draw() {
  spinner.draw(R);
  updateDOM();
}

function createDOM(R, spinner) {
  systemButtonsDiv = createDiv();
  pauseButton = createButton("pause/resume");
  pauseButton.mouseClicked(() => { spinner.pause(); });
  pauseButton.size(100, 20);
  pauseButton.position(10, 10);
  resetButton = createButton("reset to time 0");
  resetButton.mouseClicked(() => { spinner.reset(); });
  resetButton.size(100, 20);
  resetButton.position(10, 40);
  clearButton = createButton("clear all data");
  clearButton.mouseClicked(() => { spinner.clear(); });
  clearButton.size(100, 20);
  clearButton.position(10, 70);
  systemButtonsDiv.child(pauseButton);
  systemButtonsDiv.child(resetButton);
  systemButtonsDiv.child(clearButton);

  commandButtonsDiv = createDiv();
  addNoteButton = createButton("add note");
  addNoteButton.mouseClicked(() => { inputMode = "add note"; });
  addNoteButton.size(100, 20);
  addNoteButton.position(width - 110, 10);
  deleteNotesButton = createButton("delete notes");
  deleteNotesButton.mouseClicked(() => { inputMode = "delete notes"; });
  deleteNotesButton.size(100, 20);
  deleteNotesButton.position(width - 110, 40);
  editNotesButton = createButton("edit notes");
  editNotesButton.mouseClicked(() => { inputMode = "edit notes"; });
  editNotesButton.size(100, 20);
  editNotesButton.position(width - 110, 70);
  commandButtonsDiv.child(addNoteButton);
  commandButtonsDiv.child(deleteNotesButton);
  commandButtonsDiv.child(editNotesButton);

  noteInputsDiv = createDiv();
  startNoteInput = createInput("0", "number");
  startNoteSpan = createSpan("Start Time");
  startNoteInput.size(100, 15);
  startNoteInput.position(10, height - 110);
  startNoteSpan.position(10, height - 130);
  pitchClassNoteSelect = createSelect();
  pitchClassNoteSpan = createSpan("Pitch Class");
  pitchClassNoteSelect.position(10, height - 70);
  pitchClassNoteSpan.position(10, height - 90);
  for (let pitchClass in ALPHABET_SCALE) {
    pitchClassNoteSelect.option(ALPHABET_SCALE[pitchClass]);
  }
  octaveNoteInput = createInput("4", "number");
  octaveNoteSpan = createSpan("Octave");
  octaveNoteInput.size(100, 15);
  octaveNoteInput.position(10, height - 30);
  octaveNoteSpan.position(10, height - 50);
  durationNoteInput = createInput("0.25", "number");
  durationNoteSpan = createSpan("Duration");
  durationNoteInput.elt.step = 0.125;
  durationNoteInput.size(100, 15);
  durationNoteInput.position(width - 110, height - 110);
  durationNoteSpan.position(width - 110, height - 130);
  volumeNoteSlider = createSlider(0, 1, 1, 0.1);
  volumeNoteSpan = createSpan("Volume: 1");
  volumeNoteSlider.size(100, 15);
  volumeNoteSlider.position(width - 110, height - 60);
  volumeNoteSpan.position(width - 110, height - 80);
  applyNoteButton = createButton("Apply");
  applyNoteButton.mouseClicked(() => {
    console.log(pitchClassNoteSelect.elt.selectedIndex)
    spinner.applyNote(
      inputMode,
      parseInt(startNoteInput.value()),
      pitchClassNoteSelect.elt.selectedIndex,
      parseInt(octaveNoteInput.value()),
      parseFloat(durationNoteInput.value()),
      parseFloat(volumeNoteSlider.value())
    );
    inputMode = null
    updateDOM()
  });
  applyNoteButton.size(100, 20);
  applyNoteButton.position(width - 110, height - 30);
  noteInputsDiv.child(startNoteSpan);
  noteInputsDiv.child(startNoteInput);
  noteInputsDiv.child(pitchClassNoteSpan);
  noteInputsDiv.child(pitchClassNoteSelect);
  noteInputsDiv.child(octaveNoteSpan);
  noteInputsDiv.child(octaveNoteInput);
  noteInputsDiv.child(durationNoteSpan);
  noteInputsDiv.child(durationNoteInput);
  noteInputsDiv.child(volumeNoteSpan);
  noteInputsDiv.child(volumeNoteSlider);
  noteInputsDiv.child(applyNoteButton);
}

function updateDOM() {
  systemButtonsDiv.show();
  noteInputsDiv.hide();
  if (inputMode) {
    commandButtonsDiv.hide();
    if (inputMode === "add note" || inputMode.match(/edit note \d+/)) {
      noteInputsDiv.show();
      if (inputMode.match()) {
        iNote = inputMode.slice(10,-0)
      }
    }
  } else {
    commandButtonsDiv.show();
  }
}

function keyPressed() {
  console.log(keyCode);
  // Spacebar
  if (keyCode == 32) {
    spinner.pause();
  }
  // Esc
  if (keyCode === 27) {
    inputMode = null;
  }
  // not in the middle of a command
  if (!inputMode) {
    // a or A
    if (keyCode === 65) {
      inputMode = "add note";
    }
    // E or e
    else if (keyCode === 69) {
      inputMode = "edit notes";
    }
    // D or d
    else if (keyCode === 0) {
      inputMode = "delete notes";
      
    }
    // r or R
    else if (keyCode === 82) {
      spinner.reset()
    }
  }
}