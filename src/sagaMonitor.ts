import { SagaMonitor, Saga } from "@redux-saga/core";
import * as is from "@redux-saga/is";
import { Effect } from "@redux-saga/types";
import {
  DevToolsPluginClient,
  getDevToolsPluginClientAsync,
} from "expo/devtools";

import EffectManager, { MonitoredEffect } from "./EffectManager";
import * as effectTypes from "./constants";
import getEffectDescription from "./helpers/getEffectDescription";
import getEffectName from "./helpers/getEffectName";
import { isRaceEffect } from "./helpers/isRaceEffect";

export interface PluginConfig {
  except?: string[];
  errorHandler?: (error: any) => void;
}

export default (pluginConfig: PluginConfig = {}): SagaMonitor => {
  const manager = new EffectManager();
  const exceptions = pluginConfig.except || [];
  const timer = Date.now;
  let devToolsPluginClient: DevToolsPluginClient | null = null;
  let isFirstEvent: boolean | null = null;

  (async () => {
    try {
      devToolsPluginClient = await getDevToolsPluginClientAsync("redux-saga-devtools-expo-dev-plugin");
      isFirstEvent = true;
    } catch (e) {
      console.warn(
        "Failed to setup Expo dev plugin client from Redux Saga DevTools: " +
          e.toString(),
      );
    }
  })();

  function computeEffectDuration(effect: MonitoredEffect) {
    const now = timer();

    effect.end = now;
    effect.duration = now - (effect.start || 0);
  }

  // Scale children building up metadata for sending to the other side.
  function buildChildEffects(depth: number, effectId: number, children: any[]) {
    const effect = manager.get(effectId);
    if (!effect) return;

    let extra = null;

    if (effect.name) {
      switch (effect.name) {
        case effectTypes.CALL:
          extra = effect.effect?.payload?.args;
          break;
        case effectTypes.PUT:
          extra = effect.effect?.payload?.action;
          break;
        case effectTypes.RACE:
          // Do Nothing for now
          break;
        default:
          extra = (effect.effect || ({} as Effect))?.payload;
          break;
      }
    }

    children.push({
      depth,
      effectId: effect.effectId,
      parentEffectId: effect.parentEffectId || null,
      name: effect.name || null,
      description: effect.description || null,
      duration: Math.round(effect.duration || 0),
      status: effect.status || null,
      winner: effect.winner || null,
      result: effect.result || null,
      extra: extra || null,
    });

    manager
      .getChildIds(effectId)
      .forEach((childEffectId) =>
        buildChildEffects(depth + 1, childEffectId, children),
      );
  }

  function shipEffect(effectId: number) {
    const effect = manager.get(effectId);
    if (!effect) return;
    computeEffectDuration(effect);

    // If we are on the exception list bail fast.
    if (exceptions.indexOf(effect.description || "") > -1) return;

    // a human friendly name of the saga task
    let sagaDescription;
    // what caused the trigger
    let triggerType;
    const children = [];

    const parentEffect = manager.get(effect.parentEffectId || -1);

    // If we are a fork effect then we need to collect up everything that happened in us to ship that
    if (effect.name && effect.name === effectTypes.FORK) {
      const { args } = effect.effect?.payload;
      const lastArg = (args?.length || 0) > 0 ? args[args.length - 1] : null;
      triggerType = lastArg?.type;

      if (parentEffect) {
        if (parentEffect.name && parentEffect.name === effectTypes.ITERATOR) {
          sagaDescription = parentEffect.description;
        }
      } else {
        sagaDescription = "(root)";
        triggerType = `${effect.description}()`;
      }

      manager
        .getChildIds(effectId)
        .forEach((childEffectId) =>
          buildChildEffects(0, childEffectId, children),
        );
    }

    if (isFirstEvent === true) {
      isFirstEvent = false;
      devToolsPluginClient?.sendMessage("saga.task.list", manager.allAlreadyExecutedEffects);
      manager.clearAlreadyExecutedEffects();
    } else if (isFirstEvent === null) {
      manager.setAlreadyExecutedEffects({
        triggerType: triggerType || effect.description,
        description: sagaDescription,
        duration: Math.round(effect.duration || 0),
        children,
      });
    }

    devToolsPluginClient?.sendMessage("saga.task.complete", {
      triggerType: triggerType || effect.description,
      description: sagaDescription,
      duration: Math.round(effect.duration || 0),
      children,
    });
  }

  function setRaceWinner(raceEffectId: number, result: any) {
    const winnerLabel = Object.keys(result)[0];

    manager.getChildIds(raceEffectId).forEach((childId) => {
      const childEffect = manager.get(childId);
      if (childEffect.label === winnerLabel) {
        childEffect.winner = true;
      }
    });
  }

  function rootSagaStarted(options: {
    effectId: number;
    saga: Saga;
    args: any[];
  }) {
    manager.setRootEffect(options.effectId, {
      ...options,
      status: effectTypes.PENDING,
      start: timer(),
    });
  }

  function effectTriggered(options: {
    effectId: number;
    parentEffectId: number;
    label?: string;
    effect: any;
  }) {
    manager.set(options.effectId, {
      ...options,
      status: effectTypes.PENDING,
      start: timer(),
      name: getEffectName(options.effect),
      description: getEffectDescription(options.effect),
    });
  }

  function effectRejected(effectId: number, error: any) {
    const effect = manager.get(effectId);

    computeEffectDuration(effect);
    effect.status = effectTypes.REJECTED;
    effect.error = error;

    if (effect.effect && isRaceEffect(effect.effect)) {
      setRaceWinner(effectId, error);
    }
  }

  function effectCancelled(effectId: number) {
    const effect = manager.get(effectId);

    computeEffectDuration(effect);
    effect.status = effectTypes.CANCELLED;
  }

  function effectResolved(effectId: number, result: any) {
    const effect = manager.get(effectId);

    if (is.task(result)) {
      result.toPromise().then(
        (taskResult) => {
          if (result.isCancelled()) {
            effectCancelled(effectId);
          } else {
            effectResolved(effectId, taskResult);
            shipEffect(effectId);
          }
        },
        (taskError) => {
          effectRejected(effectId, taskError);

          if (!taskError.isWasHere) {
            pluginConfig.errorHandler?.(taskError);
          }
          taskError.isWasHere = true;
        },
      );
    } else {
      computeEffectDuration(effect);
      effect.status = effectTypes.RESOLVED;
      effect.result = result;

      if (effect.effect && isRaceEffect(effect.effect)) {
        setRaceWinner(effectId, result);
      }
    }
  }

  return {
    rootSagaStarted,
    effectTriggered,
    effectResolved,
    effectRejected,
    effectCancelled,
    actionDispatched: () => {},
  };
};
