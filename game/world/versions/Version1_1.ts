
import { MapOrientation, VersionDefinition, ZoneType } from '../../../types';

export const Version1_1: VersionDefinition = {
  versionId: "1.1",
  title: "A NEW BEGINNING",
  description: "The desperate escape from the decaying Omega Nest architecture.",
  maps: [
    {
      id: 1,
      name: "ANCIENT SIGNALS",
      storySnippet: "Radar systems are picking up strange pings from the Omega ruins...",
      bgColor: "#0f172a",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Golden Feather", requiredCount: 1, currentCount: 0, hint: "Neutralize the high-energy decoy unit", isResolved: false },
      hazardsFrequency: 0.2,
      ambientEffect: 'WIND'
    },
    {
      id: 2,
      name: "NEON CORRIDOR",
      storySnippet: "The path is blocked by mechanical debris. Clear the sector!",
      bgColor: "#1e1b4b",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Relic Fragment", requiredCount: 3, currentCount: 0, hint: "Shatter the massive Neon boulders", isResolved: false },
      hazardsFrequency: 0.6,
      ambientEffect: 'CYBER_STATIC'
    },
    {
      id: 3,
      name: "REVERSE FLOW",
      storySnippet: "Vortex winds are pushing you back. Maintain thruster output!",
      bgColor: "#0c4a6e",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Energy Core", requiredCount: 1, currentCount: 0, hint: "Locate and destroy the lead squadron commander", isResolved: false },
      hazardsFrequency: 0.3,
      ambientEffect: 'WIND'
    },
    {
      id: 4,
      name: "FIRE FRONTIER",
      storySnippet: "Thermal levels rising. Watch out for experimental laser grids.",
      bgColor: "#450a0a",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Magma Stone", requiredCount: 5, currentCount: 0, hint: "Demolish the glowing core fragments", isResolved: false },
      hazardsFrequency: 0.8,
      ambientEffect: 'ASH'
    },
    {
      id: 5,
      name: "INVERTED GRAVITY",
      storySnippet: "Space is distorting! Fly sideways to penetrate the inner core.",
      bgColor: "#020617",
      orientation: MapOrientation.RIGHT,
      puzzle: { keyItemName: "Azure Feather", requiredCount: 1, currentCount: 0, hint: "Breach the barrier at the end of the passage", isResolved: false },
      hazardsFrequency: 0.7,
      ambientEffect: 'NONE'
    },
    {
      id: 6,
      name: "MECHANICAL VALLEY",
      storySnippet: "Ancient industrial giants are reawakening after eons.",
      bgColor: "#1e293b",
      orientation: MapOrientation.RIGHT,
      puzzle: { keyItemName: "Ancient Gear", requiredCount: 4, currentCount: 0, hint: "Dismantle the static turret fortifications", isResolved: false },
      hazardsFrequency: 0.9,
      ambientEffect: 'CYBER_STATIC'
    },
    {
      id: 7,
      name: "FROZEN ATMOSPHERE",
      storySnippet: "Sub-zero temperatures are throttling system performance.",
      bgColor: "#0f172a",
      orientation: MapOrientation.LEFT,
      puzzle: { keyItemName: "Ice Crystal", requiredCount: 2, currentCount: 0, hint: "Scan and extract from drifting ice floes", isResolved: false },
      hazardsFrequency: 0.5,
      ambientEffect: 'SNOW'
    },
    {
      id: 8,
      name: "LIGHT LABYRINTH",
      storySnippet: "The exit is near, but the maze is rigged with traps.",
      bgColor: "#020617",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Optical Key", requiredCount: 1, currentCount: 0, hint: "Defeat the sub-boss protecting the gate", isResolved: false },
      hazardsFrequency: 0.4,
      ambientEffect: 'CYBER_STATIC'
    },
    {
      id: 9,
      name: "NEON SUPERSTORM",
      storySnippet: "Entropy rising! Everything is falling apart. Prepare for contact.",
      bgColor: "#1e1b4b",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Light Feather", requiredCount: 1, currentCount: 0, hint: "Gather fragments from the eye of the storm", isResolved: false },
      hazardsFrequency: 1.2,
      ambientEffect: 'WIND'
    },
    {
      id: 10,
      name: "OMEGA ESCAPE GATE",
      storySnippet: "One final push for freedom. Break the seal!",
      bgColor: "#000000",
      orientation: MapOrientation.UP,
      puzzle: { keyItemName: "Freedom", requiredCount: 1, currentCount: 0, hint: "Eradicate THE MOTHER and her core", isResolved: false },
      hazardsFrequency: 0.1,
      ambientEffect: 'NONE'
    }
  ]
};
