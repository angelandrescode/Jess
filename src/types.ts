import { Agent as AgentClass } from "./agents/agent";

export type AgentType = {
  description: string;
  agentClass: AgentClass;
};
export type RouterResponseType = {
  agent: AgentType;
  intention: string;
  literalTranscript: string;
};
export type AgentsType = Record<string, AgentType>;
