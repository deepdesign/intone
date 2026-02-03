"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ToneSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  onValueCommit?: (value: number) => void; // Called when user stops dragging (mouse up)
  examples: string[][]; // 5 arrays, each with 3 examples for that level (1-5)
  labels: string[]; // 5 labels, one for each value (1-5)
  disabled?: boolean;
}

export function ToneSlider({
  label,
  description,
  value,
  onChange,
  onValueCommit,
  examples,
  labels,
  disabled = false,
}: ToneSliderProps) {
  // Ensure value is between 1 and 5
  const clampedValue = Math.max(1, Math.min(5, value || 3));
  const [localValue, setLocalValue] = useState([clampedValue]);
  const isDraggingRef = useRef(false);
  const commitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Only sync with external value when NOT dragging (prevents reverts during drag)
  useEffect(() => {
    if (!isDraggingRef.current) {
      const clamped = Math.max(1, Math.min(5, value || 3));
      setLocalValue([clamped]);
    }
  }, [value]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  const handleValueChange = (newValue: number[]) => {
    const val = newValue[0];
    
    // Update UI immediately - no delay, no debounce
    setLocalValue([val]);
    
    // Notify parent immediately for UI updates (examples, etc.)
    onChange(val);
    
    // Clear any pending commit
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    
    // Schedule commit after user stops dragging (500ms of no changes)
    commitTimerRef.current = setTimeout(() => {
      if (onValueCommit) {
        onValueCommit(val);
      }
    }, 500);
  };

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    // When user releases, commit immediately
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    
    if (onValueCommit) {
      onValueCommit(localValue[0]);
    }
    
    // Allow syncing after a short delay
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const currentValue = localValue[0];
  const currentExamples = examples[currentValue - 1] || examples[0] || [];
  const currentLabel = labels[currentValue - 1] || labels[0];

  return (
    <div className="space-y-3">
      {(label || description) && (
        <div className="space-y-1">
          {label && <Label>{label}</Label>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="space-y-6">
        <div className="px-2">
          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
          >
            <Slider
              value={localValue}
              onValueChange={handleValueChange}
              min={1}
              max={5}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>
          <div className="flex justify-between mt-2">
            {labels.map((label, index) => (
              <span
                key={index}
                className={`text-xs ${
                  currentValue === index + 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Examples ({currentLabel}):
              </p>
              <div className="space-y-2">
                {currentExamples.map((example, index) => (
                  <p key={index} className="text-sm">{example}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
