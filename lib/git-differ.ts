type DiffHunk = {
  startLineOriginal: number;
  lineCountOriginal: number;
  startLineNew: number;
  lineCountNew: number;
  changes: string[];
};

function parseDiff(diff: string): DiffHunk[] {
  const lines = diff.split("\n");
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    const hunkHeader = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/;
    const match = hunkHeader.exec(line);

    if (match) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = {
        startLineOriginal: parseInt(match[1], 10),
        lineCountOriginal: parseInt(match[2], 10),
        startLineNew: parseInt(match[3], 10),
        lineCountNew: parseInt(match[4], 10),
        changes: [],
      };
    } else if (currentHunk) {
      currentHunk.changes.push(line);
    }
  }

  if (currentHunk) hunks.push(currentHunk);
  return hunks;
}

export function applyDiff(originalContent: string, diff: string): string {
  const hunks = parseDiff(diff);
  const originalLines = originalContent ? originalContent.split("\n") : [];
  let revisedLines: string[] = [];

  let originalLineIndex = 0;

  for (const hunk of hunks) {
    // Add unchanged lines before the hunk
    while (originalLineIndex < hunk.startLineOriginal - 1) {
      revisedLines.push(originalLines[originalLineIndex]);
      originalLineIndex++;
    }

    // Apply changes within the hunk
    for (const change of hunk.changes) {
      if (change.startsWith("-")) {
        // Remove line (skip it in the original)
        originalLineIndex++;
      } else if (change.startsWith("+")) {
        // Add new line
        revisedLines.push(change.slice(1));
      } else if (change.startsWith(" ")) {
        // Context line, keep it as it is
        revisedLines.push(change.slice(1));
        originalLineIndex++;
      }
    }
  }

  // Add remaining unchanged lines
  while (originalLineIndex < originalLines.length) {
    revisedLines.push(originalLines[originalLineIndex]);
    originalLineIndex++;
  }

  return revisedLines.join("\n");
}

// Example test cases
// const testCases = [
//   {
//     description: "Basic addition and removal",
//     original: `This is the first sentence of the original document.\nThis line remains unchanged.\nThis line will be removed.`,
//     diff: `@@ -1,3 +1,3 @@
//  This is the first sentence of the original document.
//  This line remains unchanged.
// -This line will be removed.
// +This line will be added.`,
//     expected: `This is the first sentence of the original document.\nThis line remains unchanged.\nThis line will be added.`,
//   },
//   {
//     description: "Multiple changes",
//     original: `Line 1\nLine 2\nLine 3\nLine 4\nLine 5`,
//     diff: `@@ -1,5 +1,5 @@
//  Line 1
// -Line 2
// +Line 2 modified
//  Line 3
// -Line 4
// +Line 4 modified
//  Line 5`,
//     expected: `Line 1\nLine 2 modified\nLine 3\nLine 4 modified\nLine 5`,
//   },
//   {
//     description: "Edge case with empty lines",
//     original: `Line 1\n\nLine 3\n\nLine 5`,
//     diff: `@@ -1,5 +1,5 @@
//  Line 1
// -
// +Added line
//  Line 3
// -
// +Added another line
//  Line 5`,
//     expected: `Line 1\nAdded line\nLine 3\nAdded another line\nLine 5`,
//   },
//   {
//     description: "Empty changes",
//     original: `Line 1\nLine 2\nLine 3\nLine 4\nLine 5`,
//     diff: `@@ -1,5 +1,5 @@`,
//     expected: `Line 1\nLine 2\nLine 3\nLine 4\nLine 5`,
//   },
//   {
//     description: "New file",
//     original: "",
//     diff: `@@ -0,0 +1,5 @@
// +Line 1
// +Line 2
// +Line 3
// +Line 4
// +Line 5`,
//     expected: `Line 1\nLine 2\nLine 3\nLine 4\nLine 5`,
//   },
// ];

// testCases.forEach(({ description, original, diff, expected }) => {
//   const result = applyDiff(original, diff);
//   console.log(`Test: ${description}`);
//   console.log(result === expected ? "Passed" : "Failed");
//   if (result !== expected) {
//     console.log(`Expected:\n${expected}`);
//     console.log(`Got:\n${result}`);
//   }
// });
