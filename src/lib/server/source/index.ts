import { cfg } from '../config';
import { MainSource } from './main';
import { MockSource } from './mock';
import type { DataSource } from './types';

export const source: DataSource = cfg.source === 'main' ? new MainSource() : new MockSource();
export type { DataSource };
