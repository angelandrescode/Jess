import OpenAI from "openai";
import "dotenv/config";
import { StateManager } from "./global-states";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const agents = {
  system: {
    description: "cosas que implique manipular software",
  },
  ender: {
    description: "si de alguna u otra forma pide terminar la conversación",
  },
  conversational: {
    description:
      "si no pide hacer ninguna acción, no sabes que decidir, o la accion que pide no esta en los parámetros, usa esta",
  },
};

const listOfAgentsWithDescription = Object.entries(agents)
  .map(([agent_key, agent_value]) => {
    return `${agent_key} (${agent_value.description}), `;
  })
  .join(" ");

const instructions = `
Eres un mediador en el sistema de asistente llamado Jess.
Tu trabajo es analizar el texto del usuario y decidir qué acción ejecutar.
SOLO respondes en formato JSON con esta estructura:
{
  "agent": string,
  "intention": string,
}
No expliques nada, solo responde en esa estructura.
Agentes disponibles: ${listOfAgentsWithDescription}
La intencion es un texto explicando MUY BREVEMENTE y sin perder información, cual es la intención del usuario, no uses conectores y los verbos en infinitivo`;

export async function initConversation() {
  const conversation = await client.conversations.create();
  return conversation;
}

export async function handleIntention(
  conversation: OpenAI.Conversations.Conversation,
  input: string,
) {
  const { isInConversation, isTurnOfJess } = StateManager.getState();
  if (!isInConversation || !isTurnOfJess) return;
  const response = await client.responses.create({
    model: "gpt-3.5-turbo",
    instructions,
    input,
    conversation: conversation.id,
  });

  return response.output_text;
}
