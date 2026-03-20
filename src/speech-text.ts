import AudioRecorder from "node-audiorecorder";
import "dotenv/config";
import {
  ElevenLabsClient,
  AudioFormat,
  RealtimeConnection,
} from "@elevenlabs/elevenlabs-js";

export async function connectToElevenlabs() {
  const elevenlabs = new ElevenLabsClient();
  const connection = await elevenlabs.speechToText.realtime.connect({
    modelId: "scribe_v2_realtime",
    audioFormat: AudioFormat.PCM_16000,
    sampleRate: 16000,
    includeTimestamps: true,
  });
  return connection;
}

export function streamAudioAndSendToElevenLabs(
  connectionToElevenLabs: RealtimeConnection,
) {
  const options = {
    silence: 0, // Duration of silence in seconds before it stops recording.
    thresholdStart: 0, // Silence threshold to start recording.
    thresholdStop: 0, // Silence threshold to stop recording.
  };
  let audioRecorder = new AudioRecorder(options, console);
  let bufferAcumulado = Buffer.alloc(0);
  const bytesEachChunk = 3200; // para 100ms de audio a 16kHz y 16 bits (2 bytes por muestra) mono: 16000 muestras/seg * 0.1 seg * 2 bytes/muestra = 3200 bytes
  const chunksPerCommit = 20; // 300ms de audio por commit
  let countChunks = 0;

  //Cuando termine, enviar lo restante y cerrar la conexion.au
  audioRecorder.on("end", () => {
    if (bufferAcumulado.length > 0) {
      connectionToElevenLabs.send({
        audioBase64: bufferAcumulado.toString("base64"),
        sampleRate: 16000,
      });
    }
    bufferAcumulado = Buffer.alloc(0);
    countChunks = 0;
  });

  audioRecorder
    .start()
    .stream()
    .on("data", (data: Buffer) => {
      // Concatenar al buffer acumulado
      bufferAcumulado = Buffer.concat([bufferAcumulado, data]);
      // Mientras tengamos suficiente para un chunk
      while (bufferAcumulado.length >= bytesEachChunk) {
        // Cortamos un chunk
        const chunk = bufferAcumulado.subarray(0, bytesEachChunk);
        // Reducimos el buffer acumulado
        bufferAcumulado = bufferAcumulado.subarray(bytesEachChunk);
        //Enviamos chunk a elevenlabs
        connectionToElevenLabs.send({
          audioBase64: chunk.toString("base64"),
          sampleRate: 16000,
        });
        //contamos el chunk enviado
        countChunks++;
        //Si los chunks enviados alcanzan el limite por commit, se hace commit.
        if (countChunks >= chunksPerCommit) {
          //Se envia el trozo de audio restante en el buffer acumulado antes de hacer commit, para evitar que quede audio sin enviar.
          connectionToElevenLabs.send({
            audioBase64: bufferAcumulado.toString("base64"),
            sampleRate: 16000,
          });
          connectionToElevenLabs.commit();
          bufferAcumulado = Buffer.alloc(0);
          countChunks = 0;
        }
      }
    });
}
