import { beforeEach, describe, expect, it } from 'vitest';
import { isDocumentAccessible, reconcileProjects, useDocumentStore } from './documentStore';
import { DEFAULT_DOCUMENTS, DEFAULT_PROJECTS } from '../constants/defaults';
import type { ProjectDefinition } from '../types';

const projects: ProjectDefinition[] = [
  { id: 'p1', name: 'P1', subsystems: ['ADCS', 'EPS'], disabledSubsystems: ['EPS'] },
  { id: 'p2', name: 'P2', subsystems: ['MCS'], disabled: true },
];

describe('isDocumentAccessible (ADM-007)', () => {
  it('allows documents in enabled projects and subsystems', () => {
    expect(isDocumentAccessible({ project: 'p1', subsystem: 'ADCS' }, projects)).toBe(true);
    expect(isDocumentAccessible({ project: 'p1' }, projects)).toBe(true);
  });

  it('blocks switched-off subsystems and whole projects', () => {
    expect(isDocumentAccessible({ project: 'p1', subsystem: 'EPS' }, projects)).toBe(false);
    expect(isDocumentAccessible({ project: 'p2', subsystem: 'MCS' }, projects)).toBe(false);
    expect(isDocumentAccessible({ project: 'p2' }, projects)).toBe(false);
  });

  it('treats unknown projects as accessible', () => {
    expect(isDocumentAccessible({ project: 'nope' }, projects)).toBe(true);
  });
});

describe('reconcileProjects', () => {
  const seed: ProjectDefinition[] = [
    { id: 'p1', name: 'P1 renamed', subsystems: ['ADCS', 'EPS', 'COMMS'] },
    { id: 'p3', name: 'New project', subsystems: [] },
  ];

  it('takes names/subsystems from the seed and keeps saved access switches', () => {
    const [p1] = reconcileProjects(projects, seed);
    expect(p1.name).toBe('P1 renamed');
    expect(p1.subsystems).toContain('COMMS');
    expect(p1.disabledSubsystems).toEqual(['EPS']);
  });

  it('adds new seed projects and keeps extra saved ones', () => {
    expect(reconcileProjects(projects, seed).map((p) => p.id)).toEqual(['p1', 'p3', 'p2']);
  });

  it('drops switches for subsystems that no longer exist', () => {
    const [p1] = reconcileProjects([{ ...projects[0], disabledSubsystems: ['EPS', 'Gone'] }], seed);
    expect(p1.disabledSubsystems).toEqual(['EPS']);
  });

  it('falls back to the seed when nothing was saved', () => {
    expect(reconcileProjects(undefined, seed)).toEqual(seed);
  });
});

describe('documentStore access actions', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: DEFAULT_DOCUMENTS, projects: DEFAULT_PROJECTS });
  });

  it('switches a subsystem off and on without touching documents', () => {
    const before = useDocumentStore.getState().documents;
    const { setSubsystemEnabled } = useDocumentStore.getState();
    setSubsystemEnabled('orbit-1-sat', 'ADCS', false);
    expect(useDocumentStore.getState().projects[0].disabledSubsystems).toEqual(['ADCS']);
    setSubsystemEnabled('orbit-1-sat', 'ADCS', true);
    expect(useDocumentStore.getState().projects[0].disabledSubsystems).toEqual([]);
    expect(useDocumentStore.getState().documents).toBe(before);
  });

  it('restores the previous status when a disabled document is re-enabled', () => {
    const { toggleDocumentEnabled } = useDocumentStore.getState();
    const statusOf = () => useDocumentStore.getState().documents.find((d) => d.id === 'seed-adcs-srs')?.status;
    toggleDocumentEnabled('seed-adcs-srs');
    expect(statusOf()).toBe('disabled');
    toggleDocumentEnabled('seed-adcs-srs');
    expect(statusOf()).toBe('indexed');
  });
});
