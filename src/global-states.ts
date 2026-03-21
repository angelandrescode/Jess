type StateType = {
  isListening: boolean;
  isInConversation: boolean;
  isTurnOfJess: boolean;
  isTurnOfUser: boolean;
};

let states: StateType = {
  isListening: false,
  isInConversation: false,
  isTurnOfJess: false,
  isTurnOfUser: false,
};

export const StateManager = {
  getState() {
    return states;
  },
  setIsListening(value: boolean) {
    states.isListening = value;
  },
  setIsInConversation(value: boolean) {
    states.isInConversation = value;
  },
  setIsTurnOfJess(value: boolean) {
    states.isTurnOfJess = value;
  },
  setIsTurnOfUser(value: boolean) {
    states.isTurnOfUser = value;
  },
};
