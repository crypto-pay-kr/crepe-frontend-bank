export interface JoinConditions {
    ageGroups: string[];
    occupations: string[];
    incomeLevels: string[];
  }
  
  export function parseJoinConditions(joinConditions: string): JoinConditions {
    const result: JoinConditions = {
      ageGroups: [],
      occupations: [],
      incomeLevels: [],
    };
    const trimmed = joinConditions.replace(/^\[|\]$/g, "");
    // 각 key: [value, ...] 패턴 추출
    const regex = /(\w+):\s*\[([^\]]*)\]/g;
    let match;
    while ((match = regex.exec(trimmed))) {
      const key = match[1]; // ageGroups, occupations, incomeLevels
      const values = match[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (key === "ageGroups") {
        result.ageGroups = values;
      } else if (key === "occupations") {
        result.occupations = values;
      } else if (key === "incomeLevels") {
        result.incomeLevels = values;
      }
    }
    return result;
  }