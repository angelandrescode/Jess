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

  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, async (transcript) => {
    const { text } = transcript;
    const possiblesTranscriptions = ["jess", "yes", "jessie", "A.S"];
    const isWakeUpWordInText = possiblesTranscriptions.some(
      (possible_transcription) =>
        text.toLowerCase().includes(possible_transcription),
    );
    if (isWakeUpWordInText) {
      StateManager.setIsInConversation(true);
      StateManager.setIsTurnOfJess(true);
    }
  });
}

main();
