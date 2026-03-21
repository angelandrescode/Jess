import { RealtimeEvents } from "@elevenlabs/elevenlabs-js";
import { StateManager } from "./global-states";
import {
  connectToSpeechToText,
  streamAudioAndSendToElevenLabs,
} from "./speech-text";
import player from "node-wav-player";
import { handleIntention, initConversation } from "./router";
import OpenAI from "openai";

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
  "A.S",
  "elles",
  "edges",
];

async function main() {
  let speechToTextConnection = await connectToSpeechToText();
  speechToTextConnection.on(RealtimeEvents.SESSION_STARTED, (_) => {
    StateManager.setIsListening(true);
    streamAudioAndSendToElevenLabs(speechToTextConnection);
  });
  let conversation: OpenAI.Conversations.Conversation;
  speechToTextConnection.on(
    RealtimeEvents.COMMITTED_TRANSCRIPT,
    async (transcript) => {
      const { text } = transcript;
      console.log("\x1b[31m%s\x1b[0m", text);
      const isWakeUpWordInText = possiblesTranscriptions.some(
        (possible_transcription) =>
          text.toLowerCase().includes(possible_transcription),
      );
      if (
        isWakeUpWordInText &&
        !StateManager.getState().isInConversation.value
      ) {
        conversation = await initConversation();
        StateManager.setIsInConversation(true);
        StateManager.setIsTurnOfJess(true);
        StateManager.setIsTurnOfUser(false);
        // escoje el numero aleatorio de cualquier audio
        const greetingNumber = Math.floor(Math.abs(Math.random() * 10 - 5));
        await player.play({
          path: greetings[greetingNumber],
          sync: true, // espera a que acabe el audio
        });
        StateManager.setIsTurnOfJess(false);
        StateManager.setIsTurnOfUser(true);
      }
      //Solo entra a este condicional cuando el usuario esta hablando.
      if (StateManager.getState().isInConversation.value) {
        const routerResponse = handleIntention(conversation, text);
        // Esto en caso de que haya habido un bug y los estados se hayan desincronizado
        if (!routerResponse) {
          throw new Error(
            "El router ha fallado, puede que sea un problema en los estados",
          );
        }
        // Mapar agente y pasar intencion
      }
    },
  );
  speechToTextConnection.on(RealtimeEvents.ERROR, async () => {
    speechToTextConnection = await connectToSpeechToText();
  });
}

main();
