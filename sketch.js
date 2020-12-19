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
let R, spinner, inputMode, selectedNote;
let pauseButton, resetButton, clearButton, loadButton, escapeButton,
  systemButtonsDiv, addNoteButton, deleteButton, editButton,
  noteButtonList, commandButtonsDiv, startNoteInput, pitchClassNoteSelect,
  octaveNoteInput, durationNoteInput, volumeNoteSlider, startNoteSpan,
  pitchClassNoteSpan, octaveNoteSpan, durationNoteSpan, volumeNoteSpan,
  doneButton, NoteInputsDiv, noteChoiceSelect, noteChoiceSpan,
  noteChoiceDiv, tempStart, tempPitch, tempOctave, tempDuration, tempVolume;

const ALPHABET_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LOAD_DATA = [
  [2, 3], [9, 3], [2, 4], [6, 4],
  [4, 3], [9, 3], [1, 4], [4, 4],
  [6, 3], [11, 3], [2, 4], [6, 4],
  [6, 3], [9, 3], [1, 4], [6, 4],
  [7, 2], [2, 3], [7, 3], [11, 3],
  [2, 3], [6, 3], [9, 3], [2, 4],
  [7, 2], [7, 3], [11, 3], [2, 4],
  [9, 2], [4, 3], [9, 3], [1, 4]
];

class Note {
  constructor(start, pitchClass, octave, duration, volume) {
    this.start = start;
    this.pitchClass = pitchClass;
    this.octave = octave || 4;
    this.frequencyFromNotation();
    this.duration = duration || 0.25;
    this.volume = volume || 1;
  }
  /*
  * called in constructor
  * NOT YET CALLED FOR UPDATE
  * function complete
  */
  frequencyFromNotation() {
    this.frequency = midiToFreq((this.octave + 1) * 12 + this.pitchClass);
  }
  /*
   * called in spinner.draw
   * colors probably incorrect
   * function complete
  */
  draw(r, volumeModulator) {
    //this one gonna be interesting
    const colorList = [
      "violet", "indigo", "blue", "turquoise", "green",
      "lime green", "yellow", "orange", "red"
    ];
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
  }
  playNote(note, masterVolume) {
    this.envelope.setADSR(0.003, note.duration * 0.9, 0.1, note.duration / 10);
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
    // setup
    const NOTES_r = [];
    background(255);
    fill("black");
    noStroke();
    if (inputMode) {
      text("input mode: " + inputMode, 120, 40);
      text("key code: " + keyCode, 140, 20);
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
        fill('red');
        text(ALPHABET_SCALE[i - 2], rNote - 5, 0);
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
      note.draw(NOTES_r[note.pitchClass + 1], volumeDrawingScale);
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
  
  addNote(note) {
    return this.noteList.push(note);
  }

  reset() {
    this.play = false;
    this.headTime = 0;
  }

  pause() {
    this.play = !this.play;
  }

  clear() {
    this.reset();
    this.noteList = [];
  }

  load() {
    this.clear();
    let i = 0;
    LOAD_DATA.forEach( (noteData, i) => {
      this.addNote(new Note(i*0.125, noteData[0], noteData[1], 0.25, 1));
    });
  }
}

function setup() {
  spinner = new Spinner();
  createCanvas(windowWidth, windowHeight);
  R = height < width ? height / 2 : width / 2;
  assembleDOM();
  ellipseMode(RADIUS);
}

function draw() {
  spinner.draw(R);
  updateDOM();
}

function pauseFxn() {
  userStartAudio();
  spinner.pause();
}

function resetFxn() {
  spinner.reset();
}

function clearFxn() {
  spinner.clear();
}

function loadFxn() {
  spinner.load();
}
function escFxn() {
  inputMode = null;
  selectedNote = null;
}

function createSystemButtons() {
  systemButtonsDiv = createDiv();
  pauseButton = createButton("pause/resume");
  resetButton = createButton("reset to time 0");
  clearButton = createButton("clear all data");
  loadButton = createButton("load");
  escapeButton = createButton("esc");

  systemButtonsDiv.child(pauseButton);
  systemButtonsDiv.child(resetButton);
  systemButtonsDiv.child(clearButton);
  systemButtonsDiv.child(loadButton);
  systemButtonsDiv.child(escapeButton);
  
  pauseButton.mouseClicked(pauseFxn);
  resetButton.mouseClicked(resetFxn);
  clearButton.mouseClicked(clearFxn);
  loadButton.mouseClicked(loadFxn);
  escapeButton.mouseClicked(escFxn);
  
  pauseButton.size(100, 20);
  pauseButton.position(10, 10);
  resetButton.size(100, 20);
  resetButton.position(10, 40);
  clearButton.size(100, 20);
  clearButton.position(10, 70);
  loadButton.size(100, 20);
  loadButton.position(110, 10);
  escapeButton.size(40, 20);
  escapeButton.position(140, 40);
}

function setModeToAddNoteFxn() {
  inputMode = 'add note';
  let i = spinner.addNote(new Note(0,0,4,.25,1));
  selectedNote = spinner.noteList[i-1];
  updateNoteInputs();
}

function setModeToDeleteFxn() {
  inputMode = "delete";
  updateNoteChoiceSelect();
}

function setModeToEditFxn() {
  inputMode = "edit";
  updateNoteChoiceSelect();
}

function createCommandButtons() {
  commandButtonsDiv = createDiv();
  addNoteButton = createButton("add note");
  deleteButton = createButton("delete notes");
  editButton = createButton("edit notes");
  
  commandButtonsDiv.child(addNoteButton);
  commandButtonsDiv.child(deleteButton);
  commandButtonsDiv.child(editButton);
  
  addNoteButton.mouseClicked(setModeToAddNoteFxn);
  deleteButton.mouseClicked(setModeToDeleteFxn);
  editButton.mouseClicked(setModeToEditFxn);
  
  addNoteButton.size(100, 20);
  addNoteButton.position(width - 110, 10);
  deleteButton.size(100, 20);
  deleteButton.position(width - 110, 40);
  editButton.size(100, 20);
  editButton.position(width - 110, 70);
}

function setStartNoteFxn() {
  selectedNote.start = parseFloat(this.value());
}

function setPitchClassNoteFxn() {
  selectedNote.pitchClass = this.elt.selectedIndex;
  selectedNote.frequencyFromNotation();
}

function setOctaveNoteFxn() {
  selectedNote.octave = parseInt(this.value());
  selectedNote.frequencyFromNotation();
}

function setDurationNoteFxn() {
  console.log(this.value);
  selectedNote.duration = parseFloat(this.value());
}

function setVolumeNoteFxn() {
  selectedNote.volume = parseFloat(this.value());
}

function createNoteInputs() {

  noteInputsDiv = createDiv();

  startNoteInput = createInput("0", "number");
  pitchClassNoteSelect = createSelect();
  octaveNoteInput = createInput("4", "number");
  durationNoteInput = createInput("0.25", "number");
  volumeNoteSlider = createSlider(0, 1, 1, 0.1);
  doneButton = createButton("done");

  startNoteSpan = createSpan("Start Time");
  pitchClassNoteSpan = createSpan("Pitch Class");
  octaveNoteSpan = createSpan("Octave");
  durationNoteSpan = createSpan("Duration");
  volumeNoteSpan = createSpan("Volume");

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
  noteInputsDiv.child(doneButton);
  
  for (let pitchClass in ALPHABET_SCALE) {
    pitchClassNoteSelect.option(ALPHABET_SCALE[pitchClass]);
  }
  startNoteInput.elt.step = 0.125;
  durationNoteInput.elt.step = 0.125;

  startNoteInput.input(setStartNoteFxn);
  pitchClassNoteSelect.input(setPitchClassNoteFxn);
  octaveNoteInput.input(setOctaveNoteFxn);
  durationNoteInput.input(setDurationNoteFxn);
  volumeNoteSlider.input(setVolumeNoteFxn);
  doneButton.mouseClicked(escFxn);

 //positioning
  startNoteInput.size(100, 15);
  startNoteInput.position(10, height - 110);
  startNoteSpan.position(10, height - 130);

  pitchClassNoteSelect.position(10, height - 70);
  pitchClassNoteSpan.position(10, height - 90);

  octaveNoteInput.size(100, 15);
  octaveNoteInput.position(10, height - 30);
  octaveNoteSpan.position(10, height - 50);

  durationNoteInput.size(100, 15);
  durationNoteInput.position(width - 110, height - 110);
  durationNoteSpan.position(width - 110, height - 130);

  volumeNoteSlider.size(100, 15);
  volumeNoteSlider.position(width - 110, height - 60);
  volumeNoteSpan.position(width - 110, height - 80);

  doneButton.size(100, 20);
  doneButton.position(width - 110, height - 30);
}

function setSelectedNoteFxn() {
  selectedNote = spinner.noteList[this.elt.selectedIndex];
  updateNoteInputs();
}

function createNoteListDiv() {
  noteChoiceDiv = createDiv();
  noteChoiceSelect = createSelect();
  noteChoiceSpan = createSpan("Note Select");

  noteChoiceDiv.child(noteChoiceSpan);
  noteChoiceDiv.child(noteChoiceSelect);

  noteChoiceSelect.input(setSelectedNoteFxn);
  
  noteChoiceSpan.position(width - 90, height - 50);
  noteChoiceSelect.position(width - 70, height - 30);
}

function updateNoteInputs() {
  if (selectedNote) {
    startNoteInput.value(selectedNote.start);
    pitchClassNoteSelect.elt.selectedIndex = selectedNote.pitchClass;
    octaveNoteInput.value(selectedNote.octave);
    durationNoteInput.value(selectedNote.duration);
    volumeNoteSlider.value(selectedNote.volume);
  }
}

function updateNoteChoiceSelect() {
  noteChoiceSelect.elt.options.length = 0
  spinner.noteList.forEach( (note, i) => {
    noteChoiceSelect.option(
      i.toString() + ': '
      + ALPHABET_SCALE[note.pitchClass]
      + note.octave.toString()
    );
  });
}

function assembleDOM() {
  createSystemButtons();
  createCommandButtons();
  createNoteInputs();
  createNoteListDiv();
  updateDOM();
}

function updateDOM() {
  systemButtonsDiv.show();
  noteInputsDiv.hide();
  noteChoiceDiv.hide();
  if (inputMode) {
    commandButtonsDiv.hide();
    if (inputMode === "add note") {
      noteInputsDiv.show();
    }
    else if (inputMode === "edit") {
      noteInputsDiv.show();
      noteChoiceDiv.show()
    }
  }
  else {
    commandButtonsDiv.show();
  }
}

function keyPressed() {
  console.log(keyCode);
  // Spacebar
  if (keyCode == 32) {
    pauseFxn();
  }
  // Esc
  if (keyCode === 27) {
    escFxn();
  }
  // not in the middle of a command
  if (!inputMode) {
    // a or A
    if (keyCode === 65) {
      setModeToAddNoteFxn();
    }
    // E or e
    else if (keyCode === 69) {
      setModeToEditFxn();
    }
    // D or d
    else if (keyCode === 0) {
      setModeToDeleteFxn();
    }
    // r or R
    else if (keyCode === 82) {
      resetFxn();
    }
  }
}