import group from '@/assets/tools/group.js';

/*

Tool made and implemented by TheTrueFax (https://github.com/thetruefax/)

*/


/**
 * @param {File} file - An image file
 * @param {Number} samples - samples
 * @returns {Promise<Object>} - A group level node
 */
async function audio(file, samples) {
    /*const img = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const pixels = compute_pixels(img, width, height, shape);
    let level_nodes = build_nodes(pixels, mode);

    return group.groupNodes(level_nodes);*/
    var level_nodes = await go(samples,2,file);

    return group.groupNodes(level_nodes);
}

/*

To whoever is reading this, I couldnt be shitted to touch this code,
the original sfx2grab i made a while ago and even then i thought the code
was embarrasing.

Please dont judge me for this horrible code, i dont mean any harm,
and especially dont judge the fact that i copied and pasted an entire FFT library on here

*/

var cullp = true;
var cullv = false;

function log(a){
    // this just logs ig?
    console.log(a);
}

class baseComplexArray {
  constructor(other, arrayType = Float32Array) {
    if (other instanceof ComplexArray) {
      // Copy constuctor.
      this.ArrayType = other.ArrayType;
      this.real = new this.ArrayType(other.real);
      this.imag = new this.ArrayType(other.imag);
    } else {
      this.ArrayType = arrayType;
      // other can be either an array or a number.
      this.real = new this.ArrayType(other);
      this.imag = new this.ArrayType(this.real.length);
    }

    this.length = this.real.length;
  }

  toString() {
    const components = [];

    this.forEach((value, i) => {
      components.push(
        `(${value.real.toFixed(2)}, ${value.imag.toFixed(2)})`
      );
    });

    return `[${components.join(', ')}]`;
  }

  forEach(iterator) {
    const n = this.length;
    // For gc efficiency, re-use a single object in the iterator.
    const value = Object.seal(Object.defineProperties({}, {
      real: {writable: true}, imag: {writable: true},
    }));

    for (let i = 0; i < n; i++) {
      value.real = this.real[i];
      value.imag = this.imag[i];
      iterator(value, i, n);
    }
  }

  // In-place mapper.
  map(mapper) {
    this.forEach((value, i, n) => {
      mapper(value, i, n);
      this.real[i] = value.real;
      this.imag[i] = value.imag;
    });

    return this;
  }

  conjugate() {
    return new ComplexArray(this).map((value) => {
      value.imag *= -1;
    });
  }

  magnitude() {
    const mags = new this.ArrayType(this.length);

    this.forEach((value, i) => {
      mags[i] = Math.sqrt(value.real*value.real + value.imag*value.imag);
    })

    return mags;
  }
}

// Math constants and functions we need.
const PI = Math.PI;
const SQRT1_2 = Math.SQRT1_2;

function FFT(input) {
  return ensureComplexArray(input).FFT();
};

function InvFFT(input) {
  return ensureComplexArray(input).InvFFT();
};

function frequencyMap(input, filterer) {
  return ensureComplexArray(input).frequencyMap(filterer);
};

class ComplexArray extends baseComplexArray {
  FFT() {
    return fft(this, false);
  }

  InvFFT() {
    return fft(this, true);
  }

  // Applies a frequency-space filter to input, and returns the real-space
  // filtered input.
  // filterer accepts freq, i, n and modifies freq.real and freq.imag.
  frequencyMap(filterer) {
    return this.FFT().map(filterer).InvFFT();
  }
}

function ensureComplexArray(input) {
  return input instanceof ComplexArray && input || new ComplexArray(input);
}

function fft(input, inverse) {
  const n = input.length;

  if (n & (n - 1)) {
    return FFT_Recursive(input, inverse);
  } else {
    return FFT_2_Iterative(input, inverse);
  }
}

function FFT_Recursive(input, inverse) {
  const n = input.length;

  if (n === 1) {
    return input;
  }

  const output = new ComplexArray(n, input.ArrayType);

  // Use the lowest odd factor, so we are able to use FFT_2_Iterative in the
  // recursive transforms optimally.
  const p = LowestOddFactor(n);
  const m = n / p;
  const normalisation = 1 / Math.sqrt(p);
  let recursive_result = new ComplexArray(m, input.ArrayType);

  // Loops go like O(n Σ p_i), where p_i are the prime factors of n.
  // for a power of a prime, p, this reduces to O(n p log_p n)
  for(let j = 0; j < p; j++) {
    for(let i = 0; i < m; i++) {
      recursive_result.real[i] = input.real[i * p + j];
      recursive_result.imag[i] = input.imag[i * p + j];
    }
    // Don't go deeper unless necessary to save allocs.
    if (m > 1) {
      recursive_result = fft(recursive_result, inverse);
    }

    const del_f_r = Math.cos(2*PI*j/n);
    const del_f_i = (inverse ? -1 : 1) * Math.sin(2*PI*j/n);
    let f_r = 1;
    let f_i = 0;

    for(let i = 0; i < n; i++) {
      const _real = recursive_result.real[i % m];
      const _imag = recursive_result.imag[i % m];

      output.real[i] += f_r * _real - f_i * _imag;
      output.imag[i] += f_r * _imag + f_i * _real;

      [f_r, f_i] = [
        f_r * del_f_r - f_i * del_f_i,
        f_i = f_r * del_f_i + f_i * del_f_r,
      ];
    }
  }

  // Copy back to input to match FFT_2_Iterative in-placeness
  // TODO: faster way of making this in-place?
  for(let i = 0; i < n; i++) {
    input.real[i] = normalisation * output.real[i];
    input.imag[i] = normalisation * output.imag[i];
  }

  return input;
}

function FFT_2_Iterative(input, inverse) {
  const n = input.length;

  const output = BitReverseComplexArray(input);
  const output_r = output.real;
  const output_i = output.imag;
  // Loops go like O(n log n):
  //   width ~ log n; i,j ~ n
  let width = 1;
  while (width < n) {
    const del_f_r = Math.cos(PI/width);
    const del_f_i = (inverse ? -1 : 1) * Math.sin(PI/width);
    for (let i = 0; i < n/(2*width); i++) {
      let f_r = 1;
      let f_i = 0;
      for (let j = 0; j < width; j++) {
        const l_index = 2*i*width + j;
        const r_index = l_index + width;

        const left_r = output_r[l_index];
        const left_i = output_i[l_index];
        const right_r = f_r * output_r[r_index] - f_i * output_i[r_index];
        const right_i = f_i * output_r[r_index] + f_r * output_i[r_index];

        output_r[l_index] = SQRT1_2 * (left_r + right_r);
        output_i[l_index] = SQRT1_2 * (left_i + right_i);
        output_r[r_index] = SQRT1_2 * (left_r - right_r);
        output_i[r_index] = SQRT1_2 * (left_i - right_i);

        [f_r, f_i] = [
          f_r * del_f_r - f_i * del_f_i,
          f_r * del_f_i + f_i * del_f_r,
        ];
      }
    }
    width <<= 1;
  }

  return output;
}

function BitReverseIndex(index, n) {
  let bitreversed_index = 0;

  while (n > 1) {
    bitreversed_index <<= 1;
    bitreversed_index += index & 1;
    index >>= 1;
    n >>= 1;
  }
  return bitreversed_index;
}

function BitReverseComplexArray(array) {
  const n = array.length;
  const flips = new Set();

  for(let i = 0; i < n; i++) {
    const r_i = BitReverseIndex(i, n);

    if (flips.has(i)) continue;

    [array.real[i], array.real[r_i]] = [array.real[r_i], array.real[i]];
    [array.imag[i], array.imag[r_i]] = [array.imag[r_i], array.imag[i]];

    flips.add(r_i);
  }

  return array;
}

function LowestOddFactor(n) {
  const sqrt_n = Math.sqrt(n);
  let factor = 3;

  while(factor <= sqrt_n) {
    if (n % factor === 0) return factor;
    factor += 2;
  }
  return n;
}

    /*
    "levelNodeSound": {
        "position": {
            "x": -0.577011227607727,
            "y": 1.1703648567199707,
            "z": -1.9044057130813599
        },
        "parameters": {
            "waveType": 2,
            "envelopeSustain": 0.9000000357627869,
            "frequencyBase": 598,
            "frequencyLimit": 35,
            "pitchJumpMod": 0.10000000149011612,
            "lowPassFilterFrequency": 10000
        },
        "name": "sound",
        "volume": 1,
        "maxRangeFactor": 1000
    }
    */
    var roundHzBy = 2;
    var roundVolBy = 0.01;

var duration;
function getSoundBlock(pitch,amplitude,name){
    return {"levelNodeSound": {
        "position": {
            "x": 0,
            "y": 0,
            "z": -2
        },
        "parameters": {
            "waveType": 2,
            "envelopeAttack": 0.1,
            "envelopeSustain": 5,
            "envelopeRelease": 0.1,
            "frequencyBase": pitch,
            "frequencyLimit": 35,
            "pitchJumpMod": 0.10000000149011612,
            "lowPassFilterFrequency": 10000
        },
        "name": name,
        "volume": amplitude,
        "maxRangeFactor": 1000
    }};
}

async function readWavFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  return await audioContext.decodeAudioData(arrayBuffer);
}

function computeRMS(frame) {
  let sum = 0;
  for (const sample of frame) sum += sample * sample;
  return Math.sqrt(sum / frame.length);
}

// Autocorrelation pitch detection
function detectPitch(frame, sampleRate) {
  const size = frame.length;
  const maxLag = Math.floor(sampleRate / 50);  // Lowest pitch ~50 Hz
  const minLag = Math.floor(sampleRate / 1000); // Highest pitch ~1000 Hz

  let rms = computeRMS(frame);
  if (rms < 0.01) return 0; // Silence or noise threshold

  const autocorr = new Float32Array(maxLag);
  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    autocorr[lag] = sum;
  }

  let bestLag = minLag;
  let bestValue = autocorr[minLag];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (autocorr[lag] > bestValue) {
      bestValue = autocorr[lag];
      bestLag = lag;
    }
  }

  return sampleRate / bestLag;
}

function extractNotes(channelData, sampleRate, frameSize = 2048, hopSize = 512, intensityThreshold = 0.02, pitchToleranceCents = 50) {
  const notes = [];
  let currentNote = null;

  function freqToCents(freq) {
    return 1200 * Math.log2(freq / 440) + 6900; // 440Hz is MIDI note 69; cents relative to A4
  }

  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    const time = i / sampleRate;
    const intensity = computeRMS(frame);
    const pitch = detectPitch(frame, sampleRate);

    if (intensity < intensityThreshold || pitch === 0) {
      // silence or no pitch detected, close current note if any
      if (currentNote) {
        currentNote.endTime = time;
        notes.push(currentNote);
        currentNote = null;
      }
      continue;
    }

    if (!currentNote) {
      // start new note
      currentNote = {
        startTime: time,
        endTime: null,
        pitch,
        intensity,
      };
      continue;
    }

    // Check if pitch is close to current note pitch (within tolerance)
    const currentCents = freqToCents(currentNote.pitch);
    const pitchCents = freqToCents(pitch);
    if (Math.abs(pitchCents - currentCents) < pitchToleranceCents) {
      // Same note — update intensity (take max), endTime deferred until silence
      currentNote.intensity = Math.max(currentNote.intensity, intensity);
    } else {
      // Pitch changed — close previous note and start new
      currentNote.endTime = time;
      notes.push(currentNote);
      currentNote = {
        startTime: time,
        endTime: null,
        pitch,
        intensity,
      };
    }
  }

  // Close any note still open at end
  if (currentNote) {
    currentNote.endTime = channelData.length / sampleRate;
    notes.push(currentNote);
  }

  return notes;
}

function hannWindow(length) {
  const win = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
  }
  return win;
}

// Convert ComplexArray output to magnitude spectrum array
function magnitudeSpectrum(complexArray) {
  const fullMags = complexArray.magnitude(); // length = fftSize
  const halfLength = fullMags.length / 2;
  return fullMags.slice(0, halfLength); // only positive frequencies
}

function findPeaks(magnitudes, threshold = 0.01) {
  const peaks = [];
  for (let i = 1; i < magnitudes.length - 1; i++) {
    if (
      magnitudes[i] > magnitudes[i - 1] &&
      magnitudes[i] > magnitudes[i + 1] &&
      magnitudes[i] > threshold
    ) {
      peaks.push({ bin: i, magnitude: magnitudes[i] });
    }
  }
  return peaks;
}

function binToFreq(bin, sampleRate, fftSize) {
  return (bin * sampleRate) / fftSize;
}

// Track notes by frequency continuity across frames
function trackNotesAcrossFrames(allPeaks, sampleRate, frameSize, hopSize, freqToleranceHz = 20) {
  const notes = [];
  const activeNotes = [];

  for (let frameIndex = 0; frameIndex < allPeaks.length; frameIndex++) {
    const time = (frameIndex * hopSize) / sampleRate;
    const peaks = allPeaks[frameIndex];

    activeNotes.forEach(n => n.checked = false);

    peaks.forEach(({ bin, magnitude }) => {
      const freq = binToFreq(bin, sampleRate, frameSize);

      // Try match with active note
      let matchedNote = null;
      for (const note of activeNotes) {
        if (Math.abs(note.pitch - freq) < freqToleranceHz && !note.checked) {
          matchedNote = note;
          break;
        }
      }

      if (matchedNote) {
        matchedNote.endTime = time;
        matchedNote.intensity = Math.max(matchedNote.intensity, magnitude);
        matchedNote.checked = true;
      } else {
        activeNotes.push({
          startTime: time,
          endTime: time,
          pitch: freq,
          intensity: magnitude,
          checked: true,
        });
      }
    });

    // Remove ended notes
    for (let i = activeNotes.length - 1; i >= 0; i--) {
      if (!activeNotes[i].checked) {
        notes.push(activeNotes[i]);
        activeNotes.splice(i, 1);
      }
    }
  }

  // Close remaining active notes
  notes.push(...activeNotes);

  return notes;
}

// Main function: extract polyphonic notes from a WAV file
async function wavToPolyphonicNotes(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  duration = audioBuffer.duration;

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const fftSize = 2048;
  const hopSize = 512;
  const win = hannWindow(fftSize);

  const allPeaks = [];

  for (let start = 0; start + fftSize <= channelData.length; start += hopSize) {
    // Windowed frame
    const frameSamples = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      frameSamples[i] = channelData[start + i] * win[i];
    }

    // Create ComplexArray input with real = frameSamples, imag = 0
    const complexInput = new ComplexArray(fftSize);
    for (let i = 0; i < fftSize; i++) {
      complexInput.real[i] = frameSamples[i];
      complexInput.imag[i] = 0;
    }

    // Perform FFT using your code
    const fftOutput = complexInput.FFT();

    // Get magnitude spectrum
    const mags = magnitudeSpectrum(fftOutput);


    // Find spectral peaks
    const peaks = findPeaks(mags, 0.02);

    allPeaks.push(peaks);
  }

  // Track notes over frames
  const notes = trackNotesAcrossFrames(allPeaks, sampleRate, fftSize, hopSize);

  return notes;
}


const lerp = (min,max,t)=>{return (max-min)*t+min};

var notes;
var pitches;
var volumes;

function roundToClosest(val,list){
    let distances = [];
    let closest = Infinity;
    let index = 0;
    for (let i=0;i<list.length;i++){
        distances.push(Math.abs(list[i]-val));
        if (Math.abs(list[i]-val)<closest){
            index=i;
            closest=Math.abs(list[i]-val);
        }
    }
    return list[index];
}

// Usage
async function go(pitchSamps,volumeSamps,file) {

    

//   const audioBuffer = await readWavFile(file);
//   const channelData = audioBuffer.getChannelData(0);
//   const sampleRate = audioBuffer.sampleRate;
  log("Extracting samples");

  //duration = audioBuffer.duration;

  notes = await wavToPolyphonicNotes(file);

  console.log('Extracted notes:', notes);
  /*
    Example output:
    [
      {startTime: 0.03, endTime: 0.28, pitch: 440, intensity: 0.12},
      {startTime: 0.3, endTime: 0.5, pitch: 523, intensity: 0.09},
      ...
    ]
  */

    var highpass = 2000;

    var volcap = 0.65;

    // remove invalid notes and notes that just dont sound good
    let keptNotes = [];
    for (let i=0;i<notes.length;i++){
        // Delete notes above highpass and notes that are below a certain amount of seconds
        if (notes[i].endTime-notes[i].startTime>0.02 && notes[i].pitch<highpass){
            if (notes[i].intensity>volcap){
                notes[i].intensity=volcap;
            }
            keptNotes.push(notes[i]);
        }
    }

    notes = keptNotes;

    
    log("Rounding pitch samples");
    pitches = [];

    let inlist = (pitch)=>{let index = -1;pitches.forEach((e,a)=>{if (e[1]==pitch){index=a}});return index}

    for (let i=0;i<notes.length;i++){
        notes[i].pitch=Math.floor(notes[i].pitch/roundHzBy)*roundHzBy;
        let indexofit = inlist(notes[i].pitch);
        if (indexofit>-1){
            pitches[indexofit][0]+=notes[i].intensity;
        } else {
            pitches.push([notes[i].intensity,notes[i].pitch]);
        }
    }
    
    if (pitches.length<pitchSamps){
        log("(Not an error) Computed pitch samples less than provided limit ("+pitches.length+" pitch samples)")
    } else {
    log("Total pitch samples in original: "+pitches.length);
    console.log(pitches);
    pitches.sort((a,b)=>{
        return b[0] - a[0];
    });
    pitches = pitches.slice(0,pitchSamps);
    let bares = [];
    pitches.forEach((e,a)=>{bares.push(e[1])});
    log("Total pitch samples after rounding: "+bares.length)

    let kept = [];
    for (let i=0;i<notes.length;i++){
        if (cullp){
          if (bares.includes(notes[i].pitch)){
            kept.push(notes[i]);
          }
        } else {
        notes[i].pitch=roundToClosest(notes[i].pitch,bares);
        }
        // if (bares.includes(notes[i].pitch)){
        //     kept.push(notes[i]);
        // }
    }
    if (cullp){
      notes=kept;
    }
    }

    log("Rounding volume samples");
    volumes = [];

    inlist = (pitch)=>{let index = -1;volumes.forEach((e,a)=>{if (e[1]==pitch){index=a}});return index}

    for (let i=0;i<notes.length;i++){
        notes[i].intensity=Math.floor(notes[i].intensity/roundVolBy)*roundVolBy;
        let indexofit = inlist(notes[i].intensity);
        if (indexofit>-1){
            volumes[indexofit][0]+=1;
        } else {
            volumes.push([1,notes[i].intensity/4]);
        }
    }
    
    if (volumes.length<volumeSamps){
        log("(Not an error) Computed volume samples less than provided limit ("+volumes.length+" volume samples)")
    } else {
    log("Total volume samples in original: "+volumes.length);
    console.log(volumes);
    volumes.sort((a,b)=>{
        return b[0] - a[0];
    });
    volumes = volumes.slice(0,volumeSamps);
    let bares = [];
    volumes.forEach((e,a)=>{bares.push(e[1])});
    log("Total volume samples after rounding: "+bares.length)

    console.log(bares)
    let kept = [];
    for (let i=0;i<notes.length;i++){
        if (cullv) {
          if (bares.includes(notes[i].intensity)){
            console.log("asd");
            kept.push(notes[i]);
          }
        } else {
          notes[i].intensity=roundToClosest(notes[i].intensity,bares);
        }
        // if (bares.includes(notes[i].pitch)){
        //     kept.push(notes[i]);
        // }
    }
    if (cullv) {
      notes=kept;
    }
    }

    var triggerGroup = {
            "levelNodeGroup": {
                "position": {
                    "y": 0,
                    "x": 0,
                    "z": 0
                },
                "rotation": {
                    "w": 1
                },
                "scale": {
                    "y": 1,
                    "x": 1,
                    "z": 1
                },
                "childNodes": []
              }
    };

    /*

    Absolute Y position is Pitch!
    If the Y is negative then its a stop trigger!

    Z position is Intensity!

    X position is Time!!

    Remember this!!

    */
    
    var soundBlocks = [];

    // Multiply the volumes length by pitch length to get amount of total sound blocks and the multiply by sound block complexity
    log("Total complexity taken up by sound blocks: "+volumes.length*pitches.length*8);

    // Take the total notes and multiply by 2
    //log("Total complexity taken up by notes: "+notes.length*2);

    // Total complexity taken up by triggers is just pitch length and volume length but with a different complexity
    log("Total complexity taken up by triggers: "+volumes.length*pitches.length*5);

    log("<h2>Total complexity: "+(volumes.length*pitches.length*13)+"</h2>")

    const token = (len)=>{
      const chars="qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890";
      let output = "";
      for (let i=0;i<len;i++){
        output+=chars[Math.floor(Math.random()*chars.length)]
      }
      return output;
    }

    // Create all samples as sound blocks
    for (let x=0;x<volumes.length;x++){
        for (let y=0;y<pitches.length;y++){
            let block = getSoundBlock(pitches[y][1],volumes[x][1],"a");
            block.levelNodeSound.name = "SFX2GRAB-"+token(5);
            soundBlocks.push(block);
        }
    }

    const getBlockIndex = (pitch,volume1)=>{
        let index = -1;
        soundBlocks.forEach((e,a)=>{
            if (pitch==e.levelNodeSound.parameters.frequencyBase && volume1==e.levelNodeSound.volume){
                index=a;
            }
        });
        return index;
    };

    const getPitchSample = (pitch)=>{
        let index=-1;
        pitches.forEach((e,a)=>{
            if (e[1]==pitch){
                index=a;
            }
        });
        return index;
    }
    const getVolumeSample = (volume1)=>{
        let index=-1;
        volumes.forEach((e,a)=>{
            if (e[1]==volume1){
                index=a;
            }
        });
        return index;
    }
    var key=[];
    const makeTrigger = (pitch,volume1,x,y,isStop)=>{
        key.push(JSON.stringify([pitch,volume1,isStop]));
      
        if (isStop){
            return {
                        "levelNodeTrigger": {
                            "shape": 1000,
                            "position": {
                                "x": 0,
                                "y": -y - 1,
                                "z": x
                            },
                            "scale": {
                                "x": 0.03,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "triggerSources": [
                                {
                                    "triggerSourceBasic": {
                                        "type": 4
                                    }
                                }
                            ],
                            "triggerTargets": [
                                {
                                    "triggerTargetSound": {
                                        "objectID": getBlockIndex(pitch,volume1)+1,
                                        "mode":0
                                    }
                                }
                            ]
                        },
                          "animations": [
                {
                    "name": "idle",
                    "frames": [{
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": 0
                        }],
                    "speed": 1,
                    "currentFrameIndex": 0
                }]
                    };
        } else {
            return {
                        "levelNodeTrigger": {
                            "shape": 1000,
                            "position": {
                                "x": 0,
                                "y": y,
                                "z": x
                            },
                            "scale": {
                                "x": 0.03,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "triggerSources": [
                                {
                                    "triggerSourceBasic": {
                                        "type": 4
                                    }
                                }
                            ],
                            "triggerTargets": [
                                {
                                    "triggerTargetSound": {
                                        "objectID": getBlockIndex(pitch,volume1)+1,
                                        "mode":1
                                    }
                                }
                            ]
                        },
                          "animations": [
                {
                    "name": "idle",
                    "frames": [{
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": 0
                        }],
                    "speed": 1,
                    "currentFrameIndex": 0
                }]
                    };
        }
    }

    /*let usedPitches = [];
    let allPitches = [];
    for (let i=0;i<pitches.length;i++){
      if (!usedPitches.includes(pitches[i][1])){
      usedPitches.push(pitches[i][1]);
      }
    }
    for (let i=0;i<notes.length;i++){
      if (!allPitches.includes(notes[i].pitch)){
      allPitches.push(notes[i].pitch);
      }
    }
    console.log(usedPitches,allPitches)*/

    const pushTrigger = (pitch,volume1,x,y) => {
        triggerGroup.levelNodeGroup.childNodes.push(makeTrigger(pitch,volume1,x,y,false));
        triggerGroup.levelNodeGroup.childNodes.push(makeTrigger(pitch,volume1,x,y,true));
    }

    // create a trigger block that acesses all the other ones
    var trig1={
                        "levelNodeTrigger": {
                            "shape": 1000,
                            "position": {
                                "x": -5,
                                "y": 0,
                                "z": 0
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "triggerSources": [
                                {
                                    "triggerSourceBasic": {
                                        "type": 4
                                    }
                                }
                            ],
                            "triggerTargets": [
                                
                            ]
                        }
                    }
  var trig2={
                        "levelNodeTrigger": {
                            "shape": 1000,
                            "position": {
                                "x": -5,
                                "y": 0,
                                "z": 0
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "triggerSources": [
                                {
                                    "triggerSourceBasic": {
                                        "type": 4
                                    }
                                }
                            ],
                            "triggerTargets": [
                                
                            ]
                        }
                    }
  var trig3={
                        "levelNodeTrigger": {
                            "shape": 1000,
                            "position": {
                                "x": -5,
                                "y": 0,
                                "z": 0
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "rotation": {
                                "w": 1
                            },
                            "triggerSources": [
                                {
                                    "triggerSourceBasic": {
                                        "type": 4
                                    }
                                }
                            ],
                            "triggerTargets": [
                                
                            ]
                        }
                    }

    for (let i=soundBlocks.length+2;i<soundBlocks.length*2+2;i++){
      trig1.levelNodeTrigger.triggerTargets.push({
                                    "triggerTargetSound": {
                                        "objectID": i,
                                        "mode":1
                                    }
                                });
      trig2.levelNodeTrigger.triggerTargets.push({
                                    "triggerTargetSound": {
                                        "objectID": i,
                                        "mode":0
                                    }
                                });
      trig3.levelNodeTrigger.triggerTargets.push({
                                    "triggerTargetSound": {
                                        "objectID": i,
                                        "mode":4
                                    }
                                });
    }

    // Create all samples as triggers!
    for (let x=0;x<volumes.length;x++){
        for (let y=0;y<pitches.length;y++){
            pushTrigger(pitches[y][1],volumes[x][1],x,y);
        }
    }

    var staticNoteGroup = []
  var last=0;

    let usedIdn=[];
  let times = 0;

    const makeStaticNote = (pitch,volume,startPos,endPos) => {
      // .index refrence????
      if (endPos>last){
        last=endPos;
      }
        let idnex1 = key.indexOf(JSON.stringify([pitch,volume,false]));
        let idnex2 = key.indexOf(JSON.stringify([pitch,volume,true]));
        if (!usedIdn.includes(idnex1)){usedIdn.push(idnex1)}
        if (!usedIdn.includes(idnex2)){usedIdn.push(idnex2)}
      times++;


        let trigs = triggerGroup.levelNodeGroup.childNodes;
        // check frames
      if (trigs[idnex1].animations[0].frames.length>0){
        if (trigs[idnex1].animations[0].frames[trigs[idnex1].animations[0].frames.length-1].time>startPos){
          console.error("AAAHHHAHAHHHHHH");
          return;
        }
      if (trigs[idnex2].animations[0].frames[trigs[idnex2].animations[0].frames.length-1].time>endPos){
          console.error("AAAHHHAHAHHHHHH on tha end one");
        return;
        }
      }

        // add frames
        trigs[idnex1].animations[0].frames.push({
                            "position": {
                                "x": -1,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": startPos-0.01
                        });
      
        trigs[idnex1].animations[0].frames.push({
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": startPos
                        });
        // end note
        trigs[idnex2].animations[0].frames.push({
                            "position": {
                                "x": -1,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": endPos-0.01
                        });
      
        trigs[idnex2].animations[0].frames.push({
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": endPos
                        });
                    
        
        /*staticNoteGroup.push({
            "levelNodeStatic": {
                "shape": 1000,
                "position": {
                    "x": startPos,
                    "y": getPitchSample(pitch),
                    "z": getVolumeSample(volume)
                },
                "scale": {
                    "x": 0.03,
                    "y": 1,
                    "z": 1
                },
                "rotation": {
                    "w": 1
                }
            }
        });

        // and add stopping thing too
        staticNoteGroup.push({
            "levelNodeStatic": {
                "shape": 1000,
                "position": {
                    "x": endPos,
                    "y": getPitchSample(pitch)*-1 - 1,
                    "z": getVolumeSample(volume)
                },
                "scale": {
                    "x": 0.03,
                    "y": 1,
                    "z": 1
                },
                "rotation": {
                    "w": 1
                }
            }
        });*/
    }

    console.log(getPitchSample(pitches[0][1]))

    // Create all notes as little blocks!
    for (let i=0;i<notes.length;i++){
        makeStaticNote(notes[i].pitch,notes[i].intensity,notes[i].startTime,notes[i].endTime);
    }
  console.log(usedIdn,times,notes.length)

  var keptT = [];
  var keptS = [];

  let best=0;
  let ind=0;
        let trigs = triggerGroup.levelNodeGroup.childNodes;
    for (let i=0;i<trigs.length;i++){
      if (trigs[i].animations[0].frames.length>best){
        ind=i;
        best=trigs[i].animations[0].frames.length;
      }
      trigs[i].animations[0].frames.push({
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "rotation": {
                                "w": 1,
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "time": last
                        });
    }

    log("Trigger frame count max (more than 500 wont work): "+trigs[ind].animations[0].frames.length)

    // and oh my god we are done!
    // all we have to do is add it all up!

    var endJson = soundBlocks;

    endJson = endJson.concat(triggerGroup);
    endJson = endJson.concat(staticNoteGroup);

    // this is the trigger that basicly controls all of the others
    endJson.push(trig1);
    endJson.push(trig2);
    endJson.push(trig3);
    endJson.push({
            "levelNodeSign": {
                "position": {
                    "x": -5,
                    "y": 1,
                    "z": 0
                },
                "rotation": {
                    "w": 1,
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "text": "This trigger connects\nto all the other\nones."
            }
        })

    var levelFile = {
        "formatVersion": 12,
        "title": "New Level",
        "creators": ".index-editor, TheTrueFax's SFX2GRAB",
        "description": ".index modding - grab-tools.live - thetruefax.github.io/sfx2grab",
        "tags": [],
        "maxCheckpointCount": 10,
        "ambienceSettings": {
            "skyZenithColor": {
                "r": 0.28,
                "g": 0.476,
                "b": 0.73,
                "a": 1,
            },
            "skyHorizonColor": {
                "r": 0.916,
                "g": 0.9574,
                "b": 0.9574,
                "a": 1
            },
            "sunAltitude": 45,
            "sunAzimuth": 315,
            "sunSize": 1,
            "fogDensity": 0
        },
        "levelNodes": []
    }

    /*levelFile.levelNodes = endJson;

    var asString = JSON.stringify(levelFile, null, 2);

      //const jsonBlob = new Blob([asString], { type: "application/json" });

  console.log(encodeURIComponent(asString))
    var encoded = encodeURIComponent(asString);
    encoded = encoded.replaceAll("'","%27");
  
    log("<a href='data:application/json,"+encoded+"' download='"+file.name+".json'>Download</a>")


    console.log(asString);
    console.log(endJson);*/

    // we basicly only want the endjson
    console.log(endJson);
    return endJson;

}


export default {
    audio,
};
