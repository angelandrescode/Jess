type StateValue<T> = {
  value: T;
  callbacksOnChange: Array<(value: T) => void>;
};

type StateType = {
  isListening: StateValue<boolean>;
  isInConversation: StateValue<boolean>;
  isTurnOfJess: StateValue<boolean>;
  isTurnOfUser: StateValue<boolean>;
};

let states: StateType = {
  isListening: {
    value: false,
    callbacksOnChange: [],
  },
  isInConversation: {
    value: false,
    callbacksOnChange: [],
  },
  isTurnOfJess: {
    value: false,
    callbacksOnChange: [],
  },
  isTurnOfUser: {
    value: false,
    callbacksOnChange: [],
  },
};

export const StateManager = {
  getState() {
    return states;
  },
  setIsListening(value: boolean) {
    states.isListening.value = value;
    states.isListening.callbacksOnChange.forEach((callback) =>
      callback(states.isListening.value),
    );
  },
  subscribeToIsListening(callback: (value: boolean) => void) {
    states.isListening.callbacksOnChange.push(callback);
  },
  setIsInConversation(value: boolean) {
    states.isInConversation.value = value;
    states.isInConversation.callbacksOnChange.forEach((callback) =>
      callback(states.isInConversation.value),
    );
  },
  subscribeToIsInConversation(callback: (value: boolean) => void) {
    states.isInConversation.callbacksOnChange.push(callback);
  },
  setIsTurnOfJess(value: boolean) {
    states.isTurnOfJess.value = value;
    states.isTurnOfJess.callbacksOnChange.forEach((callback) =>
      callback(states.isTurnOfJess.value),
    );
  },
  subscribeToIsTurnOfJess(callback: (value: boolean) => void) {
    states.isTurnOfJess.callbacksOnChange.push(callback);
  },
  setIsTurnOfUser(value: boolean) {
    states.isTurnOfUser.value = value;
    states.isTurnOfUser.callbacksOnChange.forEach((callback) =>
      callback(states.isTurnOfUser.value),
    );
  },
  subscribeToIsTurnOfUser(callback: (value: boolean) => void) {
    states.isTurnOfUser.callbacksOnChange.push(callback);
  },
};
