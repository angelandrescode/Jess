import AudioRecorder from "node-audiorecorder";
import "dotenv/config";
import { AudioFormat, RealtimeConnection } from "@elevenlabs/elevenlabs-js";
import VAD from "node-vad";
import { StateManager } from "./global-states";
import { elevenlabs } from "./constants";

let counterChunksSilence = 0;
let counterChunksVoice = 0;
let thresholdCounterChunksSilence = 10;
let thresholdCounterChunkVoice = 3; // Lo suficiente como para no perder tanta información.
let newSpeechWasCommited = false;
const bytesEachChunk = 3200; // para 100ms de audio a 16kHz y 16 bits (2 bytes por muestra) mono: 16000 muestras/seg * 0.1 seg * 2 bytes/muestra = 3200 bytes
let totalBufferToSend = Buffer.alloc(0); // Buffer que va a guardar un chunk de audio que se mandara a eleven labs
const vad = new VAD(VAD.Mode.VERY_AGGRESSIVE);

async function commitSystemOnChunk(
  connectionToElevenLabs: RealtimeConnection,
  chunk: Buffer, //3200bytes,
) {
  const speechEvent = await vad.processAudio(chunk, 16000);
  if (speechEvent === VAD.Event.SILENCE) {
    console.log("silencio");
    ++counterChunksSilence;
    if (counterChunksSilence < thresholdCounterChunksSilence) return;
    // Devolvemos el contador de chunks de voz para que vuelva a contar desde 0 para el proximo speech.
    counterChunksVoice = 0;
    //Si el commit no se hizo antes, hacerlo, y bloquear el hecho de que se pueda hacer luego, para evitar el error de que el buffer no puede ser menor a 0.3s.
    //Ademas evita commitear buffers vacios
    if (!newSpeechWasCommited) {
      connectionToElevenLabs.commit();
      console.log(
        "Se hizo commit de este speech, ahora, ya no se podra hacer mas hasta nuevo speech",
      );
      newSpeechWasCommited = true;
    }
    //Reseteamos estados
    totalBufferToSend = Buffer.alloc(0);
    counterChunksSilence = 0;
  }
  if (speechEvent === VAD.Event.VOICE) {
    console.log("Se detecto nuevo speech, el commit se desbloquea");
    ++counterChunksVoice;
    // para que no detecte como "voz" al minimo susurro
    if (counterChunksVoice < thresholdCounterChunkVoice) return;
    // Se resetea el counter de chunks silence para que el contador vuelva a empezar desde el siguiente silencio
    counterChunksSilence = 0;
    // Cuando empieza a hablar, empieza otro "speech" otra cosa que hay que COMMITEAR, por eso, se desbloquea el commiteo con la flag para que sea capaz de commitear.
    newSpeechWasCommited = false;
    StateManager.setIsTurnOfUser(true);
    StateManager.setIsTurnOfJess(false);
  }
}

export function streamAudioAndSendToElevenLabs(
  connectionToElevenLabs: RealtimeConnection,
) {
  const options = {
    silence: 0, // Duration of silence in seconds before it stops recording.
    thresholdStart: 0, // Silence threshold to start recording.
    thresholdStop: 0, // Silence threshold to stop recording.
    format: "raw",
  };
  let audioRecorder = new AudioRecorder(options, console);
  //Cuando termine, enviar lo restante y cerrar la conexion
  audioRecorder.on("end", () => {
    if (totalBufferToSend.length > 0) {
      connectionToElevenLabs.send({
        audioBase64: totalBufferToSend.toString("base64"),
        sampleRate: 16000,
      });
      connectionToElevenLabs.commit();
      StateManager.setIsListening(false);
    }
    totalBufferToSend = Buffer.alloc(0);
  });

  audioRecorder
    .start()
    .stream()
    .on("data", async (data: Buffer) => {
      if (StateManager.getState().isTurnOfJess.value) return;
      // Concatenar al buffer acumulado
      totalBufferToSend = Buffer.concat([totalBufferToSend, data]);
      // Mientras tengamos suficiente para un chunk (3200 bytes)
      while (totalBufferToSend.length >= bytesEachChunk) {
        // Cortamos un chunk
        const chunk = totalBufferToSend.subarray(0, bytesEachChunk);
        // Obtenemos lo que sobro y lo guardamos para el proximo ciclo
        totalBufferToSend = totalBufferToSend.subarray(bytesEachChunk);
        //Enviamos chunk a elevenlabs
        connectionToElevenLabs.send({
          audioBase64: chunk.toString("base64"),
          sampleRate: 16000,
        });
        commitSystemOnChunk(connectionToElevenLabs, chunk);
      }
    });
}

export async function connectToSpeechToText() {
  const connection = await elevenlabs.speechToText.realtime.connect({
    modelId: "scribe_v2_realtime",
    audioFormat: AudioFormat.PCM_16000,
    sampleRate: 16000,
    includeTimestamps: true,
    languageCode: "es", // Español de España
  });
  return connection;
}
