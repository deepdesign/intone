// Filter examples based on current rule value and control type

export function filterExamplesByValue(
  examplesGood: any,
  examplesBad: any,
  currentValue: any,
  controlType: string
): { do: string[]; dont: string[] } {
  const extractText = (example: any): string => {
    if (typeof example === "string") {
      return example;
    }
    if (example?.text) {
      return example.text;
    }
    return JSON.stringify(example);
  };

  let doExamples: string[] = [];
  let dontExamples: string[] = [];

  if (!examplesGood && !examplesBad) {
    return { do: [], dont: [] };
  }

  // For slider controls, filter by level
  if (controlType === "slider" && examplesGood?.examples) {
    const targetLevel = typeof currentValue === "number" ? currentValue : 3;
    const levelExamples = examplesGood.examples
      .filter((ex: any) => ex.level === targetLevel)
      .map((ex: any) => extractText(ex));
    doExamples = levelExamples;
  } else if (examplesGood?.examples) {
    // For other controls, filter by value if available
    if (typeof currentValue !== "undefined" && currentValue !== null) {
      const filtered = examplesGood.examples.filter((ex: any) => {
        if (ex.value !== undefined) {
          return ex.value === currentValue;
        }
        if (ex.level !== undefined) {
          return ex.level === currentValue;
        }
        return true; // Include all if no value/level match
      });
      doExamples = filtered.map((ex: any) => extractText(ex));
    } else {
      doExamples = examplesGood.examples.map((ex: any) => extractText(ex));
    }
  }

  if (examplesBad?.examples) {
    // For bad examples, show ones that match the opposite value
    if (typeof currentValue !== "undefined" && currentValue !== null && controlType !== "toggle") {
      const filtered = examplesBad.examples.filter((ex: any) => {
        if (ex.value !== undefined) {
          return ex.value !== currentValue;
        }
        return true;
      });
      dontExamples = filtered.map((ex: any) => extractText(ex));
    } else {
      dontExamples = examplesBad.examples.map((ex: any) => extractText(ex));
    }
  }

  return { do: doExamples, dont: dontExamples };
}



