/**
 * Unit Tests for Auto-Save Hook
 *
 * Tests the debounced auto-save functionality.
 *
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave, getAutoSaveStatusText, formatLastSaved } from "../../../../src/features/evaluations/hooks/use-auto-save";

// Mock timers
jest.useFakeTimers();

describe("useAutoSave Hook", () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const defaultOptions = {
    evaluationId: "test-eval-123",
    data: { selfRating: 3, selfComments: "Test comment" },
    onSave: mockOnSave,
    debounceMs: 30000,
    minIntervalMs: 5000,
  };

  describe("initialization", () => {
    it("should initialize with idle state", () => {
      const { result } = renderHook(() => useAutoSave(defaultOptions));

      expect(result.current.state).toBe("idle");
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    it("should not trigger save on initial mount", () => {
      renderHook(() => useAutoSave(defaultOptions));

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("debounced auto-save", () => {
    it("should set pending state when data changes", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
      });

      expect(result.current.state).toBe("pending");
      expect(result.current.isDirty).toBe(true);
    });

    it("should not save immediately when data changes", () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should save after debounce delay", async () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
      });

      expect(result.current.state).toBe("pending");

      // Fast-forward debounce timer and flush pending promises
      await act(async () => {
        jest.advanceTimersByTime(30000);
        // Flush microtasks
        await Promise.resolve();
      });

      // Wait for the save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          selfRating: 4,
          selfComments: "Updated",
        });
      });

      expect(result.current.state).toBe("saved");
      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSavedAt).not.toBeNull();
    });

    it("should reset debounce timer on each change", async () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      // First change - advance 15s (half debounce)
      rerender({ data: { selfRating: 4, selfComments: "First" } });
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      // Second change - should reset timer, advance 15s (still half)
      rerender({ data: { selfRating: 5, selfComments: "Second" } });
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      // Should not have saved yet (only 15s since last change)
      expect(mockOnSave).not.toHaveBeenCalled();

      // Advance remaining 15s to complete debounce
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });

      // Now should have saved
      expect(mockOnSave).toHaveBeenCalledWith({
        selfRating: 5,
        selfComments: "Second",
      });
    });

    it("should not save if data hasn't changed", () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      // Same data, different reference
      act(() => {
        rerender({
          data: { selfRating: 3, selfComments: "Test comment" },
        });
        jest.advanceTimersByTime(30000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("manual save (saveNow)", () => {
    it("should save immediately when saveNow is called", async () => {
      const { result } = renderHook(() => useAutoSave(defaultOptions));

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockOnSave).toHaveBeenCalledWith(defaultOptions.data);
      expect(result.current.state).toBe("saved");
    });

    it("should clear pending debounce timer on manual save", async () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data }),
        { initialProps: { data: defaultOptions.data } }
      );

      // Trigger pending save
      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
        jest.advanceTimersByTime(15000);
      });

      expect(result.current.state).toBe("pending");

      // Manual save should clear timer and save immediately
      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Advance remaining time - should not save again
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("minimum interval", () => {
    it("should respect minimum interval between saves", async () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data, minIntervalMs: 5000 }),
        { initialProps: { data: defaultOptions.data } }
      );

      // First save
      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Change data and try to save immediately
      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
      });

      // Advance debounce but not min interval
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await act(async () => {
        await result.current.saveNow();
      });

      // Should not have saved due to min interval
      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Wait for min interval to pass
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should set error state when save fails", async () => {
      mockOnSave.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAutoSave(defaultOptions));

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toBe("Network error");
      expect(result.current.isDirty).toBe(true);
    });

    it("should handle non-Error exceptions", async () => {
      mockOnSave.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAutoSave(defaultOptions));

      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toBe("Failed to save");
    });
  });

  describe("reset", () => {
    it("should reset state to initial values", async () => {
      const { result } = renderHook(() => useAutoSave(defaultOptions));

      // Save and get into saved state
      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.state).toBe("saved");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("enabled option", () => {
    it("should not save when disabled", async () => {
      const { result } = renderHook(() =>
        useAutoSave({ ...defaultOptions, enabled: false })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should not auto-save when disabled", () => {
      const { rerender } = renderHook(
        ({ data }) => useAutoSave({ ...defaultOptions, data, enabled: false }),
        { initialProps: { data: defaultOptions.data } }
      );

      act(() => {
        rerender({ data: { selfRating: 4, selfComments: "Updated" } });
        jest.advanceTimersByTime(30000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("evaluation ID change", () => {
    it("should reset state when evaluation ID changes", async () => {
      const { result, rerender } = renderHook(
        ({ evaluationId }) => useAutoSave({ ...defaultOptions, evaluationId }),
        { initialProps: { evaluationId: "eval-1" } }
      );

      // Save
      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.state).toBe("saved");

      // Change evaluation ID
      act(() => {
        rerender({ evaluationId: "eval-2" });
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.isDirty).toBe(false);
    });
  });
});

describe("getAutoSaveStatusText", () => {
  it("should return correct text for each state", () => {
    expect(getAutoSaveStatusText("idle")).toBe("");
    expect(getAutoSaveStatusText("pending")).toBe("Changes pending...");
    expect(getAutoSaveStatusText("saving")).toBe("Saving...");
    expect(getAutoSaveStatusText("saved")).toBe("All changes saved");
    expect(getAutoSaveStatusText("error")).toBe("Failed to save");
  });
});

describe("formatLastSaved", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return empty string for null date", () => {
    expect(formatLastSaved(null)).toBe("");
  });

  it("should return 'just now' for recent saves", () => {
    const date = new Date("2024-01-15T11:59:30Z"); // 30 seconds ago
    expect(formatLastSaved(date)).toBe("Saved just now");
  });

  it("should return minutes ago for saves within an hour", () => {
    const date = new Date("2024-01-15T11:30:00Z"); // 30 minutes ago
    expect(formatLastSaved(date)).toBe("Saved 30 minutes ago");
  });

  it("should return hours ago for saves within a day", () => {
    const date = new Date("2024-01-15T10:00:00Z"); // 2 hours ago
    expect(formatLastSaved(date)).toBe("Saved 2 hours ago");
  });

  it("should return date for older saves", () => {
    const date = new Date("2024-01-13T12:00:00Z"); // 2 days ago
    expect(formatLastSaved(date)).toBe("Saved on 1/13/2024");
  });
});
