import type { BlogPost } from "../blogData";
import { PART_1 } from "./part1";
import { PART_2 } from "./part2";
import { PART_3 } from "./part3";
import { PART_4 } from "./part4";
import { PART_5 } from "./part5";
import { PART_6 } from "./part6";

// The 30-day system design interview series, Day 1 to Day 30
export const SYSTEM_DESIGN_POSTS: BlogPost[] = [
  ...PART_1,
  ...PART_2,
  ...PART_3,
  ...PART_4,
  ...PART_5,
  ...PART_6,
];
