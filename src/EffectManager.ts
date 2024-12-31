import { Effect } from "@redux-saga/types";
import { Saga } from "redux-saga";

export interface MonitoredEffect {
  effectId: number;
  parentEffectId?: number;
  name?: string;
  description?: string;
  saga?: Saga;
  root?: boolean;
  args?: any[];
  status: string;
  start?: number;
  end?: number;
  duration?: number;
  error?: any;
  label?: string;
  winner?: boolean;
  result?: any;

  effect?: Effect;
}

export default class EffectManager {
  rootIds: number[];
  map: { [id: number]: MonitoredEffect };
  childIdsMap: { [id: number]: number[] };
  alreadyExecutedEffects: Array<any> = [];

  constructor() {
    this.rootIds = [];
    this.map = {};
    this.childIdsMap = {};
  }

  get(effectId: number): MonitoredEffect {
    return this.map[effectId];
  }

  set(effectId: number, desc: MonitoredEffect): void {
    this.map[effectId] = desc;

    if (desc.parentEffectId && !this.childIdsMap[desc.parentEffectId]) {
      this.childIdsMap[desc.parentEffectId] = [];
    }
    if (desc.parentEffectId) {
      this.childIdsMap[desc.parentEffectId]?.push(effectId);
    }
  }

  setRootEffect(effectId: number, desc: MonitoredEffect): void {
    this.rootIds?.push(effectId);
    this.set(effectId, { ...desc, root: true });
  }

  getRootIds(): number[] {
    return this.rootIds;
  }

  getChildIds(parentEffectId: number): number[] {
    return this.childIdsMap[parentEffectId] || [];
  }

  setAlreadyExecutedEffects(params: any) {
    this.alreadyExecutedEffects.push(params);
  }

  get allAlreadyExecutedEffects(): Array<any> {
    return this.alreadyExecutedEffects;
  }

  clearAlreadyExecutedEffects() { 
    this.alreadyExecutedEffects = [];
  }
}
