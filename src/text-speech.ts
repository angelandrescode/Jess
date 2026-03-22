import { play } from "@elevenlabs/elevenlabs-js";
import { elevenlabs } from "./constants";
import "dotenv/config";
import { StateManager } from "./global-states";

export async function say(textToSay: string) {
  console.log("seteando a jess a true");
  StateManager.setIsTurnOfJess(true);
  StateManager.setIsTurnOfUser(false);
  const audio = await elevenlabs.textToSpeech.convert("L0NQVtZYoedOG2nITzwY", {
    text: textToSay,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });

  await play(audio);

  console.log("seteando a jess a false");
  StateManager.setIsTurnOfJess(false);
  StateManager.setIsTurnOfUser(true);
}
