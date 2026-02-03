"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToneSlider } from "@/components/tone-slider";

interface RuleControlProps {
  controlType: string;
  value: any;
  onChange: (value: any) => void;
  options?: any;
  examplesGood?: any;
  examplesBad?: any;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function RuleControl({
  controlType,
  value,
  onChange,
  options,
  examplesGood,
  examplesBad: _examplesBad,
  label,
  description,
  disabled = false,
}: RuleControlProps) {
  // Handle toggle
  if (controlType === "toggle") {
    return (
      <div className="flex items-center justify-end">
        <Switch
          checked={value === true || value === "true"}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // Handle radio buttons
  if (controlType === "radio") {
    const radioOptions = options?.options || [];
    const currentValue = value !== undefined && value !== null ? String(value) : "";
    
    return (
      <RadioGroup
        value={currentValue}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-3"
      >
        {radioOptions.map((opt: any) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={String(opt.value)} id={`radio-${opt.value}`} />
            <Label
              htmlFor={`radio-${opt.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {opt.label || opt.value}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // Handle select
  if (controlType === "select") {
    const selectOptions = options?.options || [];
    return (
      <Select
        value={String(value || "")}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((opt: any) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label || opt.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Handle slider
  if (controlType === "slider") {
    // For sliders, we need to map the value to 1-5 scale
    // If value is a string like "formal", "neutral", "conversational", map it
    let sliderValue = typeof value === "number" ? value : 3;
    
    if (typeof value === "string") {
      const optionIndex = options?.options?.findIndex((opt: any) => opt.value === value);
      if (optionIndex !== undefined && optionIndex >= 0) {
        sliderValue = optionIndex + 1;
      }
    }

    const labels = options?.options?.map((opt: any) => opt.label) || options?.labels || ["Very Low", "Low", "Neutral", "High", "Very High"];
    
    // Format examples from examplesGood into string[][] format (5 arrays, one for each level)
    const groupedExamples: string[][] = Array(5).fill(null).map(() => []);
    
    if (examplesGood?.examples && Array.isArray(examplesGood.examples)) {
      examplesGood.examples.forEach((ex: any) => {
        if (ex.level >= 1 && ex.level <= 5) {
          const text = ex.text || (typeof ex === "string" ? ex : JSON.stringify(ex));
          groupedExamples[ex.level - 1].push(text);
        }
      });
    }
    
    // Ensure each level has at least one example
    const examplesForSlider = groupedExamples.map((group, index) => 
      group.length > 0 ? group : [`No examples for level ${index + 1}`]
    );

    return (
      <div className="-mx-2">
        <ToneSlider
          label={label || ""}
          description={description || ""}
          value={sliderValue}
          onChange={(newValue) => {
            // Map back to option value (debounced in ToneSlider)
            const selectedOption = options?.options?.[newValue - 1];
            if (selectedOption) {
              onChange(selectedOption.value);
            } else {
              onChange(newValue);
            }
          }}
          examples={examplesForSlider}
          labels={labels.length >= 5 ? labels : ["Very Low", "Low", "Neutral", "High", "Very High"]}
          disabled={disabled}
        />
      </div>
    );
  }

  // Handle list (multi-toggle/checkbox list)
  if (controlType === "list") {
    const listOptions = options?.options || [];
    const currentValue = typeof value === "object" && value !== null ? value : {};

    return (
      <div className="space-y-3">
        {listOptions.map((opt: any) => {
          const isChecked = currentValue[opt.key] === true || currentValue[opt.key] === "true";
          return (
            <div key={opt.key} className="flex items-center justify-between">
              <Label htmlFor={opt.key} className="text-sm font-normal">
                {opt.label}
              </Label>
              <Switch
                id={opt.key}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  onChange({
                    ...currentValue,
                    [opt.key]: checked,
                  });
                }}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback for unknown control types
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <p className="text-sm text-muted-foreground">Control type "{controlType}" not yet supported</p>
    </div>
  );
}

