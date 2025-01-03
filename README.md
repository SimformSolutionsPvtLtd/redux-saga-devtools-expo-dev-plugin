# redux-saga-devtools-expo-dev-plugin

A React Native Redux Saga DevTool that can run in an Expo App

# Installation

### Add the package to your project

```
npx expo install redux-saga-devtools-expo-dev-plugin
```

### Integrate redux saga with the DevTool hook

```jsx
import createSagaMiddleware from 'redux-saga';

let sagaMiddleware = createSagaMiddleware();
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createSagaMonitor } = require('redux-saga-devtools-expo-dev-plugin');
  sagaMiddleware = createSagaMiddleware({ sagaMonitor: createSagaMonitor() });
}

const store = configureStore({
  reducer: rootReducer,
  devTools: false,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});
```

## 🎬 Preview
<a href="https://github.com/SimformSolutionsPvtLtd/redux-saga-devtools-expo-dev-plugin"><img alt="ReduxSagaDevTools" src="./redux-saga-devtools.png"> </a>