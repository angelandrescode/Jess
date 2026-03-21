import { RealtimeEvents } from "@elevenlabs/elevenlabs-js";
import { StateManager } from "./global-states";
import {
  connectToSpeechToText,
  streamAudioAndSendToElevenLabs,
} from "./speech-text";
import player from "node-wav-player";

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

  speechToTextConnection.on(
    RealtimeEvents.COMMITTED_TRANSCRIPT,
    async (transcript) => {
      const { text } = transcript;
      console.log("\x1b[31m%s\x1b[0m", text);
      const isWakeUpWordInText = possiblesTranscriptions.some(
        (possible_transcription) =>
          text.toLowerCase().includes(possible_transcription),
      );
      if (isWakeUpWordInText) {
        StateManager.setIsInConversation(true);
        StateManager.setIsTurnOfJess(true);
        StateManager.setIsTurnOfUser(true);
        const greetingNumber = Math.floor(Math.abs(Math.random() * 10 - 5));
        await player.play({
          path: greetings[greetingNumber],
        });
        StateManager.setIsTurnOfJess(false);
        StateManager.setIsTurnOfUser(true);
      }
    },
  );
  speechToTextConnection.on(RealtimeEvents.ERROR, async () => {
    speechToTextConnection = await connectToSpeechToText();
  });
}

main();
