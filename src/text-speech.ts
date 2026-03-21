import { play } from "@elevenlabs/elevenlabs-js";
import { elevenlabs } from "./constants";
import "dotenv/config";
import { StateManager } from "./global-states";

async function say(textToSay: string) {
  StateManager.setIsTurnOfJess(true);
  StateManager.setIsTurnOfUser(false);
  const audio = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
    text: textToSay,
    modelId: "eleven_multilingual_ttv_v2",
    outputFormat: "mp3_44100_128",
  });

  await play(audio);
  StateManager.setIsTurnOfJess(false);
  StateManager.setIsTurnOfUser(true);
}
