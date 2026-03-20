/*//import AudioRecorder from "node-audiorecorder";
import "dotenv/config";
import {
  ElevenLabsClient,
  RealtimeEvents,
  AudioFormat,
} from "@elevenlabs/elevenlabs-js";

const options = {
  program: `sox`, // Which program to use, either `arecord`, `rec`, or `sox`.
  device: null, // Recording device to use, e.g. `hw:1,0`

  bits: 16, // Sample size. (only for `rec` and `sox`)
  channels: 1, // Channel count.
  encoding: `signed-integer`, // Encoding type. (only for `rec` and `sox`)
  format: `S16_LE`, // Encoding type. (only for `arecord`)
  rate: 16000, // Sample rate.
  type: `wav`, // Format type.

  // Following options only available when using `rec` or `sox`.
  silence: 10, // Duration of silence in seconds before it stops recording.
  thresholdStart: 10, // Silence threshold to start recording.
  thresholdStop: 10, // Silence threshold to stop recording.
  keepSilence: true, // Keep the silence in the recording.
};

const logger = console;
let bufferAcumulado = Buffer.alloc(0);
const BYTES_POR_CHUNK = 3200; // para 100ms de audio a 16kHz y 16 bits (2 bytes por muestra) mono: 16000 muestras/seg * 0.1 seg * 2 bytes/muestra = 3200 bytes
let audioRecorder = new AudioRecorder(options, logger);

const elevenlabs = new ElevenLabsClient();

const connection = await elevenlabs.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
  audioFormat: AudioFormat.PCM_16000,
  sampleRate: 16000,
  includeTimestamps: true,
});

connection.on(RealtimeEvents.SESSION_STARTED, (data) => {
  console.log("Session started", data);
  audioRecorder
    .start()
    .stream()
    .on("data", (data: Buffer) => {
      // Concatenar al buffer acumulado
      bufferAcumulado = Buffer.concat([bufferAcumulado, data]);

      // Mientras tengamos suficiente para un chunk
      while (bufferAcumulado.length >= BYTES_POR_CHUNK) {
        // Cortamos un chunk
        const chunk = bufferAcumulado.slice(0, BYTES_POR_CHUNK);
        // Reducimos el buffer acumulado
        bufferAcumulado = bufferAcumulado.slice(BYTES_POR_CHUNK);

        connection.send({
          audioBase64: chunk.toString("base64"),
          sampleRate: 16000,
        });
      }
    });
});

connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (transcript) => {
  console.log("Partial transcript", transcript);
});
*/

import { RealtimeEvents } from "@elevenlabs/elevenlabs-js";
import { StateManager } from "./global-states";
import {
  connectToElevenlabs,
  streamAudioAndSendToElevenLabs,
} from "./speech-text";

async function main() {
  const connection = await connectToElevenlabs();
  connection.on(RealtimeEvents.SESSION_STARTED, (_) => {
    StateManager.setIsListening(true);
    streamAudioAndSendToElevenLabs(connection);
  });
  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (transcript) => {
    console.log("Partial transcript", transcript);
  });
}

main();
