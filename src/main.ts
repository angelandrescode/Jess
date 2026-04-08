import { RealtimeEvents } from "@elevenlabs/elevenlabs-js";
import { StateManager } from "./global-states";
import {
  connectToSpeechToText,
  streamAudioAndSendToElevenLabs,
} from "./speech-text";
import player from "node-wav-player";
import { handleIntention, initConversation } from "./router";
import OpenAI from "openai";
import { CommittedTranscriptMessage } from "@elevenlabs/client";
import { RealtimeErrorPayload } from "@elevenlabs/elevenlabs-js/wrapper/realtime/connection";

//TODO Nos quedamos en un error, que aveces pasa que el sistema de commiteo, hace dos commits justo mientras se estan procesando estos con gpt. Lo que lleva a que ocurra un error:
//"Another process is currently operating on this conversation. Please retry in a few seconds." entocnes, la solucion seria: sabiendo que cada commit es un speech, entonces, simplemente
// bloquear el microfono luego del commit, tecnicamente, parar el microfono. Y cuando termine de hablar jess, que vuelva a encenderlo, si es necesario, usar el sistema de subscripcion de los estados.

const greetings = [
  "/Users/andres/Desktop/Jess/audios/greeting1.wav",
  "/Users/andres/Desktop/Jess/audios/greeting2.wav",
  "/Users/andres/Desktop/Jess/audios/greeting3.wav",
  "/Users/andres/Desktop/Jess/audios/greeting4.wav",
  "/Users/andres/Desktop/Jess/audios/greeting5.wav",
];
const possiblesTranscriptions = [
  "jess",
  "yes",
  "jessie",
  "a.s",
  "elles",
  "edges",
  "ella",
  "jeez",
];

async function main() {
  let speechToTextConnection = await connectToSpeechToText();
  let conversation: OpenAI.Conversations.Conversation;
  let stopAudioRecorder: any;
  //Usamos un getter para que cuando lo pase por parametro a una funcion siempre obtenga la actualizada
  // ya que esta variable se actualiza varias veces al forzar conexiones con websocket
  function speechToTextConnectionGetter() {
    return speechToTextConnection;
  }
  async function onSessionStarted() {
    StateManager.setIsListening(true);
    stopAudioRecorder = streamAudioAndSendToElevenLabs(
      speechToTextConnectionGetter,
    ).stopAudioRecorder;
  }
  async function onCommitedTranscript(transcript: CommittedTranscriptMessage) {
    const { text } = transcript;
    console.log("\x1b[31m%s\x1b[0m", text);
    const isWakeUpWordInText = possiblesTranscriptions.some(
      (possible_transcription) =>
        text.toLowerCase().includes(possible_transcription),
    );
    //Esto solo se ejecuta cada vez que se dice la wokeup word
    if (isWakeUpWordInText && !StateManager.getState().isInConversation.value) {
      conversation = await initConversation();
      StateManager.setIsInConversation(true);
      console.log("seteando a jess a true");
      StateManager.setIsTurnOfJess(true);
      StateManager.setIsTurnOfUser(false);
      // escoje el numero aleatorio de cualquier audio
      const greetingNumber = Math.floor(Math.abs(Math.random() * 10 - 5));
      await player.play({
        path: greetings[greetingNumber],
        sync: true, // espera a que acabe el audio
      });
      console.log("seteando a jess a false");
      StateManager.setIsTurnOfJess(false);
      StateManager.setIsTurnOfUser(true);
    }
    //Solo entra a este condicional cuando el usuario esta hablando.
    else if (StateManager.getState().isInConversation.value) {
      console.log("\x1b[32m%s\x1b[0m", "transcript del speech: ", transcript);
      if (!text || text.trim() === "") return; // Evita procesar textos vacios
      const routerResponse = await handleIntention(conversation, text);
      // Esto en caso de que haya habido un bug y los estados se hayan desincronizado
      if (!routerResponse) {
        throw new Error(
          "El router ha fallado, puede que sea un problema en los estados (StateManager)",
        );
      }
      // Mapar agente y pasar intencion
      await routerResponse.agent.agentClass.handleRouterResponse(
        routerResponse,
      );
      console.log("seteando a jess a false");
      StateManager.setIsTurnOfJess(false);
      StateManager.setIsTurnOfUser(true);
    }
  }

  async function onErrorTranscript(err: RealtimeErrorPayload) {
    console.warn("ERROR: ", err);
    StateManager.setIsListening(false);
    speechToTextConnection.close();
    speechToTextConnection = await connectToSpeechToText();
  }

  async function onCloseTranscript() {
    speechToTextConnection.off(
      RealtimeEvents.SESSION_STARTED,
      onSessionStarted,
    );
    speechToTextConnection.off(
      RealtimeEvents.COMMITTED_TRANSCRIPT,
      onCommitedTranscript,
    );
    speechToTextConnection.off(
      RealtimeEvents.COMMITTED_TRANSCRIPT,
      onCommitedTranscript,
    );
    speechToTextConnection.off(RealtimeEvents.ERROR, onErrorTranscript);
    speechToTextConnection.off(RealtimeEvents.CLOSE, onCloseTranscript);
    if (stopAudioRecorder) {
      stopAudioRecorder();
    }
    speechToTextConnection = await connectToSpeechToText();
    speechToTextConnection.on(RealtimeEvents.SESSION_STARTED, onSessionStarted);
    speechToTextConnection.on(
      RealtimeEvents.COMMITTED_TRANSCRIPT,
      onCommitedTranscript,
    );
    speechToTextConnection.on(RealtimeEvents.ERROR, onErrorTranscript);
    speechToTextConnection.on(RealtimeEvents.CLOSE, onCloseTranscript);
    console.log("Connection closed");
  }

  speechToTextConnection.on(RealtimeEvents.SESSION_STARTED, (_) => {
    StateManager.setIsListening(true);
    streamAudioAndSendToElevenLabs(speechToTextConnectionGetter);
  });
  speechToTextConnection.on(
    RealtimeEvents.COMMITTED_TRANSCRIPT,
    onCommitedTranscript,
  );
  speechToTextConnection.on(RealtimeEvents.ERROR, onErrorTranscript);

  speechToTextConnection.on(RealtimeEvents.CLOSE, onCloseTranscript);
}

main();
