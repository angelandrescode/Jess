import OpenAI from "openai";
import { openai } from "../constants";
import { RouterResponseType } from "../types";
import { say } from "../text-speech.ts";
import { Agent } from "./agent.ts";
import { StateManager } from "../global-states.ts";

export class ConversationalAgent extends Agent {
  static instructions =
    "Eres Jess, un asistente personal. Al mismo estilo Jarvis, eres MUY irónico, aunque a la ves, tienes astucia y jovialidad para hablar. Si te piden hacer algo de lo cual no eres capaz, simplemente di que no puedes hacerlo (irónicamente)";
  static conversation: OpenAI.Conversations.Conversation;

  static async handleRouterResponse(routerResponse: RouterResponseType) {
    console.log("seteando a jess a true");
    StateManager.setIsTurnOfJess(true);
    StateManager.setIsTurnOfUser(false);

    if (ConversationalAgent.conversation) {
      const items = await openai.conversations.items.list(
        ConversationalAgent.conversation.id,
      );
      if (items.data.length >= 20) {
        ConversationalAgent.conversation = await openai.conversations.create();
      }
    }
    ConversationalAgent.conversation ??= await openai.conversations.create();
    const response = await openai.responses.create({
      model: "gpt-3.5-turbo",
      instructions: ConversationalAgent.instructions,
      input: routerResponse.literalTranscript,
      conversation: ConversationalAgent.conversation.id,
    });
    await say(response.output_text);
  }
}
