import { beforeEach, describe, expect, it } from 'vitest';
import { useClientLayoutStore } from './clientLayoutStore';

describe('clientLayoutStore', () => {
  beforeEach(() => {
    useClientLayoutStore.setState({ isSidebarOpen: false, activeSection: null });
  });

  it('starts with a closed sidebar and no active section', () => {
    const state = useClientLayoutStore.getState();

    expect(state.isSidebarOpen).toBe(false);
    expect(state.activeSection).toBeNull();
  });

  it('toggles the sidebar open state', () => {
    useClientLayoutStore.getState().toggleSidebar();
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(true);

    useClientLayoutStore.getState().toggleSidebar();
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('stores the active client section', () => {
    useClientLayoutStore.getState().setActiveSection('store');

    expect(useClientLayoutStore.getState().activeSection).toBe('store');
  });
});
